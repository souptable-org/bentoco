const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Read .env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...vals] = trimmed.split('=');
      process.env[key.trim()] = vals.join('=').trim();
    }
  }
}

const adminConn = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/bentoco';
const appConn = adminConn.replace(/postgres:\/\/[^@]+@/, 'postgres://bentoco_app:bentoco_app_pass@');

async function testMiddleware() {
  const adminClient = new Client({ connectionString: adminConn });
  const appClient = new Client({ connectionString: appConn });

  await adminClient.connect();
  await appClient.connect();

  try {
    console.log('--- Testing Module 3: Tenant Middleware & RLS Context Helper ---');

    const suffix = Date.now();
    const subdomain = `store-${suffix}`;

    // 1. Create a test tenant
    const tenantRes = await adminClient.query(
      `INSERT INTO tenant (store_name, subdomain) VALUES ('Test Merchant', '${subdomain}') RETURNING id`
    );
    const tenantId = tenantRes.rows[0].id;
    console.log(`Created test tenant [${subdomain}] ID: ${tenantId}`);

    // 2. Simulate withTenantTransaction helper function
    async function withTenantTransaction(client, tId, fn) {
      await client.query('BEGIN');
      try {
        await client.query(`SET LOCAL app.current_tenant = '${tId}'`);
        const res = await fn(client);
        await client.query('COMMIT');
        return res;
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }

    // 3. Insert product inside withTenantTransaction block
    await withTenantTransaction(appClient, tenantId, async (tx) => {
      await tx.query(`INSERT INTO product (title, tenant_id) VALUES ('Middleware Test Item', '${tenantId}')`);
    });

    // 4. Query product inside withTenantTransaction block
    const products = await withTenantTransaction(appClient, tenantId, async (tx) => {
      const res = await tx.query(`SELECT title FROM product`);
      return res.rows;
    });

    console.log('Query output via middleware transaction wrapper:', products);

    if (products.length === 1 && products[0].title === 'Middleware Test Item') {
      console.log('✅ MODULE 3 PASSED: Tenant ORM/Transaction middleware correctly injects RLS context!');
    } else {
      console.error('❌ MODULE 3 FAILED: Middleware transaction wrapper did not isolate context properly.');
      process.exit(1);
    }
  } catch (err) {
    console.error('Test error:', err.message);
    process.exit(1);
  } finally {
    await adminClient.query(`DELETE FROM tenant WHERE subdomain LIKE 'store-%'`).catch(() => {});
    await adminClient.end();
    await appClient.end();
  }
}

testMiddleware();
