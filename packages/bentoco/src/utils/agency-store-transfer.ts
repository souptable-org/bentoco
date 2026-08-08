import { Client } from "pg"
import crypto from "crypto"

export interface AgencyAccountResult {
  agencyId: string
  name: string
  subdomain: string
  uniqueUid: string
  ownerEmail: string
}

export interface StoreTransferResult {
  tenantId: string
  ownershipStatus: "INDEPENDENT_MERCHANT" | "AGENCY_MANAGED" | "TRANSFER_PENDING"
  agencyId?: string
  transferCode?: string
  message: string
}

function hashTransferCode(code: string): string {
  return crypto.createHash("sha256").update(code.trim()).digest("hex")
}

/**
 * Generates a 6-digit numeric confirmation code
 */
export function generateTransferCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * Creates a new Agency Account with a 1-click Unique UID
 */
export async function createAgencyAccount(
  name: string,
  subdomain: string,
  ownerEmail: string,
  ownerUserId: string,
  client: Client
): Promise<AgencyAccountResult> {
  const uniqueUid = `AGENCY-${Math.floor(100000 + Math.random() * 900000)}`

  const agencyRes = await client.query(
    `INSERT INTO agency (name, subdomain, unique_uid, owner_email)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, subdomain, unique_uid, owner_email`,
    [name, subdomain, uniqueUid, ownerEmail]
  )

  const agency = agencyRes.rows[0]

  await client.query(
    `INSERT INTO agency_team_member (agency_id, user_id, email, role)
     VALUES ($1, $2, $3, 'AGENCY_OWNER')`,
    [agency.id, ownerUserId, ownerEmail]
  )

  return {
    agencyId: agency.id,
    name: agency.name,
    subdomain: agency.subdomain,
    uniqueUid: agency.unique_uid,
    ownerEmail: agency.owner_email,
  }
}

/**
 * Normalize merchant input to AGENCY-XXXXXX.
 * Accepts "849201", "AGENCY-849201", or "agency 849201".
 */
export function normalizeAgencyUid(input: string): string {
  const raw = (input || "").trim().toUpperCase().replace(/\s+/g, "")
  if (!raw) {
    throw new Error("Enter the 6-digit agency code.")
  }
  if (/^AGENCY-\d{6}$/.test(raw)) {
    return raw
  }
  const digits = raw.replace(/\D/g, "")
  if (digits.length === 6) {
    return `AGENCY-${digits}`
  }
  throw new Error(
    "Enter the 6-digit agency code (e.g. 849201). Your agency shares this."
  )
}

/**
 * Merchant REQUESTS agency access (does not attach yet).
 * Creates agency_store_access PENDING — agency must Accept from their dashboard.
 */
export async function requestAgencyLink(
  tenantId: string,
  agencyCodeOrUid: string,
  merchantEmail: string,
  client: Client
): Promise<{
  tenantId: string
  agencyId: string
  agencyUid: string
  agencyName: string
  status: "PENDING"
  message: string
}> {
  const agencyUid = normalizeAgencyUid(agencyCodeOrUid)
  const agencyRes = await client.query(
    `SELECT id, name, unique_uid FROM agency WHERE unique_uid = $1 LIMIT 1`,
    [agencyUid]
  )
  if (agencyRes.rows.length === 0) {
    throw new Error(`No agency found for code ${agencyUid}. Check the 6 digits.`)
  }
  const agency = agencyRes.rows[0]

  const existing = await client.query(
    `SELECT id, status FROM agency_store_access
     WHERE agency_id = $1 AND tenant_id = $2 LIMIT 1`,
    [agency.id, tenantId]
  )
  if (existing.rows[0]) {
    const st = String(existing.rows[0].status || "").toUpperCase()
    if (st === "ACTIVE") {
      throw new Error("This agency already has access to your store.")
    }
    if (st === "PENDING") {
      return {
        tenantId,
        agencyId: agency.id,
        agencyUid: agency.unique_uid,
        agencyName: agency.name,
        status: "PENDING",
        message: `Access already requested for ${agency.name}. Waiting for them to accept.`,
      }
    }
    if (st === "REVOKE_REQUESTED") {
      throw new Error(
        "A revoke is in progress with this agency. Wait until that is finished."
      )
    }
    // REVOKED or other → re-open as PENDING
    await client.query(
      `UPDATE agency_store_access
       SET status = 'PENDING',
           invited_at = NOW(),
           confirmed_at = NULL,
           revoked_at = NULL,
           merchant_email = $2
       WHERE id = $1`,
      [existing.rows[0].id, merchantEmail]
    )
  } else {
    await client.query(
      `
      INSERT INTO agency_store_access
        (agency_id, tenant_id, store_id, merchant_email, status, invited_at)
      VALUES ($1, $2, $2, $3, 'PENDING', NOW())
      `,
      [agency.id, tenantId, merchantEmail]
    )
  }

  await client.query(
    `
    INSERT INTO agency_store_log (agency_id, tenant_id, member_email, action, metadata)
    VALUES ($1, $2, $3, 'ACCESS_REQUESTED', $4)
    `,
    [
      agency.id,
      tenantId,
      merchantEmail,
      JSON.stringify({ agencyUid: agency.unique_uid, agencyName: agency.name }),
    ]
  )

  return {
    tenantId,
    agencyId: agency.id,
    agencyUid: agency.unique_uid,
    agencyName: agency.name,
    status: "PENDING",
    message: `Access requested for ${agency.name}. They must Accept from their Stores dashboard.`,
  }
}

