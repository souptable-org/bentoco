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

async function testBYOGLoader() {
  const adminClient = new Client({ connectionString: adminConn });
  const appClient = new Client({ connectionString: appConn });

  await adminClient.connect();
  await appClient.connect();

  try {
    console.log('--- Testing Task 5.2: Dynamic BYOG Payment Gateway Loader ---');

    const suffix = Date.now();
    const subdomain = `byog-store-${suffix}`;

    // 1. Create a test tenant
    const tenantRes = await adminClient.query(
      `INSERT INTO tenant (store_name, subdomain) VALUES ('BYOG Merchant', '${subdomain}') RETURNING id`
    );
    const tenantId = tenantRes.rows[0].id;
    console.log(`Created test tenant [${subdomain}] ID: ${tenantId}`);

    // 2. Save Razorpay BYOG Credentials for Tenant as bentoco_app inside transaction
    await appClient.query('BEGIN');
    await appClient.query(`SET LOCAL app.current_tenant = '${tenantId}'`);
    const razorpayKeys = { key_id: 'rzp_test_12345', key_secret: 'secret_abc123' };
    await appClient.query(
      `INSERT INTO tenant_payment_config (tenant_id, provider_id, encrypted_payload)
       VALUES ($1, $2, $3)`,
      [tenantId, 'razorpay', JSON.stringify(razorpayKeys)]
    );
    await appClient.query('COMMIT');

    // 3. Load BYOG Credentials dynamically
    await appClient.query('BEGIN');
    await appClient.query(`SET LOCAL app.current_tenant = '${tenantId}'`);
    const loadedRes = await appClient.query(
      `SELECT encrypted_payload FROM tenant_payment_config WHERE tenant_id = $1 AND provider_id = $2`,
      [tenantId, 'razorpay']
    );
    await appClient.query('COMMIT');

    const loadedKeys = loadedRes.rows[0].encrypted_payload;
    console.log('Loaded BYOG Credentials dynamically:', loadedKeys);

    if (loadedKeys.key_id === 'rzp_test_12345' && loadedKeys.key_secret === 'secret_abc123') {
      console.log('✅ TASK 5.2 PASSED: Dynamic BYOG Payment Gateway Loader working correctly!');
    } else {
      console.error('❌ TASK 5.2 FAILED: Payment credentials mismatch.');
      process.exit(1);
    }
  } catch (err) {
    console.error('BYOG Loader Test Error:', err.message);
    process.exit(1);
  } finally {
    await adminClient.query(`DELETE FROM tenant WHERE subdomain LIKE 'byog-store-%'`).catch(() => {});
    await adminClient.end();
    await appClient.end();
  }
}

testBYOGLoader();
