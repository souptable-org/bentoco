/**
 * Agency delegated store access (Part 2)
 *
 * Rules:
 * - Agency staff never use merchant passwords
 * - Normal path: Agency Admin → Open store → assume-store session
 * - Temp path: redeem temp code (limited, published_by tracked)
 * - Admin APIs require valid assume session when actor is an agency member
 */

import crypto from "crypto"
import type { Client } from "pg"

const SESSION_TTL_MS = 8 * 60 * 60 * 1000 // 8 hours
const TEMP_DEFAULT_HOURS = 8

export type AuthMethod = "password_assume" | "temp_code"

export type AssumeStoreInput = {
  email: string
  agencyUid?: string
  tenantId: string
  ipAddress?: string
  authMethod?: AuthMethod
  tempCodeId?: string
  publishedByEmail?: string
}

export type AssumeStoreResult = {
  allowed: boolean
  reason?: string
  sessionToken?: string
  expiresAt?: string
  tenantId?: string
  storeName?: string
  subdomain?: string
  agencyUid?: string
  agencyName?: string
  memberEmail?: string
  rbacRole?: string
  authMethod?: AuthMethod
  publishedByEmail?: string | null
}

export type StoreSessionRecord = {
  id: string
  agency_id: string
  member_id: string | null
  member_email: string
  tenant_id: string
  store_id: string | null
  auth_method: AuthMethod
  temp_code_id: string | null
  published_by_email: string | null
  expires_at: Date
  agency_uid?: string
  agency_name?: string
  store_name?: string
  subdomain?: string
  rbac_role?: string
}

export function hashSecret(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex")
}

export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

/** Ensure session/temp tables exist (safe for local dev without migrate). */
export async function ensureAgencySessionTables(client: Client): Promise<void> {
  await client.query(`
    CREATE TABLE IF NOT EXISTS "agency_store_session" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "session_token_hash" VARCHAR(128) NOT NULL UNIQUE,
      "agency_id" UUID NOT NULL,
      "member_id" UUID,
      "member_email" VARCHAR(255) NOT NULL,
      "tenant_id" TEXT NOT NULL,
      "store_id" TEXT,
      "auth_method" VARCHAR(32) NOT NULL,
      "temp_code_id" UUID,
      "published_by_email" VARCHAR(255),
      "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
      "revoked_at" TIMESTAMP WITH TIME ZONE,
      "ip_address" VARCHAR(64),
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `)
  await client.query(`
    CREATE TABLE IF NOT EXISTS "agency_temp_access_code" (
      "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      "code_hash" VARCHAR(128) NOT NULL,
      "agency_id" UUID NOT NULL,
      "member_email" VARCHAR(255) NOT NULL,
      "tenant_id" TEXT NOT NULL,
      "store_id" TEXT,
      "published_by_email" VARCHAR(255) NOT NULL,
      "published_by_member_id" UUID,
      "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
      "max_uses" INT NOT NULL DEFAULT 1,
      "use_count" INT NOT NULL DEFAULT 0,
      "revoked_at" TIMESTAMP WITH TIME ZONE,
      "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `)
}

async function resolveAgency(
  client: Client,
  agencyUid?: string
): Promise<{ id: string; unique_uid: string; name: string } | null> {
  if (agencyUid) {
    const r = await client.query(
      `SELECT id, unique_uid, name FROM agency
       WHERE unique_uid = $1 OR id::text = $1 LIMIT 1`,
      [agencyUid]
    )
    if (r.rows[0]) return r.rows[0]
  }
  return null
}

/**
 * Resolve team membership for email (must belong to agency).
 */
async function resolveMember(
  client: Client,
  agencyId: string,
  email: string
): Promise<{
  id: string
  email: string
  role: string
  rbac_role: string
  assigned_tenant_ids: string[] | null
} | null> {
  const r = await client.query(
    `
    SELECT id, email, role, rbac_role, assigned_tenant_ids
    FROM agency_team_member
    WHERE agency_id = $1 AND lower(email) = lower($2)
    LIMIT 1
    `,
    [agencyId, email]
  )
  return r.rows[0] || null
}

