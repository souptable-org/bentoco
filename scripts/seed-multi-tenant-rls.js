/**
 * Seed two tenants with isolated product + wallet rows for RLS testing.
 * Uses admin (superuser) connection so inserts always succeed.
 *
 * Usage: node scripts/seed-multi-tenant-rls.js
 */
const { Client } = require("pg")
const crypto = require("crypto")

const adminConn =
  process.env.DATABASE_URL ||
  "postgres://postgres:postgres@localhost:5432/bentoco"

function id(prefix) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`
}

async function main() {
  const client = new Client({ connectionString: adminConn })
  await client.connect()

  // Upsert demo tenants
  const tenants = [
    {
      name: "Alpha Textiles",
      subdomain: "alpha",
      productTitle: "Alpha Silk Shirt",
      walletPaisa: 150000,
    },
    {
      name: "Beta Gear",
      subdomain: "beta",
      productTitle: "Beta Leather Jacket",
      walletPaisa: 275000,
    },
  ]

  const created = []

  for (const t of tenants) {
    let tenantId
    const existing = await client.query(
      `SELECT id FROM tenant WHERE subdomain = $1 LIMIT 1`,
      [t.subdomain]
    )
    if (existing.rows.length) {
      tenantId = existing.rows[0].id
      await client.query(
        `UPDATE tenant SET store_name = $1, updated_at = NOW() WHERE id = $2`,
        [t.name, tenantId]
      )
    } else {
      const ins = await client.query(
        `INSERT INTO tenant (store_name, subdomain, plan, can_go_live, ownership_status)
         VALUES ($1, $2, 'basic', true, 'INDEPENDENT_MERCHANT')
         RETURNING id`,
        [t.name, t.subdomain]
      )
      tenantId = ins.rows[0].id
    }

    // Product for tenant (full Medusa-required columns)
    const handle = `${t.subdomain}-demo-product`
    await client.query(`DELETE FROM product WHERE handle = $1`, [handle])
    const productId = id("prod")
    await client.query(
      `
      INSERT INTO product (id, title, handle, status, is_giftcard, discountable, tenant_id)
      VALUES ($1, $2, $3, 'published', false, true, $4)
      `,
      [productId, t.productTitle, handle, tenantId]
    )

    // Wallet
    await client.query(`DELETE FROM tenant_wallet WHERE tenant_id = $1`, [
      tenantId,
    ])
    await client.query(
      `INSERT INTO tenant_wallet (tenant_id, balance_paisa) VALUES ($1, $2)`,
      [tenantId, t.walletPaisa]
    )
    await client.query(
      `
      INSERT INTO tenant_wallet_ledger
        (tenant_id, type, amount_paisa, balance_after_paisa, reason, metadata)
      VALUES ($1, 'topup', $2, $2, 'Stage 6 seed topup', '{"source":"stage-6-seed"}'::jsonb)
      `,
      [tenantId, t.walletPaisa]
    )

    created.push({
      tenantId,
      subdomain: t.subdomain,
      name: t.name,
      productId,
      productTitle: t.productTitle,
      walletPaisa: t.walletPaisa,
    })
  }

  console.log("Seeded multi-tenant data:")
  console.log(JSON.stringify(created, null, 2))
  await client.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
