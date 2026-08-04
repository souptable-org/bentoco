/**
 * Stage 6: apply RLS isolation SQL.
 * Usage: node scripts/run-stage-6-rls-migration.js
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
  "../packages/bentoco/src/migration-scripts/stage-6-rls-isolation.sql"
)

async function main() {
  const sql = fs.readFileSync(sqlPath, "utf8")
  const client = new Client({ connectionString })
  await client.connect()
  console.log(
    "Connected (admin):",
    connectionString.replace(/:[^:@/]+@/, ":****@")
  )

  await client.query(sql)
  console.log("Stage 6 RLS SQL applied.")

  const check = await client.query(`
    SELECT c.relname,
           c.relrowsecurity AS rls,
           c.relforcerowsecurity AS force_rls
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relname IN (
        'product','order','cart','customer','user',
        'tenant_wallet','tenant_wallet_ledger','tenant_payment_config'
      )
    ORDER BY 1
  `)
  console.table(check.rows)

  const role = await client.query(`
    SELECT rolname, rolsuper, rolbypassrls
    FROM pg_roles
    WHERE rolname = 'bentoco_app'
  `)
  console.log("bentoco_app role:", role.rows[0])

  await client.end()
  console.log("Stage 6 migration complete.")
}

main().catch((e) => {
  console.error("Stage 6 failed:", e.message)
  process.exit(1)
})
