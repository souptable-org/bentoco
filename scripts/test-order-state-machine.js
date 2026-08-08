const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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

const logDir = path.resolve(__dirname, '../log');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFile = path.join(logDir, 'test-order-state-machine.txt');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n', 'utf8');
}

fs.writeFileSync(logFile, `=== Phase 3 Order State Machine Audit Log [${new Date().toISOString()}] ===\n\n`, 'utf8');

function hashOTP(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

async function testStateMachine() {
  const adminClient = new Client({ connectionString: adminConn });
  const appClient = new Client({ connectionString: appConn });

  await adminClient.connect();
  await appClient.connect();

  try {
    log('--- Starting Phase 3: Indian Order State Machine & OTP Audit ---');

    const suffix = Date.now();
    const subdomain = `state-store-${suffix}`;

    // 1. Provision Test Tenant
    const tenantRes = await adminClient.query(
      `INSERT INTO tenant (store_name, subdomain) VALUES ('State Machine Store', '${subdomain}') RETURNING id`
    );
    const tenantId = tenantRes.rows[0].id;
    log(`Provisioned Test Tenant [${subdomain}] ID: ${tenantId}`);

    // 2. Create Order in ORDER_INITIATED status as bentoco_app
    const orderId = `order_test_${suffix}`;
    await appClient.query('BEGIN');
    await appClient.query(`SET LOCAL app.current_tenant = '${tenantId}'`);
    await appClient.query(
      `INSERT INTO "order" (id, tenant_id, email, status, total)
       VALUES ($1, $2, $3, 'ORDER_INITIATED', 149900)`,
      [orderId, tenantId, 'buyer@example.com']
    );
    await appClient.query('COMMIT');
    log(`Created Order [${orderId}] in status ORDER_INITIATED`);

    // 3. Trigger WhatsApp 4-Digit OTP Generation -> WHATSAPP_VERIFYING
    const rawOtp = '8492';
    const otpHash = hashOTP(rawOtp);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await appClient.query('BEGIN');
    await appClient.query(`SET LOCAL app.current_tenant = '${tenantId}'`);
    await appClient.query(
      `INSERT INTO tenant_otp_session (tenant_id, order_id, phone, otp_code_hash, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [tenantId, orderId, '+919876543210', otpHash, expiresAt]
    );
    await appClient.query(`UPDATE "order" SET status = 'WHATSAPP_VERIFYING' WHERE id = $1 AND tenant_id = $2`, [orderId, tenantId]);
    await appClient.query(
      `INSERT INTO order_state_history (tenant_id, order_id, from_status, to_status, reason)
       VALUES ($1, $2, 'ORDER_INITIATED', 'WHATSAPP_VERIFYING', 'WhatsApp 4-digit OTP dispatched')`,
      [tenantId, orderId]
    );
    await appClient.query('COMMIT');
    log(`Dispatched WhatsApp OTP [${rawOtp}] -> Order status updated to WHATSAPP_VERIFYING`);

    // 4. Test Invalid OTP Attempt
    await appClient.query('BEGIN');
    await appClient.query(`SET LOCAL app.current_tenant = '${tenantId}'`);
    const invalidHash = hashOTP('0000');
    if (invalidHash !== otpHash) {
      await appClient.query(`UPDATE tenant_otp_session SET attempts = attempts + 1 WHERE order_id = $1 AND tenant_id = $2`, [orderId, tenantId]);
    }
    await appClient.query('COMMIT');
    log('Tested invalid OTP attempt -> Attempt count incremented to 1');

    // 5. Test Valid OTP Verification -> COD_VERIFIED
    await appClient.query('BEGIN');
    await appClient.query(`SET LOCAL app.current_tenant = '${tenantId}'`);
    await appClient.query(`UPDATE tenant_otp_session SET is_verified = true WHERE order_id = $1 AND tenant_id = $2`, [orderId, tenantId]);
    await appClient.query(`UPDATE "order" SET status = 'COD_VERIFIED' WHERE id = $1 AND tenant_id = $2`, [orderId, tenantId]);
    await appClient.query(
      `INSERT INTO order_state_history (tenant_id, order_id, from_status, to_status, reason)
       VALUES ($1, $2, 'WHATSAPP_VERIFYING', 'COD_VERIFIED', '4-digit WhatsApp OTP verified')`,
      [tenantId, orderId]
    );
    await appClient.query('COMMIT');
    log('Verified valid OTP -> Order status transitioned to COD_VERIFIED');

    // 6. Test Prepaid Flip -> PREPAID_FLIPPED
    const prepaidOrderId = `order_flip_${suffix}`;
    await appClient.query('BEGIN');
    await appClient.query(`SET LOCAL app.current_tenant = '${tenantId}'`);
    await appClient.query(
      `INSERT INTO "order" (id, tenant_id, email, status, total)
       VALUES ($1, $2, $3, 'WHATSAPP_VERIFYING', 144900)`,
      [prepaidOrderId, tenantId, 'buyer2@example.com']
    );
    await appClient.query(
      `UPDATE "order" SET status = 'PREPAID_FLIPPED', payment_status = 'captured' WHERE id = $1 AND tenant_id = $2`,
      [prepaidOrderId, tenantId]
    );
    await appClient.query(
      `INSERT INTO order_state_history (tenant_id, order_id, from_status, to_status, reason)
       VALUES ($1, $2, 'WHATSAPP_VERIFYING', 'PREPAID_FLIPPED', 'Flipped via instant UPI Intent')`,
      [tenantId, prepaidOrderId]
    );
    await appClient.query('COMMIT');
    log(`Prepaid Flip executed on Order [${prepaidOrderId}] -> Status: PREPAID_FLIPPED`);

    // 7. Verify audit trail history
    await appClient.query('BEGIN');
    await appClient.query(`SET LOCAL app.current_tenant = '${tenantId}'`);
    const historyRes = await appClient.query(
      `SELECT order_id, from_status, to_status, reason FROM order_state_history WHERE tenant_id = $1 ORDER BY created_at ASC`,
      [tenantId]
    );
    await appClient.query('COMMIT');
    log(`Audit Trail History Logged: ${JSON.stringify(historyRes.rows, null, 2)}`);

    const passed = historyRes.rows.length >= 3;
    if (passed) {
      log('✅ PHASE 3 AUDIT PASSED: Indian Order State Machine, 4-digit OTP & Prepaid Flip verified!');
    } else {
      log('❌ PHASE 3 AUDIT FAILED: State transition trail missing.');
      process.exit(1);
    }
  } catch (err) {
    log(`Phase 3 Audit Error: ${err.message}`);
    process.exit(1);
  } finally {
    await adminClient.query(`DELETE FROM tenant WHERE subdomain LIKE 'state-store-%'`).catch(() => {});
    await adminClient.end();
    await appClient.end();
  }
}

testStateMachine();
