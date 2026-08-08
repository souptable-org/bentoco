import crypto from "crypto"
import { Client } from "pg"
import { sendAgencyAccessInvite, sendAccessConfirmedToAgency } from "./email"


export function generateInviteToken(): string {
  return crypto.randomBytes(48).toString("hex")
}

export function generateSystemPassword(): string {
  return crypto.randomBytes(32).toString("hex")
}

export function hashSecret(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex")
}

export type AgencyInviteType = "new_merchant" | "existing_merchant"

/**
 * POST /api/agency/invite-store
 * Agency invites a merchant — does NOT create the store.
 * Merchant must sign up / log in, confirm agency 6-digit code, then access activates.
 */
export async function inviteStore(
  agencyId: string,
  merchantEmail: string,
  storeDisplayName: string,
  client: Client,
  inviteType: AgencyInviteType = "new_merchant"
): Promise<{
  accessId: string
  inviteToken: string
  merchantExists: boolean
  inviteType: AgencyInviteType
  agencyUid: string
  agencyName: string
  status: "PENDING"
  inviteUrl: string
  emailPreviewUrl?: string
  message: string
}> {
  const email = merchantEmail.trim().toLowerCase()
  if (!email.includes("@")) {
    throw new Error("Valid merchant email is required.")
  }

  // Check if merchant already has a tenant
  const tenantRes = await client.query(
    `SELECT id FROM tenant WHERE id IN (
       SELECT tenant_id FROM "user" WHERE lower(email) = $1 LIMIT 1
     ) LIMIT 1`,
    [email]
  )
  const merchantExists = tenantRes.rows.length > 0
  const tenantId = merchantExists ? tenantRes.rows[0].id : null

  if (inviteType === "existing_merchant" && !merchantExists) {
    // Still allow invite — they may register; treat like new path messaging
  }

  // Fetch agency using unique_uid (e.g. AGENCY-849201)
  const agencyRes = await client.query(
    `SELECT id, name, owner_email, unique_uid FROM agency
     WHERE unique_uid = $1 OR id::text = $1 LIMIT 1`,
    [agencyId]
  )
  if (agencyRes.rows.length === 0) {
    throw new Error(`Agency with unique UID ${agencyId} not found.`)
  }
  const realAgencyUuid = agencyRes.rows[0].id
  const agencyName = agencyRes.rows[0].name
  const agencyUid = agencyRes.rows[0].unique_uid

  const token = generateInviteToken()
  const tokenHash = hashSecret(token)
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours

  // Never create store here — only a PENDING access request
  const insertRes = await client.query(
    `INSERT INTO agency_store_access
       (agency_id, tenant_id, store_id, merchant_email, status, invite_token, token_expires_at, invited_at)
     VALUES ($1, $2, $2, $3, 'PENDING', $4, $5, NOW())
     RETURNING id`,
    [
      realAgencyUuid,
      tenantId || "PENDING_CREATION",
      email,
      tokenHash,
      expiresAt,
    ]
  )

  await client.query(
    `INSERT INTO agency_store_log (agency_id, tenant_id, member_email, action, metadata)
     VALUES ($1, $2, $3, 'INVITE_SENT', $4)`,
    [
      realAgencyUuid,
      tenantId || "PENDING_CREATION",
      email,
      JSON.stringify({
        storeDisplayName,
        merchantExists,
        inviteType,
        agencyUid,
      }),
    ]
  )

  const frontendUrl = (
    process.env.ADMIN_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:7001"
  ).replace(/\/$/, "")

  const inviteUrl =
    `${frontendUrl}/login?agency_invite=${encodeURIComponent(token)}` +
    `&agency=${encodeURIComponent(agencyUid)}` +
    `&email=${encodeURIComponent(email)}` +
    `&store=${encodeURIComponent(storeDisplayName || "")}` +
    `&type=${encodeURIComponent(inviteType)}`

  // Email may fail in local dev — still return inviteUrl/token
  let emailPreviewUrl: string | undefined
  try {
    const sent = await sendAgencyAccessInvite({
      merchantEmail: email,
      agencyName,
      agencyUid,
      storeDisplayName: storeDisplayName || "Your store",
      inviteToken: token,
      inviteUrl,
      inviteType,
    })
    if (sent?.previewUrl) {
      emailPreviewUrl = String(sent.previewUrl)
    }
  } catch (emailErr: any) {
    console.warn(
      "[inviteStore] email failed (invite still created):",
      emailErr?.message
    )
  }

  return {
    accessId: insertRes.rows[0].id,
    inviteToken: token,
    merchantExists,
    inviteType,
    agencyUid,
    agencyName,
    status: "PENDING",
    inviteUrl,
    emailPreviewUrl,
    message:
      inviteType === "new_merchant"
        ? "Invite sent. Merchant must create their account and confirm your agency code — you cannot create the store for them."
        : "Access request sent. Merchant must confirm with your agency code.",
  }
}

