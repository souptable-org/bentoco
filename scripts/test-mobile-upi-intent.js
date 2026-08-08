const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const logDir = path.resolve(__dirname, '../log');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFile = path.join(logDir, 'test-mobile-upi-intent.txt');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n', 'utf8');
}

fs.writeFileSync(logFile, `=== Mobile UPI Intent Audit Log [${new Date().toISOString()}] ===\n\n`, 'utf8');

function paisaToRupees(paisa) {
  return paisa / 100;
}

function generateUPIIntentUrl(params) {
  const rupees = paisaToRupees(params.paisaAmount).toFixed(2);
  const encodedVpa = encodeURIComponent(params.vpa.trim());
  const encodedPn = encodeURIComponent(params.payeeName.trim());
  const encodedTr = encodeURIComponent(params.orderId.trim());
  const encodedTn = encodeURIComponent(params.note || `Order #${params.orderId}`);

  return `upi://pay?pa=${encodedVpa}&pn=${encodedPn}&tr=${encodedTr}&am=${rupees}&cu=INR&tn=${encodedTn}`;
}

function createMobileUPIIntentDrawer(params) {
  const genericUrl = generateUPIIntentUrl(params);
  const rupeesAmount = paisaToRupees(params.paisaAmount);

  return {
    orderId: params.orderId,
    paisaAmount: params.paisaAmount,
    rupeesAmount,
    genericIntentUrl: genericUrl,
    appIntents: {
      gpay: genericUrl.replace(/^upi:\/\//, 'tez://'),
      phonepe: genericUrl.replace(/^upi:\/\//, 'phonepe://'),
      paytm: genericUrl.replace(/^upi:\/\//, 'paytmmp://'),
    },
  };
}

function verifyGatewayWebhookSignature(rawBody, signature, webhookSecret) {
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');
  return expectedSignature.toLowerCase() === signature.trim().toLowerCase();
}

function runUPIIntentTests() {
  log('--- Starting Mobile UPI Intent Adapter Audit ---');

  const intentParams = {
    vpa: 'urbanthreads@razorpay',
    payeeName: 'Urban Threads D2C',
    orderId: 'ord_987654321',
    paisaAmount: 149900, // ₹1,499.00
    note: 'Prepaid Flip Order #ord_987654321'
  };

  // Test 1: Intent Drawer Generation
  const drawerPayload = createMobileUPIIntentDrawer(intentParams);
  log(`Generated Generic UPI Intent URL: ${drawerPayload.genericIntentUrl}`);
  log(`GPay Deep-Link: ${drawerPayload.appIntents.gpay}`);
  log(`PhonePe Deep-Link: ${drawerPayload.appIntents.phonepe}`);
  log(`Paytm Deep-Link: ${drawerPayload.appIntents.paytm}`);

  // Test 2: Webhook HMAC Signature Verification
  const rawBody = JSON.stringify({ event: 'payment.captured', order_id: 'ord_987654321' });
  const secret = 'whsec_bentoco_test_secret';
  const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  const isValidSig = verifyGatewayWebhookSignature(rawBody, signature, secret);
  log(`Webhook Signature Validated: ${isValidSig}`);

  const passed =
    drawerPayload.rupeesAmount === 1499 &&
    drawerPayload.genericIntentUrl.includes('am=1499.00') &&
    drawerPayload.appIntents.gpay.startsWith('tez://pay') &&
    drawerPayload.appIntents.phonepe.startsWith('phonepe://pay') &&
    isValidSig === true;

  if (passed) {
    log('✅ MOBILE UPI INTENT AUDIT PASSED: Slide-up drawer URLs & gateway webhook signatures verified!');
  } else {
    log('❌ MOBILE UPI INTENT AUDIT FAILED: UPI Intent drawer error.');
    process.exit(1);
  }
}

runUPIIntentTests();
