/**
 * Stage 2: apply multi-tenant foundation SQL onto the Medusa DB (bentoco).
 * Usage: node scripts/run-stage-2-tenant-migration.js
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
  "../packages/bentoco/src/migration-scripts/stage-2-tenant-foundation.sql"
)

async function main() {
  const sql = fs.readFileSync(sqlPath, "utf8")
  const client = new Client({ connectionString })
  await client.connect()
  console.log(
    "Connected:",
    connectionString.replace(/:[^:@/]+@/, ":****@")
  )

  const prior = await client.query(
    `SELECT EXISTS (
       SELECT 1 FROM information_schema.tables
       WHERE table_name = 'bentoco_schema_migrations'
     ) AS has_table`
  )
  if (prior.rows[0].has_table) {
    const done = await client.query(
      `SELECT 1 FROM bentoco_schema_migrations WHERE id = 'stage-2-tenant-foundation'`
    )
    if (done.rowCount > 0) {
      console.log("Stage 2 already applied (bentoco_schema_migrations). Re-running SQL is safe; applying anyway for IF NOT EXISTS paths...")
    }
  }

  await client.query(sql)
  console.log("Stage 2 SQL applied.")

  const checks = await client.query(`
    SELECT
      (SELECT count(*)::int FROM tenant) AS tenants,
      (SELECT count(*)::int FROM tenant_store) AS tenant_stores,
      (SELECT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_name = 'product' AND column_name = 'tenant_id'
       )) AS product_has_tenant_id,
      (SELECT EXISTS (
         SELECT 1 FROM information_schema.columns
         WHERE table_name = 'user' AND column_name = 'tenant_id'
       )) AS user_has_tenant_id,
      (SELECT EXISTS (
         SELECT 1 FROM information_schema.tables
         WHERE table_name = 'tenant_wallet'
       )) AS has_wallet,
      (SELECT EXISTS (
         SELECT 1 FROM pg_tables
         WHERE tablename = 'agency'
       )) AS has_agency_table
  `)
  console.log("Verification:", checks.rows[0])

  const sample = await client.query(`
    SELECT t.id, t.store_name, t.subdomain, t.plan, ts.store_id
    FROM tenant t
    LEFT JOIN tenant_store ts ON ts.tenant_id = t.id
    ORDER BY t.created_at
  `)
  console.log("Tenants:", sample.rows)

  await client.end()
}

main().catch((e) => {
  console.error("Stage 2 migration failed:", e.message)
  process.exit(1)
})
