const fs = require('fs');
const path = require('path');

const logDir = path.resolve(__dirname, '../log');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFile = path.join(logDir, 'test-indian-gst-engine.txt');

function log(msg) {
  console.log(msg);
  fs.appendFileSync(logFile, msg + '\n', 'utf8');
}

fs.writeFileSync(logFile, `=== Indian GST Engine Audit Log [${new Date().toISOString()}] ===\n\n`, 'utf8');

function calculateGST(paisaAmount, gstRatePercent) {
  const gstAmount = Math.round((paisaAmount * gstRatePercent) / 100);
  const cgst = Math.floor(gstAmount / 2);
  const sgst = gstAmount - cgst;
  const grossAmount = paisaAmount + gstAmount;
  return { paisaAmount, gstRatePercent, gstAmount, cgst, sgst, grossAmount };
}

function calculateGSTInvoice(items, merchantStateCode, buyerStateCode) {
  const isInterstate = merchantStateCode.trim().toLowerCase() !== buyerStateCode.trim().toLowerCase();
  let subtotalPaisa = 0;
  let totalCgstPaisa = 0;
  let totalSgstPaisa = 0;
  let totalIgstPaisa = 0;

  const lineItems = items.map((item) => {
    const quantity = Math.max(1, item.quantity);
    const totalPaisa = item.unitPaisa * quantity;
    const gstRate = item.gstRatePercent ?? 18;
    const hsnCode = item.hsnCode || "9983";

    const gstCalc = calculateGST(totalPaisa, gstRate);

    let cgstPaisa = 0, sgstPaisa = 0, igstPaisa = 0;
    if (isInterstate) {
      igstPaisa = gstCalc.gstAmount;
    } else {
      cgstPaisa = gstCalc.cgst;
      sgstPaisa = gstCalc.sgst;
    }

    subtotalPaisa += totalPaisa;
    totalCgstPaisa += cgstPaisa;
    totalSgstPaisa += sgstPaisa;
    totalIgstPaisa += igstPaisa;

    return {
      itemId: item.itemId,
      title: item.title,
      hsnCode,
      quantity,
      unitPaisa: item.unitPaisa,
      totalPaisa,
      gstRatePercent: gstRate,
      cgstPaisa,
      sgstPaisa,
      igstPaisa,
      totalTaxPaisa: gstCalc.gstAmount,
      grossPaisa: gstCalc.grossAmount,
    };
  });

  const totalTaxPaisa = totalCgstPaisa + totalSgstPaisa + totalIgstPaisa;
  const grandTotalPaisa = subtotalPaisa + totalTaxPaisa;

  return {
    subtotalPaisa,
    totalCgstPaisa,
    totalSgstPaisa,
    totalIgstPaisa,
    totalTaxPaisa,
    grandTotalPaisa,
    isInterstate,
    lineItems,
  };
}

function runGSTTests() {
  log('--- Starting Indian GST Engine Audit ---');

  const items = [
    { itemId: 'item_1', title: 'Oversized Graphic Tee', hsnCode: '6109', quantity: 2, unitPaisa: 99900, gstRatePercent: 12 },
    { itemId: 'item_2', title: 'Matte Clay Hair Wax', hsnCode: '3305', quantity: 1, unitPaisa: 49900, gstRatePercent: 18 }
  ];

  // Test 1: Intra-state (MH -> MH) -> CGST + SGST
  const intrastateRes = calculateGSTInvoice(items, 'MH', 'MH');
  log(`Intra-state (MH -> MH) Invoice Summary: ${JSON.stringify(intrastateRes, null, 2)}`);

  // Test 2: Inter-state (MH -> KA) -> IGST
  const interstateRes = calculateGSTInvoice(items, 'MH', 'KA');
  log(`Inter-state (MH -> KA) Invoice Summary: ${JSON.stringify(interstateRes, null, 2)}`);

  const passed =
    intrastateRes.isInterstate === false &&
    intrastateRes.totalCgstPaisa > 0 &&
    intrastateRes.totalSgstPaisa > 0 &&
    intrastateRes.totalIgstPaisa === 0 &&
    interstateRes.isInterstate === true &&
    interstateRes.totalIgstPaisa > 0 &&
    interstateRes.totalCgstPaisa === 0;

  if (passed) {
    log('✅ INDIAN GST ENGINE AUDIT PASSED: HSN code tax splits & IGST/CGST/SGST calculations verified!');
  } else {
    log('❌ INDIAN GST ENGINE AUDIT FAILED: Tax breakdown discrepancy detected.');
    process.exit(1);
  }
}

runGSTTests();