/**
 * Check agency has grant on store (Notion-style membership).
 * ACTIVE or REVOKE_REQUESTED (agency can still open until they Accept revoke).
 */
async function hasActiveStoreAccess(
  client: Client,
  agencyId: string,
  tenantId: string
): Promise<boolean> {
  const r = await client.query(
    `
    SELECT id FROM agency_store_access
    WHERE agency_id = $1
      AND (tenant_id = $2 OR store_id = $2)
      AND status IN ('ACTIVE', 'NEW', 'REVOKE_REQUESTED')
    LIMIT 1
    `,
    [agencyId, tenantId]
  )
  return r.rows.length > 0
}

/**
 * Agency staff assume a store (airlock → merchant admin).
 * Checks: agency known, email in agency, ACTIVE grant, member scope.
 */
export async function assumeStore(
  client: Client,
  input: AssumeStoreInput
): Promise<AssumeStoreResult> {
  await ensureAgencySessionTables(client)

  const email = input.email.trim().toLowerCase()
  const tenantId = input.tenantId.trim()
  const authMethod: AuthMethod = input.authMethod || "password_assume"

  // 2) Know the agency
  let agency = input.agencyUid
    ? await resolveAgency(client, input.agencyUid)
    : null

  if (!agency) {
    // Infer agency from membership email
    const byEmail = await client.query(
      `
      SELECT a.id, a.unique_uid, a.name
      FROM agency_team_member m
      JOIN agency a ON a.id = m.agency_id
      WHERE lower(m.email) = $1
      LIMIT 1
      `,
      [email]
    )
    agency = byEmail.rows[0] || null
  }

  if (!agency) {
    return {
      allowed: false,
      reason: "Unknown agency — email is not linked to any agency team.",
    }
  }

  // 3) Email associated with same agency
  const member = await resolveMember(client, agency.id, email)
  if (!member) {
    return {
      allowed: false,
      reason: "Email is not a member of this agency.",
    }
  }

  // Store grant (Notion membership)
  const granted = await hasActiveStoreAccess(client, agency.id, tenantId)
  if (!granted) {
    return {
      allowed: false,
      reason:
        "Agency does not have active access to this store. Ask the merchant to confirm the invite.",
    }
  }

  // Staff scope: only AGENCY_OWNER skips assignment list
  const role = (member.role || "").toUpperCase()
  const isOwner = role === "AGENCY_OWNER" || role === "OWNER"

  if (!isOwner && Array.isArray(member.assigned_tenant_ids)) {
    const assigned = member.assigned_tenant_ids.map(String)
    if (assigned.length > 0 && !assigned.includes(tenantId)) {
      return {
        allowed: false,
        reason: "You are not assigned to this store within the agency.",
      }
    }
  }

  const tenantRes = await client.query(
    `SELECT id, store_name, subdomain FROM tenant WHERE id::text = $1 LIMIT 1`,
    [tenantId]
  )
  const tenant = tenantRes.rows[0]

  const sessionToken = generateSessionToken()
  const sessionHash = hashSecret(sessionToken)
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  await client.query(
    `
    INSERT INTO agency_store_session
      (session_token_hash, agency_id, member_id, member_email, tenant_id,
       store_id, auth_method, temp_code_id, published_by_email, expires_at, ip_address)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `,
    [
      sessionHash,
      agency.id,
      member.id,
      member.email,
      tenantId,
      tenantId,
      authMethod,
      input.tempCodeId || null,
      input.publishedByEmail || null,
      expiresAt,
      input.ipAddress || null,
    ]
  )

  await client.query(
    `
    INSERT INTO agency_store_log
      (agency_id, tenant_id, store_id, member_id, member_email, action, ip_address, metadata)
    VALUES ($1, $2, $3, $4, $5, 'ASSUME_STORE', $6, $7)
    `,
    [
      agency.id,
      tenantId,
      tenantId,
      member.id,
      member.email,
      input.ipAddress || null,
      JSON.stringify({
        authMethod,
        tempCodeId: input.tempCodeId || null,
        publishedByEmail: input.publishedByEmail || null,
        rbacRole: member.rbac_role,
        expiresAt: expiresAt.toISOString(),
      }),
    ]
  )

  return {
    allowed: true,
    sessionToken,
    expiresAt: expiresAt.toISOString(),
    tenantId,
    storeName: tenant?.store_name || tenantId,
    subdomain: tenant?.subdomain || undefined,
    agencyUid: agency.unique_uid,
    agencyName: agency.name,
    memberEmail: member.email,
    rbacRole: member.rbac_role,
    authMethod,
    publishedByEmail: input.publishedByEmail || null,
  }
}