/**
 * POST /api/agency/complete-invite
 * Merchant finished signup/login + entered agency 6-digit code.
 * Creates tenant/store ONLY if merchant still has none (merchant-owned creation),
 * then activates agency access.
 */
export async function completeAgencyInvite(
  rawToken: string,
  agencyCodeOrUid: string,
  merchantEmail: string,
  storeDisplayName: string | undefined,
  client: Client
): Promise<{
  tenantId: string
  agencyId: string
  agencyUid: string
  status: "ACTIVE" | "NEW"
  needsOnboarding: boolean
  message: string
}> {
  const email = merchantEmail.trim().toLowerCase()
  const tokenHash = hashSecret(rawToken.trim())

  const accessRes = await client.query(
    `SELECT id, agency_id, tenant_id, merchant_email, token_expires_at, status
     FROM agency_store_access
     WHERE invite_token = $1 LIMIT 1`,
    [tokenHash]
  )
  if (accessRes.rows.length === 0) {
    throw new Error("Invalid or expired invite. Ask your agency to resend.")
  }
  const access = accessRes.rows[0]

  if (access.status === "ACTIVE") {
    throw new Error("This invite was already completed.")
  }
  if (access.status === "REVOKED") {
    throw new Error("This invite was revoked.")
  }
  if (
    access.token_expires_at &&
    new Date() > new Date(access.token_expires_at)
  ) {
    throw new Error("Invite expired. Ask your agency to send a new one.")
  }

  if (
    access.merchant_email &&
    String(access.merchant_email).toLowerCase() !== email
  ) {
    throw new Error("Sign up with the same email the agency invited.")
  }

  const agencyRes = await client.query(
    `SELECT id, name, unique_uid FROM agency WHERE id = $1 LIMIT 1`,
    [access.agency_id]
  )
  if (agencyRes.rows.length === 0) {
    throw new Error("Agency not found for this invite.")
  }
  const agency = agencyRes.rows[0]

  // Normalize code: 849201 or AGENCY-849201
  const rawCode = (agencyCodeOrUid || "").trim().toUpperCase().replace(/\s+/g, "")
  const digits = rawCode.replace(/\D/g, "")
  const expectedUid = String(agency.unique_uid || "").toUpperCase()
  const codeMatches =
    rawCode === expectedUid ||
    (digits.length === 6 && expectedUid.endsWith(digits)) ||
    expectedUid === `AGENCY-${digits}`

  if (!codeMatches) {
    throw new Error(
      "Agency code does not match this invite. Check the 6 digits your agency shared."
    )
  }

  // Resolve or create tenant — merchant creates ownership, not agency alone
  let tenantId: string | null =
    access.tenant_id && access.tenant_id !== "PENDING_CREATION"
      ? access.tenant_id
      : null
  let createdNewTenant = false

  if (!tenantId) {
    const userTenant = await client.query(
      `SELECT tenant_id FROM "user"
       WHERE lower(email) = $1 AND tenant_id IS NOT NULL
       LIMIT 1`,
      [email]
    )
    tenantId = userTenant.rows[0]?.tenant_id || null
  }

  if (!tenantId) {
    createdNewTenant = true
    const name =
      (storeDisplayName || "").trim() ||
      email.split("@")[0] ||
      "My Store"
    const subdomainBase = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40)
    const subdomain = `${subdomainBase || "store"}-${Date.now().toString(36)}`

    const created = await client.query(
      `INSERT INTO tenant (store_name, subdomain, ownership_status, agency_id, plan, can_go_live)
       VALUES ($1, $2, 'AGENCY_MANAGED', $3, 'free', FALSE)
       RETURNING id`,
      [name, subdomain, agency.id]
    )
    tenantId = created.rows[0].id

    await client.query(
      `UPDATE "user" SET tenant_id = $1 WHERE lower(email) = $2 AND tenant_id IS NULL`,
      [tenantId, email]
    )
  } else {
    await client.query(
      `UPDATE tenant
       SET agency_id = $1, ownership_status = 'AGENCY_MANAGED'
       WHERE id = $2`,
      [agency.id, tenantId]
    )
  }

  // New store → NEW (needs configure/onboarding). Existing store → ACTIVE.
  const accessStatus = createdNewTenant ? "NEW" : "ACTIVE"

  await client.query(
    `UPDATE agency_store_access
     SET status = $3,
         confirmed_at = NOW(),
         invite_token = NULL,
         tenant_id = $2,
         store_id = $2,
         revoked_at = NULL
     WHERE id = $1`,
    [access.id, tenantId, accessStatus]
  )

  await client.query(
    `INSERT INTO agency_store_log (agency_id, tenant_id, member_email, action, metadata)
     VALUES ($1, $2, $3, 'INVITE_COMPLETED', $4)`,
    [
      agency.id,
      tenantId,
      email,
      JSON.stringify({
        agencyUid: agency.unique_uid,
        completedAt: new Date().toISOString(),
        accessStatus,
        createdNewTenant,
      }),
    ]
  )

  return {
    tenantId,
    agencyId: agency.id,
    agencyUid: agency.unique_uid,
    agencyName: agency.name as string,
    status: accessStatus,
    needsOnboarding: createdNewTenant,
    message: createdNewTenant
      ? "Store created as NEW. Finish store setup (onboarding) before it is fully Active."
      : "Agency access confirmed. You can open this existing store.",
  }
}

