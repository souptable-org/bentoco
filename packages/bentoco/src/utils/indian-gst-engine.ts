import { calculateGST } from "./inr-currency-math"

export const INDIAN_GST_SLABS = [0, 5, 12, 18, 28] as const
export type GSTSlabRate = (typeof INDIAN_GST_SLABS)[number]

export interface GSTInvoiceLineItem {
  itemId: string
  title: string
  hsnCode: string
  quantity: number
  unitPaisa: number
  totalPaisa: number
  gstRatePercent: GSTSlabRate | number
  cgstPaisa: number
  sgstPaisa: number
  igstPaisa: number
  totalTaxPaisa: number
  grossPaisa: number
}

export interface GSTInvoiceSummary {
  subtotalPaisa: number
  totalCgstPaisa: number
  totalSgstPaisa: number
  totalIgstPaisa: number
  totalTaxPaisa: number
  grandTotalPaisa: number
  isInterstate: boolean
  lineItems: GSTInvoiceLineItem[]
}

/**
 * Indian GST Calculation Engine
 * Replaces complex Western VAT/Avalara engines with flat HSN-code tax breakdowns
 * supporting Intra-state (CGST + SGST) and Inter-state (IGST) calculations in integer Paisa.
 */
export function calculateGSTInvoice(
  items: Array<{
    itemId: string
    title: string
    hsnCode?: string
    quantity: number
    unitPaisa: number
    gstRatePercent?: number
  }>,
  merchantStateCode: string,
  buyerStateCode: string
): GSTInvoiceSummary {
  const isInterstate = merchantStateCode.trim().toLowerCase() !== buyerStateCode.trim().toLowerCase()

  let subtotalPaisa = 0
  let totalCgstPaisa = 0
  let totalSgstPaisa = 0
  let totalIgstPaisa = 0

  const lineItems: GSTInvoiceLineItem[] = items.map((item) => {
    const quantity = Math.max(1, item.quantity)
    const totalPaisa = item.unitPaisa * quantity
    const gstRate = item.gstRatePercent ?? 18 // Default 18% GST D2C rate
    const hsnCode = item.hsnCode || "9983" // Default general HSN

    const gstCalc = calculateGST(totalPaisa, gstRate)

    let cgstPaisa = 0
    let sgstPaisa = 0
    let igstPaisa = 0

    if (isInterstate) {
      igstPaisa = gstCalc.gstAmount
    } else {
      cgstPaisa = gstCalc.cgst
      sgstPaisa = gstCalc.sgst
    }

    subtotalPaisa += totalPaisa
    totalCgstPaisa += cgstPaisa
    totalSgstPaisa += sgstPaisa
    totalIgstPaisa += igstPaisa

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
    }
  })

  const totalTaxPaisa = totalCgstPaisa + totalSgstPaisa + totalIgstPaisa
  const grandTotalPaisa = subtotalPaisa + totalTaxPaisa

  return {
    subtotalPaisa,
    totalCgstPaisa,
    totalSgstPaisa,
    totalIgstPaisa,
    totalTaxPaisa,
    grandTotalPaisa,
    isInterstate,
    lineItems,
  }
}