export async function leaveStore(
  client: Client,
  sessionToken: string,
  email?: string
): Promise<{ ok: boolean }> {
  await ensureAgencySessionTables(client)
  const hash = hashSecret(sessionToken)
  const sel = await client.query(
    `SELECT id, agency_id, tenant_id, member_id, member_email
     FROM agency_store_session
     WHERE session_token_hash = $1 AND revoked_at IS NULL
     LIMIT 1`,
    [hash]
  )
  if (!sel.rows[0]) {
    return { ok: true }
  }
  const row = sel.rows[0]
  await client.query(
    `UPDATE agency_store_session SET revoked_at = NOW() WHERE id = $1`,
    [row.id]
  )
  await client.query(
    `
    INSERT INTO agency_store_log
      (agency_id, tenant_id, member_id, member_email, action, metadata)
    VALUES ($1, $2, $3, $4, 'LEAVE_STORE', $5)
    `,
    [
      row.agency_id,
      row.tenant_id,
      row.member_id,
      email || row.member_email,
      JSON.stringify({ leftAt: new Date().toISOString() }),
    ]
  )
  return { ok: true }
}

/**
 * Validate assume-store session (for admin middleware).
 */
export async function validateStoreSession(
  client: Client,
  sessionToken: string,
  expectedTenantId?: string
): Promise<StoreSessionRecord | null> {
  await ensureAgencySessionTables(client)
  const hash = hashSecret(sessionToken)
  const r = await client.query(
    `
    SELECT
      s.*,
      a.unique_uid AS agency_uid,
      a.name AS agency_name,
      t.store_name,
      t.subdomain,
      m.rbac_role
    FROM agency_store_session s
    JOIN agency a ON a.id = s.agency_id
    LEFT JOIN tenant t ON t.id::text = s.tenant_id
    LEFT JOIN agency_team_member m ON m.id = s.member_id
    WHERE s.session_token_hash = $1
      AND s.revoked_at IS NULL
      AND s.expires_at > NOW()
    LIMIT 1
    `,
    [hash]
  )
  const row = r.rows[0]
  if (!row) return null
  if (expectedTenantId && row.tenant_id !== expectedTenantId) {
    return null
  }
  return row
}

/**
 * Is this email an agency team member? (any agency)
 */
export async function isAgencyMemberEmail(
  client: Client,
  email: string
): Promise<boolean> {
  const r = await client.query(
    `SELECT 1 FROM agency_team_member WHERE lower(email) = lower($1) LIMIT 1`,
    [email]
  )
  return r.rows.length > 0
}

/**
 * Publish temporary access code (owner only ideally).
 */
