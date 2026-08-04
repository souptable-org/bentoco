/**
 * Stage 6 RLS isolation test as bentoco_app (non-superuser).
 * Prerequisites:
 *   node scripts/run-stage-6-rls-migration.js
 *   node scripts/seed-multi-tenant-rls.js
 *
 * Usage: node scripts/test-stage-6-rls.js
 */
const { Client } = require("pg")

const adminConn =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/bentoco"

function appConnFromAdmin(admin) {
  if (process.env.DATABASE_APP_URL) return process.env.DATABASE_APP_URL
  try {
    const u = new URL(admin)
    u.username = "bentoco_app"
    u.password = process.env.BENTOCO_APP_PASSWORD || "bentoco_app_pass"
    return u.toString()
  } catch {
    return admin.replace(
      /postgres:\/\/[^@]+@/,
      "postgres://bentoco_app:bentoco_app_pass@"
    )
  }
}

async function withTenant(client, tenantId, fn) {
  await client.query("BEGIN")
  try {
    await client.query(`SELECT set_config('app.current_tenant', $1, true)`, [
      tenantId,
    ])
    const result = await fn(client)
    await client.query("COMMIT")
    return result
  } catch (e) {
    await client.query("ROLLBACK")
    throw e
  }
}

async function main() {
  const admin = new Client({ connectionString: adminConn })
  const app = new Client({ connectionString: appConnFromAdmin(adminConn) })
  await admin.connect()
  await app.connect()

  console.log("--- Stage 6 RLS isolation test ---")
  console.log(
    "App role connection:",
    appConnFromAdmin(adminConn).replace(/:[^:@/]+@/, ":****@")
  )

  const tenants = await admin.query(
    `SELECT id, subdomain, store_name FROM tenant WHERE subdomain IN ('alpha','beta') ORDER BY subdomain`
  )
  if (tenants.rows.length < 2) {
    throw new Error("Need alpha + beta tenants. Run seed-multi-tenant-rls.js first.")
  }

  const alpha = tenants.rows.find((r) => r.subdomain === "alpha")
  const beta = tenants.rows.find((r) => r.subdomain === "beta")

  // Superuser sees both products
  const adminProducts = await admin.query(
    `SELECT title, tenant_id FROM product WHERE handle IN ('alpha-demo-product','beta-demo-product') ORDER BY title`
  )
  console.log("Admin (superuser) products:", adminProducts.rows.length)
  if (adminProducts.rows.length < 2) {
    throw new Error("Expected 2 seeded products visible to admin")
  }

  // App role WITHOUT tenant context → should see 0 on product
  const noCtx = await app.query(
    `SELECT title FROM product WHERE handle IN ('alpha-demo-product','beta-demo-product')`
  )
  console.log("bentoco_app without tenant context products:", noCtx.rows.length)

  // Alpha context
  const alphaView = await withTenant(app, alpha.id, async (c) => {
    const products = await c.query(
      `SELECT title FROM product WHERE handle IN ('alpha-demo-product','beta-demo-product')`
    )
    const wallets = await c.query(`SELECT balance_paisa FROM tenant_wallet`)
    return { products: products.rows, wallets: wallets.rows }
  })
  console.log("Alpha sees products:", alphaView.products)
  console.log("Alpha wallets:", alphaView.wallets)

  // Beta context
  const betaView = await withTenant(app, beta.id, async (c) => {
    const products = await c.query(
      `SELECT title FROM product WHERE handle IN ('alpha-demo-product','beta-demo-product')`
    )
    const wallets = await c.query(`SELECT balance_paisa FROM tenant_wallet`)
    return { products: products.rows, wallets: wallets.rows }
  })
  console.log("Beta sees products:", betaView.products)
  console.log("Beta wallets:", betaView.wallets)

  // Cross-tenant insert attempt should fail WITH CHECK
  let blockedInsert = false
  try {
    await withTenant(app, alpha.id, async (c) => {
      await c.query(
        `INSERT INTO product (id, title, handle, status, is_giftcard, discountable, tenant_id)
         VALUES ($1, 'Leak Attempt', 'leak-attempt', 'draft', false, true, $2)`,
        [`prod_leak_${Date.now()}`, beta.id]
      )
    })
  } catch (e) {
    blockedInsert = true
    console.log("Cross-tenant insert blocked:", e.message.split("\n")[0])
  }

  const pass =
    noCtx.rows.length === 0 &&
    alphaView.products.length === 1 &&
    alphaView.products[0].title === "Alpha Silk Shirt" &&
    betaView.products.length === 1 &&
    betaView.products[0].title === "Beta Leather Jacket" &&
    alphaView.wallets.length === 1 &&
    betaView.wallets.length === 1 &&
    blockedInsert

  await admin.end()
  await app.end()

  if (pass) {
    console.log("✅ STAGE 6 RLS PASSED: tenants isolated under bentoco_app")
    process.exit(0)
  } else {
    console.error("❌ STAGE 6 RLS FAILED")
    process.exit(1)
  }
}

main().catch((e) => {
  console.error("RLS test error:", e.message)
  process.exit(1)
})
