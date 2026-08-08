const { Client } = require("pg")

async function runSmokeTest() {
  const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/bentoco"
  
  // 1. Resolve connection details for bentoco_app role
  // We replace the superuser user/pass with bentoco_app/bentoco_app_pass to trigger RLS
  const appUrl = connectionString
    .replace(/\/\/([^:]+):([^@]+)@/, "//bentoco_app:bentoco_app_pass@")
  
  console.log("Connecting to PostgreSQL to verify tenant isolation...")
  
  const superClient = new Client({ connectionString })
  await superClient.connect()
  
  let tenants = []
  try {
    const res = await superClient.query("SELECT id, store_name, subdomain FROM tenant LIMIT 2")
    tenants = res.rows
  } finally {
    await superClient.end()
  }

  if (tenants.length < 2) {
    console.warn("Skipping smoke test: Less than 2 tenants found in the DB. Please seed the database first.")
    process.exit(0)
  }

  const tenantA = tenants[0].id
  const tenantB = tenants[1].id
  
  console.log(`Tenant A: ${tenants[0].store_name} (${tenantA})`)
  console.log(`Tenant B: ${tenants[1].store_name} (${tenantB})`)

  const appClient = new Client({ connectionString: appUrl })
  await appClient.connect()

  try {
    await appClient.query("BEGIN")
    
    // Set Tenant A context and check products/orders
    await appClient.query(`SET LOCAL app.current_tenant = '${tenantA}'`)
    const productsARes = await appClient.query("SELECT id, title, tenant_id FROM product")
    const productsA = productsARes.rows
    console.log(`Querying as Tenant A: Found ${productsA.length} products`)

    // Verify all returned products belong strictly to Tenant A
    for (const prod of productsA) {
      if (prod.tenant_id !== tenantA) {
        throw new Error(`FAIL: Product ${prod.id} has tenant_id ${prod.tenant_id} which does not match current tenant context ${tenantA}!`)
      }
    }

    // Set Tenant B context and check products/orders
    await appClient.query(`SET LOCAL app.current_tenant = '${tenantB}'`)
    const productsBRes = await appClient.query("SELECT id, title, tenant_id FROM product")
    const productsB = productsBRes.rows
    console.log(`Querying as Tenant B: Found ${productsB.length} products`)

    // Verify all returned products belong strictly to Tenant B
    for (const prod of productsB) {
      if (prod.tenant_id !== tenantB) {
        throw new Error(`FAIL: Product ${prod.id} has tenant_id ${prod.tenant_id} which does not match current tenant context ${tenantB}!`)
      }
    }

    // Cross-verify: Tenant B must not see any of Tenant A's products
    const productAIds = new Set(productsA.map(p => p.id))
    for (const prod of productsB) {
      if (productAIds.has(prod.id)) {
        throw new Error(`FAIL: Tenant B query leaked product ${prod.id} belonging to Tenant A!`)
      }
    }

    await appClient.query("COMMIT")
    console.log("SUCCESS: Tenant isolation smoke test passed. RLS policies successfully isolates products between tenants.")
  } catch (error) {
    await appClient.query("ROLLBACK")
    console.error("FAIL: Tenant isolation smoke test failed:", error.message)
    process.exit(1)
  } finally {
    await appClient.end()
  }
}

runSmokeTest().catch(err => {
  console.error("Unhandle error in tenant isolation smoke test:", err)
  process.exit(1)
})