/**
 * Agency accepts a merchant access request (PENDING → ACTIVE).
 */
export async function acceptAgencyLink(
  tenantId: string,
  agencyIdOrUid: string,
  acceptedByEmail: string,
  client: Client
): Promise<{
  tenantId: string
  agencyId: string
  status: "ACTIVE"
  message: string
}> {
  const agencyRes = await client.query(
    `SELECT id, name, unique_uid FROM agency
     WHERE unique_uid = $1 OR id::text = $1 LIMIT 1`,
    [agencyIdOrUid]
  )
  if (agencyRes.rows.length === 0) {
    throw new Error("Agency not found.")
  }
  const agency = agencyRes.rows[0]

  const update = await client.query(
    `
    UPDATE agency_store_access
    SET status = 'ACTIVE', confirmed_at = NOW(), revoked_at = NULL
    WHERE agency_id = $1
      AND tenant_id = $2
      AND status = 'PENDING'
    RETURNING id
    `,
    [agency.id, tenantId]
  )
  if (update.rows.length === 0) {
    throw new Error(
      "No pending access request for this store. Merchant must request first."
    )
  }

  await client.query(
    `
    UPDATE tenant
    SET agency_id = $1,
        ownership_status = 'AGENCY_MANAGED',
        transfer_code_hash = NULL,
        transfer_expires_at = NULL
    WHERE id = $2
    `,
    [agency.id, tenantId]
  )

  await client.query(
    `
    INSERT INTO agency_store_log (agency_id, tenant_id, member_email, action, metadata)
    VALUES ($1, $2, $3, 'ACCESS_ACCEPTED', $4)
    `,
    [
      agency.id,
      tenantId,
      acceptedByEmail,
      JSON.stringify({
        agencyName: agency.name,
        ownershipStatus: "AGENCY_MANAGED",
      }),
    ]
  )

  return {
    tenantId,
    agencyId: agency.id,
    status: "ACTIVE",
    message: `Access accepted. You can now open ${agency.name ? "this store" : "the store"}.`,
  }
}

/**
 * Merchant initiates store delegation by entering target Agency Unique UID
 * @deprecated Prefer requestAgencyLink + acceptAgencyLink (agency accepts).
 */
export async function initiateStoreDelegationToAgency(
  tenantId: string,
  agencyUniqueUid: string,
  client: Client
): Promise<StoreTransferResult> {
  const agencyUid = normalizeAgencyUid(agencyUniqueUid)
  const agencyRes = await client.query(`SELECT id, name FROM agency WHERE unique_uid = $1 LIMIT 1`, [
    agencyUid,
  ])

  if (agencyRes.rows.length === 0) {
    throw new Error(`Invalid Agency Unique UID: ${agencyUid}`)
  }

  const agency = agencyRes.rows[0]
  const rawCode = generateTransferCode()
  const codeHash = hashTransferCode(rawCode)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minute handshake window

  await client.query(
    `UPDATE tenant 
     SET transfer_code_hash = $1, transfer_expires_at = $2, ownership_status = 'TRANSFER_PENDING'
     WHERE id = $3`,
    [codeHash, expiresAt, tenantId]
  )

  return {
    tenantId,
    ownershipStatus: "TRANSFER_PENDING",
    agencyId: agency.id,
    transferCode: rawCode,
    message: `Transfer initiated to agency ${agency.name} [${agencyUid}]. Enter confirmation code to finalize.`,
  }
}