/**
 * POST /api/agency/mark-store-configured
 * After merchant/agency finishes onboarding setup: NEW → ACTIVE.
 */
export async function markStoreConfigured(
  tenantId: string,
  agencyIdOrUid: string | undefined,
  configuredByEmail: string,
  setup: {
    storeName?: string
    subdomain?: string
    states?: string[]
    gateway?: string
    importSource?: string
  },
  client: Client
): Promise<{ tenantId: string; status: "ACTIVE"; message: string }> {
  let tid = (tenantId || "").trim()
  const email = (configuredByEmail || "").trim().toLowerCase()
  const name =
    (setup.storeName || "").trim() || email.split("@")[0] || "My Store"

  // Organic signup may finish onboarding before a tenant id exists
  if (!tid || tid === "pending" || tid === "PENDING_CREATION") {
    if (email) {
      const existing = await client.query(
        `SELECT tenant_id FROM "user"
         WHERE lower(email) = $1 AND tenant_id IS NOT NULL LIMIT 1`,
        [email]
      )
      tid = existing.rows[0]?.tenant_id || ""
    }
    if (!tid) {
      const subdomainBase = (setup.subdomain || name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40)
      const subdomain = `${subdomainBase || "store"}-${Date.now().toString(36)}`
      const created = await client.query(
        `INSERT INTO tenant (store_name, subdomain, ownership_status, plan, can_go_live)
         VALUES ($1, $2, 'INDEPENDENT_MERCHANT', 'free', TRUE)
         RETURNING id`,
        [name, subdomain]
      )
      tid = created.rows[0].id
      if (email) {
        await client.query(
          `UPDATE "user" SET tenant_id = $1 WHERE lower(email) = $2 AND tenant_id IS NULL`,
          [tid, email]
        )
      }
    }
  }

  if (!tid) {
    throw new Error("tenantId is required (or email to create a store).")
  }

  if (setup.storeName?.trim()) {
    await client.query(
      `UPDATE tenant SET store_name = $1 WHERE id::text = $2`,
      [setup.storeName.trim(), tid]
    )
  }

  await client.query(
    `UPDATE tenant SET can_go_live = TRUE WHERE id::text = $1`,
    [tid]
  )

  let agencyFilter = ""
  const params: any[] = [tid]
  if (agencyIdOrUid) {
    const a = await client.query(
      `SELECT id FROM agency WHERE unique_uid = $1 OR id::text = $1 LIMIT 1`,
      [agencyIdOrUid]
    )
    if (a.rows[0]?.id) {
      params.push(a.rows[0].id)
      agencyFilter = ` AND agency_id = $2`
    }
  }

  const updated = await client.query(
    `UPDATE agency_store_access
     SET status = 'ACTIVE', confirmed_at = COALESCE(confirmed_at, NOW())
     WHERE (tenant_id = $1 OR store_id = $1)
       AND status IN ('NEW', 'ACTIVE')
       ${agencyFilter}
     RETURNING id, agency_id`,
    params
  )

  if (updated.rows[0]) {
    await client.query(
      `INSERT INTO agency_store_log (agency_id, tenant_id, member_email, action, metadata)
       VALUES ($1, $2, $3, 'STORE_CONFIGURED', $4)`,
      [
        updated.rows[0].agency_id,
        tid,
        email || "unknown",
        JSON.stringify({
          ...setup,
          configuredAt: new Date().toISOString(),
        }),
      ]
    )
  }

  return {
    tenantId: tid,
    status: "ACTIVE",
    message: "Store setup complete. Status is now Active.",
  }
}

