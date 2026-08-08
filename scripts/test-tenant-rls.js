const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Parse connection URL and replace user with application role bentoco_app
const adminConn = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/bentoco';
const appConn = adminConn.replace(/postgres:\/\/[^@]+@/, 'postgres://bentoco_app:bentoco_app_pass@');

async function verifyRLS() {
  const adminClient = new Client({ connectionString: adminConn });
  const appClient = new Client({ connectionString: appConn });

  await adminClient.connect();
  await appClient.connect();

  try {
    console.log('--- Starting Multi-Tenancy RLS Security Test (Application Role: bentoco_app) ---');

    // Clean any prior test products using admin client
    await adminClient.query(`DELETE FROM product`);

    const suffix = Date.now();
    const subA = `alpha-${suffix}`;
    const subB = `beta-${suffix}`;

    // 1. Create two test tenants using admin client
    const tenantA = await adminClient.query(
      `INSERT INTO tenant (store_name, subdomain) VALUES ('Brand Alpha', '${subA}') RETURNING id`
    );
    const tenantB = await adminClient.query(
      `INSERT INTO tenant (store_name, subdomain) VALUES ('Brand Beta', '${subB}') RETURNING id`
    );

    const tenantAId = tenantA.rows[0].id;
    const tenantBId = tenantB.rows[0].id;

    console.log(`Tenant A ID: ${tenantAId}`);
    console.log(`Tenant B ID: ${tenantBId}`);

    // 2. Insert Products for Tenant A as bentoco_app inside transaction
    await appClient.query('BEGIN');
    await appClient.query(`SET LOCAL app.current_tenant = '${tenantAId}'`);
    await appClient.query(
      `INSERT INTO product (title, tenant_id) VALUES ('Alpha Silk Shirt', '${tenantAId}')`
    );
    await appClient.query('COMMIT');

    // 3. Insert Products for Tenant B as bentoco_app inside transaction
    await appClient.query('BEGIN');
    await appClient.query(`SET LOCAL app.current_tenant = '${tenantBId}'`);
    await appClient.query(
      `INSERT INTO product (title, tenant_id) VALUES ('Beta Leather Jacket', '${tenantBId}')`
    );
    await appClient.query('COMMIT');

    // 4. Query under Tenant A Context as bentoco_app
    await appClient.query('BEGIN');
    await appClient.query(`SET LOCAL app.current_tenant = '${tenantAId}'`);
    const alphaProducts = await appClient.query(`SELECT title FROM product`);
    await appClient.query('COMMIT');
    console.log(`Products visible to Tenant A:`, alphaProducts.rows.map(r => r.title));

    // 5. Query under Tenant B Context as bentoco_app
    await appClient.query('BEGIN');
    await appClient.query(`SET LOCAL app.current_tenant = '${tenantBId}'`);
    const betaProducts = await appClient.query(`SELECT title FROM product`);
    await appClient.query('COMMIT');
    console.log(`Products visible to Tenant B:`, betaProducts.rows.map(r => r.title));

    // Assert isolation
    const isIsolated = 
      alphaProducts.rows.length === 1 && alphaProducts.rows[0].title === 'Alpha Silk Shirt' &&
      betaProducts.rows.length === 1 && betaProducts.rows[0].title === 'Beta Leather Jacket';

    if (isIsolated) {
      console.log('✅ RLS SECURITY AUDIT PASSED: Perfect cross-tenant data isolation verified!');
    } else {
      console.error('❌ RLS SECURITY AUDIT FAILED: Data leak detected between tenants!');
      process.exit(1);
    }
  } catch (err) {
    console.error('RLS Test Error:', err.message);
    process.exit(1);
  } finally {
    await adminClient.query(`DELETE FROM tenant WHERE subdomain LIKE 'alpha-%' OR subdomain LIKE 'beta-%'`).catch(() => {});
    await adminClient.end();
    await appClient.end();
  }
}

verifyRLS();
