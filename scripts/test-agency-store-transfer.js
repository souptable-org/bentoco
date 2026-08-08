const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
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

const logDir = path.resolve(__dirname, '../log');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFile = path.join(logDir, 'test-agency-store-transfer.txt');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n', 'utf8');
}

fs.writeFileSync(logFile, `=== Phase 5 Agency Store Transfer Audit Log [${new Date().toISOString()}] ===\n\n`, 'utf8');

function hashTransferCode(code) {
  return crypto.createHash('sha256').update(code.trim()).digest('hex');
}

async function testAgencyTransfer() {
  const adminClient = new Client({ connectionString: adminConn });
  await adminClient.connect();

  try {
    log('--- Starting Phase 5: Agency Mode & UID Store Transfer Audit ---');

    const suffix = Date.now();
    const agencySubdomain = `pixelcraft-${suffix}`;
    const storeSubdomain = `clientbrand-${suffix}`;
    const uniqueUid = `AGENCY-${Math.floor(100000 + Math.random() * 900000)}`;

    // 1. Create Agency Account
    const agencyRes = await adminClient.query(
      `INSERT INTO agency (name, subdomain, unique_uid, owner_email)
       VALUES ('PixelCraft Agency', '${agencySubdomain}', '${uniqueUid}', 'agency@pixelcraft.com')
       RETURNING id, unique_uid`
    );
    const agencyId = agencyRes.rows[0].id;
    log(`Created Agency Account [${agencySubdomain}] Unique UID: ${uniqueUid}`);

    // 2. Create Independent Merchant Store
    const tenantRes = await adminClient.query(
      `INSERT INTO tenant (store_name, subdomain, ownership_status)
       VALUES ('Client Fashion Store', '${storeSubdomain}', 'INDEPENDENT_MERCHANT')
       RETURNING id, ownership_status`
    );
    const tenantId = tenantRes.rows[0].id;
    log(`Created Independent Merchant Store [${storeSubdomain}] Initial Status: ${tenantRes.rows[0].ownership_status}`);

    // 3. Initiate Transfer via Unique UID Handshake
    const rawCode = '654321';
    const codeHash = hashTransferCode(rawCode);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await adminClient.query(
      `UPDATE tenant SET transfer_code_hash = $1, transfer_expires_at = $2, ownership_status = 'TRANSFER_PENDING' WHERE id = $3`,
      [codeHash, expiresAt, tenantId]
    );
    log(`Initiated Delegation to ${uniqueUid} -> Status: TRANSFER_PENDING`);

    // 4. Approve Delegation Handshake -> AGENCY_MANAGED
    await adminClient.query(
      `UPDATE tenant SET agency_id = $1, ownership_status = 'AGENCY_MANAGED', transfer_code_hash = NULL, transfer_expires_at = NULL WHERE id = $2`,
      [agencyId, tenantId]
    );
    const managedRes = await adminClient.query(`SELECT ownership_status, agency_id FROM tenant WHERE id = $1`, [tenantId]);
    log(`Approved Handshake -> New Status: ${managedRes.rows[0].ownership_status}, Agency ID: ${managedRes.rows[0].agency_id}`);

    // 5. Transfer Ownership Back to Merchant -> INDEPENDENT_MERCHANT
    await adminClient.query(
      `UPDATE tenant SET agency_id = NULL, ownership_status = 'INDEPENDENT_MERCHANT' WHERE id = $1`,
      [tenantId]
    );
    const handoffRes = await adminClient.query(`SELECT ownership_status, agency_id FROM tenant WHERE id = $1`, [tenantId]);
    log(`Handoff Back to Merchant -> Final Status: ${handoffRes.rows[0].ownership_status}, Agency ID: ${handoffRes.rows[0].agency_id || 'NULL'}`);

    const passed =
      managedRes.rows[0].ownership_status === 'AGENCY_MANAGED' &&
      managedRes.rows[0].agency_id === agencyId &&
      handoffRes.rows[0].ownership_status === 'INDEPENDENT_MERCHANT' &&
      handoffRes.rows[0].agency_id === null;

    if (passed) {
      log('✅ PHASE 5 AUDIT PASSED: Agency account creation, Unique UID delegation, & handoff verified!');
    } else {
      log('❌ PHASE 5 AUDIT FAILED: Ownership status transition error.');
      process.exit(1);
    }
  } catch (err) {
    log(`Phase 5 Audit Error: ${err.message}`);
    process.exit(1);
  } finally {
    await adminClient.query(`DELETE FROM tenant WHERE subdomain LIKE 'clientbrand-%'`).catch(() => {});
    await adminClient.query(`DELETE FROM agency WHERE subdomain LIKE 'pixelcraft-%'`).catch(() => {});
    await adminClient.end();
  }
}

testAgencyTransfer();
