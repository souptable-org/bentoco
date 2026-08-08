const path = require('path');

function resolveHostToTenantId(host, customMap) {
  if (!host) {
    return { tenantId: null, subdomain: null, customDomain: null };
  }
  const cleanHost = host.split(':')[0].toLowerCase();
  if (customMap && customMap[cleanHost]) {
    return {
      tenantId: customMap[cleanHost],
      subdomain: cleanHost.split('.')[0],
      customDomain: cleanHost
    };
  }
  const parts = cleanHost.split('.');
  if (parts.length > 1 && (parts.includes('localhost') || parts.includes('bentoco'))) {
    return {
      tenantId: null,
      subdomain: parts[0],
      customDomain: null
    };
  }
  return {
    tenantId: null,
    subdomain: null,
    customDomain: cleanHost
  };
}

function handleEdgeTenantMiddleware(req, customMap) {
  let host = req.headers['host'] || '';
  let explicitTenantId = req.headers['x-tenant-id'] || null;

  const resolution = resolveHostToTenantId(host, customMap);
  const finalTenantId = explicitTenantId || resolution.tenantId;

  const responseHeaders = {};
  if (finalTenantId) responseHeaders['x-tenant-id'] = finalTenantId;
  if (resolution.subdomain) responseHeaders['x-tenant-subdomain'] = resolution.subdomain;
  if (resolution.customDomain) responseHeaders['x-tenant-custom-domain'] = resolution.customDomain;

  return {
    tenantId: finalTenantId,
    subdomain: resolution.subdomain,
    customDomain: resolution.customDomain,
    headers: responseHeaders
  };
}

function runTests() {
  console.log('--- Starting Module 4: Edge Subdomain & Domain Resolution Audit ---');

  const customMap = {
    'brand-a.localhost': 'tenant_uuid_1111',
    'custombrand.com': 'tenant_uuid_2222'
  };

  // Test Case 1: Localhost Subdomain (brand-a.localhost:3000)
  const req1 = { headers: { host: 'brand-a.localhost:3000' } };
  const res1 = handleEdgeTenantMiddleware(req1, customMap);
  console.log('Test 1 (brand-a.localhost:3000):', res1);

  // Test Case 2: Custom Domain (custombrand.com)
  const req2 = { headers: { host: 'custombrand.com' } };
  const res2 = handleEdgeTenantMiddleware(req2, customMap);
  console.log('Test 2 (custombrand.com):', res2);

  // Test Case 3: Explicit Header Override (x-tenant-id)
  const req3 = { headers: { host: 'unknown.localhost', 'x-tenant-id': 'override_uuid_3333' } };
  const res3 = handleEdgeTenantMiddleware(req3, customMap);
  console.log('Test 3 (x-tenant-id override):', res3);

  const passed =
    res1.tenantId === 'tenant_uuid_1111' && res1.subdomain === 'brand-a' &&
    res2.tenantId === 'tenant_uuid_2222' && res2.customDomain === 'custombrand.com' &&
    res3.tenantId === 'override_uuid_3333';

  if (passed) {
    console.log('✅ MODULE 4 PASSED: Edge Domain & Subdomain resolver working flawlessly!');
  } else {
    console.error('❌ MODULE 4 FAILED: Edge resolver did not parse headers correctly.');
    process.exit(1);
  }
}

runTests();
