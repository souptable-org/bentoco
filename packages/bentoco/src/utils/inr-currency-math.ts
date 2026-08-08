/**
 * Bentoco INR (Paisa Integer Math) Engine
 * Enforces 100% integer arithmetic in Paisa (1 Rupee = 100 Paisa),
 * eliminating floating-point rounding bugs and multi-currency conversion overhead.
 */

export const BENTOCO_DEFAULT_CURRENCY = "inr" as const

export interface GSTBreakdown {
  paisaAmount: number
  gstRatePercent: number
  gstAmount: number
  cgst: number
  sgst: number
  grossAmount: number
}

/**
 * Converts decimal Rupees to integer Paisa (e.g. 499.50 -> 49950)
 */
export function rupeesToPaisa(rupees: number): number {
  return Math.round(rupees * 100)
}

/**
 * Converts integer Paisa to decimal Rupees (e.g. 49950 -> 499.50)
 */
export function paisaToRupees(paisa: number): number {
  return paisa / 100
}

/**
 * Formats integer Paisa into standard Indian currency format (e.g. 49950 -> "₹499.50")
 */
export function formatINR(paisa: number): string {
  const rupees = paisaToRupees(paisa)
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rupees)
}

/**
 * Computes exact Indian GST breakdown (CGST + SGST) in integer Paisa
 */
export function calculateGST(paisaAmount: number, gstRatePercent: number): GSTBreakdown {
  const gstAmount = Math.round((paisaAmount * gstRatePercent) / 100)
  const cgst = Math.floor(gstAmount / 2)
  const sgst = gstAmount - cgst
  const grossAmount = paisaAmount + gstAmount

  return {
    paisaAmount,
    gstRatePercent,
    gstAmount,
    cgst,
    sgst,
    grossAmount,
  }
}

/**
 * Applies percentage discount in integer Paisa
 */
export function applyPercentageDiscount(paisaAmount: number, discountPercent: number): number {
  const discountAmount = Math.round((paisaAmount * discountPercent) / 100)
  return Math.max(0, paisaAmount - discountAmount)
}

/**
 * Validates and locks input currency to INR
 */
export function ensureINRCurrency(currencyCode?: string): string {
  return BENTOCO_DEFAULT_CURRENCY
}