export async function publishTempAccessCode(
  client: Client,
  input: {
    agencyUid: string
    memberEmail: string
    tenantId: string
    publishedByEmail: string
    expiryHours?: number
    maxUses?: number
  }
): Promise<{ accessCode: string; expiresAt: string; id: string }> {
  await ensureAgencySessionTables(client)
  const agency = await resolveAgency(client, input.agencyUid)
  if (!agency) {
    throw new Error("Agency not found.")
  }

  // Publisher must be on the agency
  const publisher = await resolveMember(
    client,
    agency.id,
    input.publishedByEmail
  )
  if (!publisher) {
    throw new Error("Publisher is not a member of this agency.")
  }

  // Target email should be on agency (or will be bound at redeem)
  const granted = await hasActiveStoreAccess(
    client,
    agency.id,
    input.tenantId
  )
  if (!granted) {
    throw new Error("Agency has no active access to this store.")
  }

  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  let accessCode = ""
  for (let i = 0; i < 6; i++) {
    accessCode += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  const codeHash = hashSecret(accessCode.toUpperCase())
  const hours = input.expiryHours ?? TEMP_DEFAULT_HOURS
  const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000)
  const maxUses = input.maxUses ?? 1
  const memberEmail = input.memberEmail.trim().toLowerCase()

  const ins = await client.query(
    `
    INSERT INTO agency_temp_access_code
      (code_hash, agency_id, member_email, tenant_id, store_id,
       published_by_email, published_by_member_id, expires_at, max_uses)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING id
    `,
    [
      codeHash,
      agency.id,
      memberEmail,
      input.tenantId,
      input.tenantId,
      input.publishedByEmail.trim().toLowerCase(),
      publisher.id,
      expiresAt,
      maxUses,
    ]
  )

  await client.query(
    `
    INSERT INTO agency_store_log
      (agency_id, tenant_id, member_email, action, metadata)
    VALUES ($1, $2, $3, 'TEMP_CODE_PUBLISHED', $4)
    `,
    [
      agency.id,
      input.tenantId,
      input.publishedByEmail,
      JSON.stringify({
        targetEmail: memberEmail,
        expiresAt: expiresAt.toISOString(),
        maxUses,
        codeId: ins.rows[0].id,
      }),
    ]
  )

  return {
    accessCode,
    expiresAt: expiresAt.toISOString(),
    id: ins.rows[0].id,
  }
}

/**
 * Redeem temp code → assume-store session (limited path).
 * Checks: code valid, agency known, email↔agency, temp metadata (publisher).
 */
export async function redeemTempAccessCode(
  client: Client,
  input: {
    accessCode: string
    email: string
    ipAddress?: string
  }
): Promise<AssumeStoreResult> {
  await ensureAgencySessionTables(client)
  const email = input.email.trim().toLowerCase()
  const codeHash = hashSecret(input.accessCode.trim().toUpperCase())

  const r = await client.query(
    `
    SELECT c.*, a.unique_uid, a.name AS agency_name
    FROM agency_temp_access_code c
    JOIN agency a ON a.id = c.agency_id
    WHERE c.code_hash = $1
      AND c.revoked_at IS NULL
    ORDER BY c.created_at DESC
    LIMIT 1
    `,
    [codeHash]
  )
  const code = r.rows[0]
  if (!code) {
    return { allowed: false, reason: "Invalid access code." }
  }
  if (new Date(code.expires_at) < new Date()) {
    return { allowed: false, reason: "Access code has expired." }
  }
  if (code.use_count >= code.max_uses) {
    return { allowed: false, reason: "Access code has already been used." }
  }
  // 3) Email bound to code must match (and be on agency)
  if (code.member_email.toLowerCase() !== email) {
    return {
      allowed: false,
      reason: "This code is not issued for this email.",
    }
  }

  const member = await resolveMember(client, code.agency_id, email)
  if (!member) {
    return {
      allowed: false,
      reason: "Email is not a member of the agency that issued this code.",
    }
  }

  await client.query(
    `UPDATE agency_temp_access_code SET use_count = use_count + 1 WHERE id = $1`,
    [code.id]
  )

  await client.query(
    `
    INSERT INTO agency_store_log
      (agency_id, tenant_id, member_id, member_email, action, ip_address, metadata)
    VALUES ($1, $2, $3, $4, 'TEMP_CODE_REDEEMED', $5, $6)
    `,
    [
      code.agency_id,
      code.tenant_id,
      member.id,
      email,
      input.ipAddress || null,
      JSON.stringify({
        codeId: code.id,
        publishedByEmail: code.published_by_email,
      }),
    ]
  )

  return assumeStore(client, {
    email,
    agencyUid: code.unique_uid,
    tenantId: code.tenant_id,
    ipAddress: input.ipAddress,
    authMethod: "temp_code",
    tempCodeId: code.id,
    publishedByEmail: code.published_by_email,
  })
}