/**
 * Completes store delegation handshake using 6-digit confirmation code
 */
export async function approveStoreDelegation(
  tenantId: string,
  agencyUniqueUid: string,
  transferCode: string,
  client: Client
): Promise<StoreTransferResult> {
  const agencyRes = await client.query(`SELECT id, name FROM agency WHERE unique_uid = $1 LIMIT 1`, [
    agencyUniqueUid.trim(),
  ])
  if (agencyRes.rows.length === 0) {
    throw new Error(`Invalid Agency Unique UID: ${agencyUniqueUid}`)
  }

  const agency = agencyRes.rows[0]

  const tenantRes = await client.query(
    `SELECT transfer_code_hash, transfer_expires_at FROM tenant WHERE id = $1 LIMIT 1`,
    [tenantId]
  )
  if (tenantRes.rows.length === 0) {
    throw new Error(`Tenant not found: ${tenantId}`)
  }

  const tenant = tenantRes.rows[0]
  if (!tenant.transfer_expires_at || new Date() > new Date(tenant.transfer_expires_at)) {
    throw new Error("Transfer confirmation code has expired.")
  }

  const inputHash = hashTransferCode(transferCode)
  if (inputHash !== tenant.transfer_code_hash) {
    throw new Error("Invalid confirmation code.")
  }

  await client.query(
    `UPDATE tenant 
     SET agency_id = $1, ownership_status = 'AGENCY_MANAGED', transfer_code_hash = NULL, transfer_expires_at = NULL
     WHERE id = $2`,
    [agency.id, tenantId]
  )

  // Notion-style membership: ACTIVE grant so agency can Open store
  const merchantEmailRes = await client.query(
    `SELECT email FROM "user" WHERE tenant_id::text = $1 AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 1`,
    [tenantId]
  )
  const merchantEmail =
    merchantEmailRes.rows[0]?.email || "merchant@unknown.local"

  await client.query(
    `
    INSERT INTO agency_store_access
      (agency_id, tenant_id, store_id, merchant_email, status, confirmed_at, invited_at)
    VALUES ($1, $2, $2, $3, 'ACTIVE', NOW(), NOW())
    ON CONFLICT DO NOTHING
    `,
    [agency.id, tenantId, merchantEmail]
  )

  // If unique constraint missing, ensure ACTIVE row exists
  await client.query(
    `
    UPDATE agency_store_access
    SET status = 'ACTIVE', confirmed_at = NOW(), revoked_at = NULL
    WHERE agency_id = $1 AND tenant_id = $2
    `,
    [agency.id, tenantId]
  )

  // If no row was updated/inserted, force insert
  const check = await client.query(
    `SELECT id FROM agency_store_access WHERE agency_id = $1 AND tenant_id = $2 LIMIT 1`,
    [agency.id, tenantId]
  )
  if (check.rows.length === 0) {
    await client.query(
      `
      INSERT INTO agency_store_access
        (agency_id, tenant_id, store_id, merchant_email, status, confirmed_at, invited_at)
      VALUES ($1, $2, $2, $3, 'ACTIVE', NOW(), NOW())
      `,
      [agency.id, tenantId, merchantEmail]
    )
  }

  await client.query(
    `
    INSERT INTO agency_store_log (agency_id, tenant_id, member_email, action, metadata)
    VALUES ($1, $2, $3, 'TRANSFER_CONFIRMED', $4)
    `,
    [
      agency.id,
      tenantId,
      merchantEmail,
      JSON.stringify({ agencyName: agency.name, ownershipStatus: "AGENCY_MANAGED" }),
    ]
  )

  return {
    tenantId,
    ownershipStatus: "AGENCY_MANAGED",
    agencyId: agency.id,
    message: `Store management successfully delegated to agency ${agency.name}.`,
  }
}

/**
 * Agency transfers store ownership back to independent merchant
 */
