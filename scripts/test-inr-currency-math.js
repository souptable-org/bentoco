const fs = require('fs');
const path = require('path');

const logDir = path.resolve(__dirname, '../log');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFile = path.join(logDir, 'test-inr-currency-math.txt');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n', 'utf8');
}

// Clear old log
fs.writeFileSync(logFile, `=== INR Currency Math Audit Log [${new Date().toISOString()}] ===\n\n`, 'utf8');

function rupeesToPaisa(rupees) {
  return Math.round(rupees * 100);
}

function paisaToRupees(paisa) {
  return paisa / 100;
}

function formatINR(paisa) {
  const rupees = paisaToRupees(paisa);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

function calculateGST(paisaAmount, gstRatePercent) {
  const gstAmount = Math.round((paisaAmount * gstRatePercent) / 100);
  const cgst = Math.floor(gstAmount / 2);
  const sgst = gstAmount - cgst;
  const grossAmount = paisaAmount + gstAmount;
  return { paisaAmount, gstRatePercent, gstAmount, cgst, sgst, grossAmount };
}

function testCurrencyMath() {
  log('--- Starting INR Currency & Integer Math Audit ---');

  // Test 1: Conversion (₹499.50 -> 49950 Paisa)
  const paisa1 = rupeesToPaisa(499.50);
  log(`Rupees to Paisa (499.50): ${paisa1} Paisa`);

  // Test 2: Formatting (49950 Paisa -> "₹499.50")
  const formatted1 = formatINR(49950);
  log(`Paisa Formatted: ${formatted1}`);

  // Test 3: 18% GST Calculation on ₹499.00 (49900 Paisa)
  const gstRes = calculateGST(49900, 18);
  log(`18% GST Calculation on 49900 Paisa: ${JSON.stringify(gstRes)}`);

  // Verification checks
  const passed =
    paisa1 === 49950 &&
    paisaToRupees(paisa1) === 499.50 &&
    gstRes.gstAmount === 8982 &&
    gstRes.cgst === 4491 &&
    gstRes.sgst === 4491 &&
    gstRes.grossAmount === 58882;

  if (passed) {
    log('✅ INR CURRENCY MATH AUDIT PASSED: 100% integer precision verified in Paisa!');
  } else {
    log('❌ INR CURRENCY MATH AUDIT FAILED: Math discrepancy detected.');
    process.exit(1);
  }
}

testCurrencyMath();
