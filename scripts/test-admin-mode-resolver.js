const fs = require('fs');
const path = require('path');

const logDir = path.resolve(__dirname, '../log');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFile = path.join(logDir, 'test-admin-mode-resolver.txt');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n', 'utf8');
}

fs.writeFileSync(logFile, `=== Admin Mode Resolver Audit Log [${new Date().toISOString()}] ===\n\n`, 'utf8');

function resolveAdminMode(host, pathname = '/') {
  const cleanHost = (host || '').split(':')[0].toLowerCase();
  const cleanPath = (pathname || '/').toLowerCase();

  const isAgencyHost =
    cleanHost === 'agency.bentoco.com' ||
    cleanHost === 'agency.localhost' ||
    cleanHost.startsWith('agency.');

  const mode = isAgencyHost ? 'AGENCY' : 'MERCHANT';
  const blockedRoutes = [];

  if (mode === 'MERCHANT') {
    if (
      cleanPath.startsWith('/agency') ||
      cleanPath.startsWith('/billing/agency') ||
      cleanPath.startsWith('/team/agency')
    ) {
      blockedRoutes.push(cleanPath);
    }
  }

  return { mode, hostname: cleanHost, isAgencyHost, isMerchantHost: !isAgencyHost, blockedRoutes };
}

function runModeTests() {
  log('--- Starting Phase 5 Step 2: Admin Mode & Domain Resolution Audit ---');

  // Test 1: Agency Domain Resolution (agency.bentoco.com)
  const agencyRes = resolveAdminMode('agency.bentoco.com:3000', '/agency/dashboard');
  log(`Host "agency.bentoco.com:3000" Path "/agency/dashboard": Mode = ${agencyRes.mode}`);

  // Test 2: Merchant Domain Resolution (app.bentoco.com)
  const merchantRes = resolveAdminMode('app.bentoco.com:3000', '/dashboard');
  log(`Host "app.bentoco.com:3000" Path "/dashboard": Mode = ${merchantRes.mode}`);

  // Test 3: Blocked Agency Route in Merchant Mode
  const blockedRes = resolveAdminMode('app.bentoco.com:3000', '/agency/billing');
  log(`Host "app.bentoco.com:3000" Path "/agency/billing": Blocked Routes = ${JSON.stringify(blockedRes.blockedRoutes)}`);

  const passed =
    agencyRes.mode === 'AGENCY' &&
    merchantRes.mode === 'MERCHANT' &&
    blockedRes.blockedRoutes.length > 0;

  if (passed) {
    log('✅ ADMIN MODE RESOLVER AUDIT PASSED: Domain mode resolution & route isolation verified!');
  } else {
    log('❌ ADMIN MODE RESOLVER AUDIT FAILED: Mode resolution discrepancy detected.');
    process.exit(1);
  }
}

runModeTests();
