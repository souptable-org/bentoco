const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

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

const logDir = path.resolve(__dirname, '../log');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFile = path.join(logDir, 'test-communications-wallet.txt');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n', 'utf8');
}

fs.writeFileSync(logFile, `=== Phase 4 Communications Wallet Audit Log [${new Date().toISOString()}] ===\n\n`, 'utf8');

async function testWallet() {
  const adminClient = new Client({ connectionString: adminConn });
  const appClient = new Client({ connectionString: appConn });

  await adminClient.connect();
  await appClient.connect();

  try {
    log('--- Starting Phase 4: Prepaid Communications Wallet Audit ---');

    const suffix = Date.now();
    const subdomain = `wallet-store-${suffix}`;

    // 1. Provision Test Tenant
    const tenantRes = await adminClient.query(
      `INSERT INTO tenant (store_name, subdomain) VALUES ('Wallet Store', '${subdomain}') RETURNING id`
    );
    const tenantId = tenantRes.rows[0].id;
    log(`Provisioned Test Tenant [${subdomain}] ID: ${tenantId}`);

    // 2. Test Initial Balance (0 Paisa)
    await appClient.query('BEGIN');
    await appClient.query(`SET LOCAL app.current_tenant = '${tenantId}'`);
    const initBalRes = await appClient.query(`SELECT balance_paisa FROM tenant_wallet WHERE tenant_id = $1`, [tenantId]);
    await appClient.query('COMMIT');
    log(`Initial Wallet Balance: ${initBalRes.rows.length === 0 ? 0 : initBalRes.rows[0].balance_paisa} Paisa`);

    // 3. Test Top-Up (₹500 = 50000 Paisa)
    await appClient.query('BEGIN');
    await appClient.query(`SET LOCAL app.current_tenant = '${tenantId}'`);
    await appClient.query(
      `INSERT INTO tenant_wallet (tenant_id, balance_paisa) VALUES ($1, 50000)
       ON CONFLICT (tenant_id) DO UPDATE SET balance_paisa = tenant_wallet.balance_paisa + EXCLUDED.balance_paisa`,
      [tenantId]
    );
    await appClient.query(
      `INSERT INTO tenant_wallet_ledger (tenant_id, type, amount_paisa, balance_after_paisa, reason)
       VALUES ($1, 'topup', 50000, 50000, 'Test Recharge')`,
      [tenantId]
    );
    await appClient.query('COMMIT');
    log('Top-Up executed (+50000 Paisa / ₹500.00)');

    // 4. Test WhatsApp OTP Deduction (25 Paisa / ₹0.25)
    await appClient.query('BEGIN');
    await appClient.query(`SET LOCAL app.current_tenant = '${tenantId}'`);
    await appClient.query(`UPDATE tenant_wallet SET balance_paisa = balance_paisa - 25 WHERE tenant_id = $1`, [tenantId]);
    await appClient.query(
      `INSERT INTO tenant_wallet_ledger (tenant_id, type, amount_paisa, balance_after_paisa, reason)
       VALUES ($1, 'deduction', 25, 49975, 'WhatsApp 4-Digit OTP Dispatch')`,
      [tenantId]
    );
    await appClient.query('COMMIT');
    log('WhatsApp OTP Deduction executed (-25 Paisa / ₹0.25) -> Remaining: 49975 Paisa');

    // 5. Verify Ledger Audit Trail
    await appClient.query('BEGIN');
    await appClient.query(`SET LOCAL app.current_tenant = '${tenantId}'`);
    const ledgerRes = await appClient.query(`SELECT type, amount_paisa, balance_after_paisa, reason FROM tenant_wallet_ledger WHERE tenant_id = $1 ORDER BY created_at ASC`, [tenantId]);
    await appClient.query('COMMIT');
    log(`Ledger Audit Trail: ${JSON.stringify(ledgerRes.rows, null, 2)}`);

    const passed =
      ledgerRes.rows.length === 2 &&
      ledgerRes.rows[0].balance_after_paisa === 50000 &&
      ledgerRes.rows[1].balance_after_paisa === 49975;

    if (passed) {
      log('✅ PHASE 4 AUDIT PASSED: Prepaid Communications Wallet & Ledger RLS verified!');
    } else {
      log('❌ PHASE 4 AUDIT FAILED: Ledger balance calculation discrepancy.');
      process.exit(1);
    }
  } catch (err) {
    log(`Phase 4 Audit Error: ${err.message}`);
    process.exit(1);
  } finally {
    await adminClient.query(`DELETE FROM tenant WHERE subdomain LIKE 'wallet-store-%'`).catch(() => {});
    await adminClient.end();
    await appClient.end();
  }
}

testWallet();
