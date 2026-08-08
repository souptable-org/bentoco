/**
 * Storefront money helpers.
 *
 * Medusa product/cart unit prices are tax-exclusive today
 * (`is_calculated_price_tax_inclusive: false`). Catalog surfaces show
 * GST-inclusive amounts so the sticker price matches what customers expect
 * in Indian retail; checkout still shows the Medusa tax breakdown.
 */

/** Default India GST rate used for inclusive catalog display. */
export const DEFAULT_GST_RATE = 0.18

export function formatInr(
  amount: number,
  opts?: { maximumFractionDigits?: number }
): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: opts?.maximumFractionDigits ?? 0,
  }).format(amount)
}

/**
 * Convert a tax-exclusive amount to a GST-inclusive display price.
 * When `alreadyInclusive` is true, returns the amount unchanged.
 */
export function withGstInclusive(
  exclusiveAmount: number,
  opts?: { rate?: number; alreadyInclusive?: boolean }
): number {
  if (opts?.alreadyInclusive) return exclusiveAmount
  const rate = opts?.rate ?? DEFAULT_GST_RATE
  // Whole rupees for catalog stickers (common Indian retail presentation)
  return Math.round(exclusiveAmount * (1 + rate))
}
