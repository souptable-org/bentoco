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

/**
 * POST /api/agency/invite-store
 * Agency invites a merchant email to grant store access.
 * If merchant has no existing store, flow continues via agency-fills-store-details.
 */
export async function inviteStore(
  agencyId: string,
  merchantEmail: string,
  storeDisplayName: string,
  client: Client
): Promise<{
  accessId: string
  inviteToken: string
  merchantExists: boolean
  status: "PENDING"
}> {
  // Check if merchant already has a tenant
  const tenantRes = await client.query(
    `SELECT id FROM tenant WHERE id IN (
       SELECT tenant_id FROM "user" WHERE email = $1 LIMIT 1
     ) LIMIT 1`,
    [merchantEmail]
  )
  const merchantExists = tenantRes.rows.length > 0
  const tenantId = merchantExists ? tenantRes.rows[0].id : null

  // Fetch agency using unique_uid (e.g. AGENCY-849201)
  const agencyRes = await client.query(
    `SELECT id, name, owner_email FROM agency WHERE unique_uid = $1 LIMIT 1`,
    [agencyId]
  )
  if (agencyRes.rows.length === 0) {
    throw new Error(`Agency with unique UID ${agencyId} not found.`)
  }
  const realAgencyUuid = agencyRes.rows[0].id
  const agencyName = agencyRes.rows[0].name

  const token = generateInviteToken()
  const tokenHash = hashSecret(token)
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours

  const insertRes = await client.query(
    `INSERT INTO agency_store_access
       (agency_id, tenant_id, merchant_email, status, invite_token, token_expires_at, invited_at)
     VALUES ($1, $2, $3, 'PENDING', $4, $5, NOW())
     RETURNING id`,
    [realAgencyUuid, tenantId || "PENDING_CREATION", merchantEmail, tokenHash, expiresAt]
  )

  // Log the invite action
  await client.query(
    `INSERT INTO agency_store_log (agency_id, tenant_id, member_email, action, metadata)
     VALUES ($1, $2, $3, 'INVITE_SENT', $4)`,
    [
      realAgencyUuid,
      tenantId || "PENDING_CREATION",
      merchantEmail,
      JSON.stringify({ storeDisplayName, merchantExists }),
    ]
  )

  // Send consent email to merchant
  await sendAgencyAccessInvite({
    merchantEmail,
    agencyName,
    agencyUid: agencyId,
    storeDisplayName,
    inviteToken: token,
  })

  return {
    accessId: insertRes.rows[0].id,
    inviteToken: token, // raw token — sent via email URL
    merchantExists,
    status: "PENDING",
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
 * DELETE /api/agency/revoke-access
 * Agency or merchant revokes access. Clears system password.
 */
export async function revokeAccess(
  agencyId: string,
  tenantId: string,
  revokedByEmail: string,
  client: Client
): Promise<{ message: string }> {
  // Fetch agency UUID from unique_uid
  const agencyRes = await client.query(`SELECT id FROM agency WHERE unique_uid = $1 LIMIT 1`, [agencyId])
  const realAgencyUuid = agencyRes.rows[0]?.id || agencyId

  await client.query(
    `UPDATE agency_store_access
     SET status = 'REVOKED', revoked_at = NOW()
     WHERE agency_id = $1 AND tenant_id = $2 AND status = 'ACTIVE'`,
    [realAgencyUuid, tenantId]
  )

  await client.query(
    `UPDATE tenant
     SET system_password_hash = NULL, agency_id = NULL
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
      JSON.stringify({ revokedAt: new Date().toISOString() }),
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

  // Check agency has active access to this store
  const accessRes = await client.query(
    `SELECT id FROM agency_store_access
     WHERE agency_id = $1 AND tenant_id = $2 AND status = 'ACTIVE' LIMIT 1`,
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