/**
 * GET /api/agency/confirm-access?token=xxx
 * Merchant clicks email link. Validates token, activates access,
 * generates system password for agency session bridging.
 */
export async function confirmAccess(
  rawToken: string,
  client: Client
): Promise<{ tenantId: string; agencyId: string; message: string }> {
  const tokenHash = hashSecret(rawToken)

  const accessRes = await client.query(
    `SELECT id, agency_id, tenant_id, merchant_email, token_expires_at, status
     FROM agency_store_access
     WHERE invite_token = $1 LIMIT 1`,
    [tokenHash]
  )

  if (accessRes.rows.length === 0) {
    throw new Error("Invalid or expired invite link.")
  }

  const access = accessRes.rows[0]

  if (access.status === "ACTIVE") {
    throw new Error("This invite has already been confirmed.")
  }

  if (access.status === "REVOKED") {
    throw new Error("This invite has been revoked by the agency.")
  }

  if (new Date() > new Date(access.token_expires_at)) {
    throw new Error("Invite link has expired. Ask the agency to resend.")
  }

  // Generate system password — only stored hashed, never returned to agency
  const sysPassword = generateSystemPassword()
  const sysPasswordHash = hashSecret(sysPassword)

  // Activate access
  await client.query(
    `UPDATE agency_store_access
     SET status = 'ACTIVE', confirmed_at = NOW(), invite_token = NULL
     WHERE id = $1`,
    [access.id]
  )

  // Store system password hash on tenant
  await client.query(
    `UPDATE tenant
     SET system_password_hash = $1, agency_id = $2
     WHERE id = $3`,
    [sysPasswordHash, access.agency_id, access.tenant_id]
  )

  // Log confirmation
  await client.query(
    `INSERT INTO agency_store_log (agency_id, tenant_id, member_email, action, metadata)
     VALUES ($1, $2, $3, 'INVITE_CONFIRMED', $4)`,
    [
      access.agency_id,
      access.tenant_id,
      access.merchant_email,
      JSON.stringify({ confirmedAt: new Date().toISOString() }),
    ]
  )

  // Notify agency owner that merchant confirmed
  const agencyRes = await client.query(
    `SELECT name, owner_email FROM agency WHERE id = $1 LIMIT 1`,
    [access.agency_id]
  )
  const agencyName       = agencyRes.rows[0]?.name        || "Your Agency"
  const agencyOwnerEmail = agencyRes.rows[0]?.owner_email || ""

  if (agencyOwnerEmail) {
    await sendAccessConfirmedToAgency({
      agencyOwnerEmail,
      agencyName,
      merchantEmail: access.merchant_email,
      storeDisplayName: access.tenant_id,
      dashboardUrl: "http://localhost:7001/agency/stores",
    })
  }

  return {
    tenantId: access.tenant_id,
    agencyId: access.agency_id,
    message: "Access confirmed. The agency can now manage your store.",
  }
}