export async function handoffStoreToMerchant(
  tenantId: string,
  client: Client
): Promise<StoreTransferResult> {
  await client.query(
    `UPDATE tenant 
     SET agency_id = NULL, ownership_status = 'INDEPENDENT_MERCHANT', transfer_code_hash = NULL, transfer_expires_at = NULL
     WHERE id = $1`,
    [tenantId]
  )

  await client.query(
    `
    UPDATE agency_store_access
    SET status = 'REVOKED', revoked_at = NOW()
    WHERE tenant_id = $1 AND status = 'ACTIVE'
    `,
    [tenantId]
  )

  return {
    tenantId,
    ownershipStatus: "INDEPENDENT_MERCHANT",
    message: "Store ownership successfully handed back to independent merchant.",
  }
}

/**
 * List agencies partnered with a merchant tenant (for Settings → Users).
 */
export async function listTenantPartners(
  tenantId: string,
  client: Client
): Promise<{ partners: any[]; tenantId: string; ownershipStatus?: string }> {
  const tenantRes = await client.query(
    `SELECT id, store_name, ownership_status, agency_id FROM tenant WHERE id::text = $1 LIMIT 1`,
    [tenantId]
  )
  const tenant = tenantRes.rows[0]
  if (!tenant) {
    throw new Error(`Tenant not found: ${tenantId}`)
  }

  const res = await client.query(
    `
    SELECT
      acc.id AS access_id,
      acc.status,
      acc.merchant_email,
      acc.invited_at,
      acc.confirmed_at,
      acc.revoked_at,
      a.id AS agency_id,
      a.name AS agency_name,
      a.unique_uid AS agency_uid,
      a.subdomain AS agency_subdomain,
      a.owner_email
    FROM agency_store_access acc
    JOIN agency a ON a.id = acc.agency_id
    WHERE acc.tenant_id = $1
      AND acc.status IN ('ACTIVE', 'PENDING', 'REVOKE_REQUESTED')
    ORDER BY acc.confirmed_at DESC NULLS LAST, acc.invited_at DESC
    `,
    [tenantId]
  )

  // Also surface agency linked only via tenant.agency_id (managed)
  let partners = res.rows.map((row) => ({
    accessId: row.access_id,
    agencyId: row.agency_id,
    agencyUid: row.agency_uid,
    agencyName: row.agency_name,
    agencySubdomain: row.agency_subdomain,
    ownerEmail: row.owner_email,
    status: row.status,
    merchantEmail: row.merchant_email,
    invitedAt: row.invited_at,
    confirmedAt: row.confirmed_at,
    revokedAt: row.revoked_at,
  }))

  if (
    tenant.agency_id &&
    !partners.some((p) => p.agencyId === tenant.agency_id)
  ) {
    const a = await client.query(
      `SELECT id, name, unique_uid, subdomain, owner_email FROM agency WHERE id = $1`,
      [tenant.agency_id]
    )
    if (a.rows[0]) {
      partners = [
        {
          accessId: null,
          agencyId: a.rows[0].id,
          agencyUid: a.rows[0].unique_uid,
          agencyName: a.rows[0].name,
          agencySubdomain: a.rows[0].subdomain,
          ownerEmail: a.rows[0].owner_email,
          status: tenant.ownership_status === "AGENCY_MANAGED" ? "ACTIVE" : "PENDING",
          merchantEmail: null,
          invitedAt: null,
          confirmedAt: null,
          revokedAt: null,
        },
        ...partners,
      ]
    }
  }

  return {
    partners,
    tenantId,
    ownershipStatus: tenant.ownership_status,
  }
}

/**
 * Resolve merchant's primary tenant from user email (for partners UI).
 */
export async function resolveTenantIdForMerchantEmail(
  email: string,
  client: Client
): Promise<string | null> {
  const r = await client.query(
    `
    SELECT tenant_id::text AS tenant_id
    FROM "user"
    WHERE lower(email) = lower($1) AND deleted_at IS NULL AND tenant_id IS NOT NULL
    LIMIT 1
    `,
    [email]
  )
  if (r.rows[0]?.tenant_id) {
    return r.rows[0].tenant_id
  }
  // Fallback: single default tenant in local dev
  const t = await client.query(
    `SELECT id::text AS id FROM tenant ORDER BY created_at ASC LIMIT 1`
  )
  return t.rows[0]?.id || null
}
