/**
 * Stage 3: agency schema + seed fixtures on Medusa bentoco DB.
 *
 * Usage:
 *   node scripts/run-stage-3-agency-migration.js
 *
 * Optional env:
 *   AGENCY_OWNER_EMAIL=admin@bentoco.com   (links owner_id if user exists)
 *   AGENCY_USER_EMAIL=agcy@bentoco.com     (team member email to attach if user exists)
 */
const fs = require("fs")
const path = require("path")
const { Client } = require("pg")

const envPath = path.resolve(__dirname, "../.env")
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
      const [key, ...vals] = trimmed.split("=")
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = vals.join("=").trim()
      }
    }
  }
}

const connectionString =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/bentoco"

const sqlPath = path.resolve(
  __dirname,
  "../packages/bentoco/src/migration-scripts/stage-3-agency-schema.sql"
)

// Stable UUID from Stage 0 export (PixelCraft)
const AGENCY_ID = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11"
const AGENCY_UID = "AGENCY-849201"

async function main() {
  const sql = fs.readFileSync(sqlPath, "utf8")
  const client = new Client({ connectionString })
  await client.connect()
  console.log(
    "Connected:",
    connectionString.replace(/:[^:@/]+@/, ":****@")
  )

  // Require Stage 2
  const stage2 = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant'`
  )
  if (stage2.rowCount === 0) {
    throw new Error("Stage 2 required: tenant table missing. Run Stage 2 first.")
  }

  await client.query(sql)
  console.log("Stage 3 schema SQL applied.")

  const ownerEmail =
    process.env.AGENCY_OWNER_EMAIL || "admin@bentoco.com"
  const agencyUserEmail =
    process.env.AGENCY_USER_EMAIL || "agcy@bentoco.com"

  const ownerRes = await client.query(
    `SELECT id, email FROM "user" WHERE email = $1 LIMIT 1`,
    [ownerEmail]
  )
  const agencyUserRes = await client.query(
    `SELECT id, email FROM "user" WHERE email = $1 LIMIT 1`,
    [agencyUserEmail]
  )
  const ownerId = ownerRes.rows[0]?.id || null
  const agencyUserId = agencyUserRes.rows[0]?.id || null

  // Seed agency (restore Stage 0 identity)
  await client.query(
    `
    INSERT INTO agency (
      id, name, subdomain, unique_uid, owner_email, master_uid, owner_id, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
    )
    ON CONFLICT (unique_uid) DO UPDATE SET
      name = EXCLUDED.name,
      subdomain = EXCLUDED.subdomain,
      owner_email = EXCLUDED.owner_email,
      master_uid = EXCLUDED.master_uid,
      owner_id = COALESCE(EXCLUDED.owner_id, agency.owner_id),
      updated_at = NOW()
    `,
    [
      AGENCY_ID,
      "PixelCraft Digital Agency",
      "pixelcraft",
      AGENCY_UID,
      ownerEmail,
      AGENCY_UID,
      ownerId,
    ]
  )
  console.log("Seeded agency", AGENCY_UID, "owner_id=", ownerId)

  // Team: owner row
  if (ownerId) {
    await client.query(
      `
      INSERT INTO agency_team_member (
        agency_id, user_id, email, role, rbac_role, assigned_tenant_ids
      )
      SELECT $1, $2, $3, 'AGENCY_OWNER', 'FULL_ACCESS', '[]'::jsonb
      WHERE NOT EXISTS (
        SELECT 1 FROM agency_team_member
        WHERE agency_id = $1 AND user_id = $2
      )
      `,
      [AGENCY_ID, ownerId, ownerEmail]
    )
  }

  // Team: dedicated agency user if exists (create via medusa user separately)
  if (agencyUserId) {
    await client.query(
      `
      INSERT INTO agency_team_member (
        agency_id, user_id, email, role, rbac_role, assigned_tenant_ids
      )
      SELECT $1, $2, $3, 'AGENCY_MEMBER', 'FULL_ACCESS', '[]'::jsonb
      WHERE NOT EXISTS (
        SELECT 1 FROM agency_team_member
        WHERE agency_id = $1 AND user_id = $2
      )
      `,
      [AGENCY_ID, agencyUserId, agencyUserEmail]
    )
    await client.query(
      `UPDATE "user" SET role = 'AGENCY' WHERE id = $1 AND (role IS NULL OR role = 'MERCHANT' OR role = 'member')`,
      [agencyUserId]
    )
    console.log("Linked agency team member", agencyUserEmail)
  } else {
    console.log(
      `No Medusa user for ${agencyUserEmail} yet — run: npx medusa user -e ${agencyUserEmail} -p supersecret`
    )
  }

  // Default tenant + store from Stage 2
  const tenantRes = await client.query(
    `
    SELECT t.id AS tenant_id, ts.store_id
    FROM tenant t
    LEFT JOIN tenant_store ts ON ts.tenant_id = t.id
    WHERE t.subdomain = 'admin'
    LIMIT 1
    `
  )
  if (tenantRes.rows.length === 0) {
    throw new Error("Default tenant subdomain=admin not found (Stage 2 seed).")
  }
  const { tenant_id: tenantId, store_id: storeId } = tenantRes.rows[0]

  // ACTIVE access for default store (clean fixture; not all Stage 0 PENDING junk)
  const accessRes = await client.query(
    `
    INSERT INTO agency_store_access (
      agency_id, tenant_id, store_id, merchant_email, status,
      invited_at, confirmed_at, created_at, updated_at
    )
    SELECT $1, $2, $3, $4, 'ACTIVE', NOW(), NOW(), NOW(), NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM agency_store_access
      WHERE agency_id = $1 AND tenant_id = $2 AND status = 'ACTIVE'
    )
    RETURNING id
    `,
    [AGENCY_ID, tenantId, storeId, ownerEmail]
  )
  if (accessRes.rowCount > 0) {
    console.log("Seeded ACTIVE agency_store_access", accessRes.rows[0].id)
  } else {
    console.log("ACTIVE agency_store_access already present")
  }

  // One PENDING invite fixture for UI testing
  await client.query(
    `
    INSERT INTO agency_store_access (
      agency_id, tenant_id, store_id, merchant_email, status,
      invite_token, token_expires_at, invited_at, created_at, updated_at
    )
    SELECT $1, 'PENDING_CREATION', NULL, 'pending-merchant@example.com', 'PENDING',
           'stage3_demo_invite_token_hash', NOW() + INTERVAL '48 hours', NOW(), NOW(), NOW()
    WHERE NOT EXISTS (
      SELECT 1 FROM agency_store_access
      WHERE agency_id = $1 AND merchant_email = 'pending-merchant@example.com' AND status = 'PENDING'
    )
    `,
    [AGENCY_ID]
  )

  // Audit log sample
  await client.query(
    `
    INSERT INTO agency_store_log (
      agency_id, tenant_id, store_id, member_email, action, metadata
    )
    SELECT $1, $2, $3, $4, 'ACCESS_GRANTED',
           '{"source":"stage-3-seed"}'::jsonb
    WHERE NOT EXISTS (
      SELECT 1 FROM agency_store_log
      WHERE agency_id = $1 AND tenant_id = $2 AND action = 'ACCESS_GRANTED'
        AND metadata->>'source' = 'stage-3-seed'
    )
    `,
    [AGENCY_ID, tenantId, storeId, ownerEmail]
  )

  // Ownership status for linked store
  if (storeId) {
    await client.query(
      `
      INSERT INTO ownership_status (store_id, agency_id, status, updated_at)
      VALUES ($1, $2, 'AGENCY_MANAGED', NOW())
      ON CONFLICT (store_id) DO UPDATE SET
        agency_id = EXCLUDED.agency_id,
        status = EXCLUDED.status,
        updated_at = NOW()
      `,
      [storeId, AGENCY_ID]
    )
  }

  // Attach agency_id on default tenant (managed relationship, merchant still owns)
  await client.query(
    `
    UPDATE tenant
    SET agency_id = $1,
        ownership_status = COALESCE(ownership_status, 'AGENCY_MANAGED'),
        updated_at = NOW()
    WHERE id = $2
    `,
    [AGENCY_ID, tenantId]
  )

  const summary = await client.query(`
    SELECT
      (SELECT count(*)::int FROM agency) AS agencies,
      (SELECT count(*)::int FROM agency_team_member) AS team_members,
      (SELECT count(*)::int FROM agency_store_access) AS access_rows,
      (SELECT count(*)::int FROM agency_store_access WHERE status = 'ACTIVE') AS active_access,
      (SELECT count(*)::int FROM agency_store_log) AS audit_rows,
      (SELECT count(*)::int FROM ownership_status) AS ownership_rows
  `)
  console.log("Verification counts:", summary.rows[0])

  const detail = await client.query(`
    SELECT a.unique_uid, a.name, a.owner_email, a.owner_id,
           (SELECT count(*) FROM agency_team_member m WHERE m.agency_id = a.id) AS members
    FROM agency a
  `)
  console.log("Agencies:", detail.rows)

  await client.end()
  console.log("Stage 3 complete.")
}

main().catch((e) => {
  console.error("Stage 3 failed:", e.message)
  process.exit(1)
})