/**
 * POST /api/agency/request-revoke
 * Merchant requests revoke — does NOT drop access yet.
 * Status becomes REVOKE_REQUESTED; agency must Accept revoke in Stores ⋮ menu.
 */
export async function requestRevokeAccess(
  agencyId: string,
  tenantId: string,
  requestedByEmail: string,
  client: Client
): Promise<{ message: string; status: "REVOKE_REQUESTED" }> {
  const agencyRes = await client.query(
    `SELECT id FROM agency WHERE unique_uid = $1 OR id::text = $1 LIMIT 1`,
    [agencyId]
  )
  const realAgencyUuid = agencyRes.rows[0]?.id || agencyId

  const update = await client.query(
    `UPDATE agency_store_access
     SET status = 'REVOKE_REQUESTED'
     WHERE agency_id = $1
       AND tenant_id = $2
       AND status IN ('ACTIVE', 'PENDING')
     RETURNING id`,
    [realAgencyUuid, tenantId]
  )

  if (update.rows.length === 0) {
    // Maybe already requested
    const existing = await client.query(
      `SELECT status FROM agency_store_access
       WHERE agency_id = $1 AND tenant_id = $2 LIMIT 1`,
      [realAgencyUuid, tenantId]
    )
    if (existing.rows[0]?.status === "REVOKE_REQUESTED") {
      return {
        message:
          "Revoke already requested. Waiting for the agency to accept.",
        status: "REVOKE_REQUESTED",
      }
    }
    throw new Error(
      "No active agency access found to request revoke for this store."
    )
  }

  await client.query(
    `INSERT INTO agency_store_log (agency_id, tenant_id, member_email, action, metadata)
     VALUES ($1, $2, $3, 'REVOKE_REQUESTED', $4)`,
    [
      realAgencyUuid,
      tenantId,
      requestedByEmail,
      JSON.stringify({ requestedAt: new Date().toISOString() }),
    ]
  )

  return {
    message:
      "Revoke requested. Status is Revoke requested until the agency accepts.",
    status: "REVOKE_REQUESTED",
  }
}

/**
 * DELETE /api/agency/revoke-access  (agency Accept revoke, or force complete)
 * Finalizes revoke from ACTIVE or REVOKE_REQUESTED → REVOKED.
 * Clears tenant agency link / system password.
 */
export async function revokeAccess(
  agencyId: string,
  tenantId: string,
  revokedByEmail: string,
  client: Client
): Promise<{ message: string }> {
  // Fetch agency UUID from unique_uid
  const agencyRes = await client.query(
    `SELECT id FROM agency WHERE unique_uid = $1 OR id::text = $1 LIMIT 1`,
    [agencyId]
  )
  const realAgencyUuid = agencyRes.rows[0]?.id || agencyId

  const update = await client.query(
    `UPDATE agency_store_access
     SET status = 'REVOKED', revoked_at = NOW()
     WHERE agency_id = $1
       AND tenant_id = $2
       AND status IN ('ACTIVE', 'PENDING', 'REVOKE_REQUESTED')
     RETURNING id, status`,
    [realAgencyUuid, tenantId]
  )

  if (update.rows.length === 0) {
    throw new Error("No revocable agency access found for this store.")
  }

  await client.query(
    `UPDATE tenant
     SET system_password_hash = NULL,
         agency_id = NULL,
         ownership_status = 'INDEPENDENT_MERCHANT',
         transfer_code_hash = NULL,
         transfer_expires_at = NULL
     WHERE id = $1`,
    [tenantId]
  )

  await client.query(
    `INSERT INTO agency_store_log (agency_id, tenant_id, member_email, action, metadata)
     VALUES ($1, $2, $3, 'ACCESS_REVOKED', $4)`,
    [
      realAgencyUuid,
      tenantId,
      revokedByEmail,
      JSON.stringify({
        revokedAt: new Date().toISOString(),
        acceptedByAgency: true,
      }),
    ]
  )

  return { message: "Agency access has been revoked successfully." }
}

/**
 * POST /api/agency/member-login
 * Agency member attempts to enter a merchant store.
 * Validates RBAC, writes audit log, returns scoped session token.
 */
export async function agencyMemberLogin(
  agencyId: string,
  memberId: string,
  tenantId: string,
  ipAddress: string,
  client: Client
): Promise<{
  allowed: boolean
  rbacRole?: string
  sessionToken?: string
  redirectUrl?: string
  reason?: string
}> {
  // Fetch agency UUID from unique_uid
  const agencyRes = await client.query(`SELECT id FROM agency WHERE unique_uid = $1 LIMIT 1`, [agencyId])
  const realAgencyUuid = agencyRes.rows[0]?.id || agencyId

  // ACTIVE / NEW (setup) / REVOKE_REQUESTED (until agency accepts revoke)
  const accessRes = await client.query(
    `SELECT id FROM agency_store_access
     WHERE agency_id = $1 AND tenant_id = $2
       AND status IN ('ACTIVE', 'NEW', 'REVOKE_REQUESTED')
     LIMIT 1`,
    [realAgencyUuid, tenantId]
  )

  if (accessRes.rows.length === 0) {
    return { allowed: false, reason: "Agency does not have active access to this store." }
  }

  // Check member RBAC
  const memberRes = await client.query(
    `SELECT id, email, rbac_role FROM agency_team_member
     WHERE agency_id = $1 AND id = $2 LIMIT 1`,
    [realAgencyUuid, memberId]
  )

  if (memberRes.rows.length === 0) {
    return { allowed: false, reason: "Agency member not found or not part of this agency." }
  }

  const member = memberRes.rows[0]

  // Issue a scoped session token (short-lived, 8hr)
  const sessionToken = crypto.randomBytes(32).toString("hex")
  const sessionHash = hashSecret(sessionToken)

  // Log session start
  await client.query(
    `INSERT INTO agency_store_log
       (agency_id, tenant_id, member_id, member_email, action, ip_address, metadata)
     VALUES ($1, $2, $3, $4, 'SESSION_START', $5, $6)`,
    [
      realAgencyUuid,
      tenantId,
      member.id,
      member.email,
      ipAddress,
      JSON.stringify({ rbacRole: member.rbac_role, sessionHash }),
    ]
  )

  return {
    allowed: true,
    rbacRole: member.rbac_role,
    sessionToken,
    redirectUrl: `http://${tenantId}.localhost:7001?agency_session=${sessionToken}`,
  }
}

export async function getAccessLog(
  agencyId: string,
  tenantId: string | undefined,
  client: Client
): Promise<{ logs: any[] }> {
  // Fetch agency UUID from unique_uid
  const agencyRes = await client.query(`SELECT id FROM agency WHERE unique_uid = $1 LIMIT 1`, [agencyId])
  const realAgencyUuid = agencyRes.rows[0]?.id || agencyId

  let query = `
    SELECT
      l.id,
      l.action,
      l.member_email,
      l.ip_address,
      l.metadata,
      l.created_at,
      t.store_name as store_name
    FROM agency_store_log l
    LEFT JOIN tenant t ON l.tenant_id = t.id::text
    WHERE l.agency_id = $1
  `
  const params: any[] = [realAgencyUuid]

  if (tenantId) {
    query += ` AND l.tenant_id = $2`
    params.push(tenantId)
  }

  query += ` ORDER BY l.created_at DESC LIMIT 200`

  const logsRes = await client.query(query, params)
  return { logs: logsRes.rows }
}
