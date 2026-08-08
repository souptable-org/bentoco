/**
 * Formats a Paisa integer to full INR string using Indian number system.
 * e.g. 1250000000 paisa → ₹1,25,00,000
 */
export function paisaToInr(paisa: number): string {
  const rupees = paisa / 100
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(rupees)
}

/**
 * Formats a Paisa integer to compact INR using Indian terminology.
 * Uses Lakh (L) and Crore (Cr) — NOT Million or Billion.
 *
 * e.g.
 *   100000000   paisa → ₹10 L
 *   2400000000  paisa → ₹24 L
 *   100000000000 paisa → ₹10 Cr
 */
export function paisaToInrCompact(paisa: number): string {
  const rupees = paisa / 100

  if (rupees >= 10_00_00_000) {
    // 10 Crore+
    const crore = rupees / 1_00_00_000
    return `₹${crore % 1 === 0 ? crore.toFixed(0) : crore.toFixed(2)} Cr`
  }
  if (rupees >= 1_00_00_000) {
    // 1 Crore+
    const crore = rupees / 1_00_00_000
    return `₹${crore.toFixed(2)} Cr`
  }
  if (rupees >= 10_00_000) {
    // 10 Lakh+
    const lakh = rupees / 1_00_000
    return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(1)} L`
  }
  if (rupees >= 1_00_000) {
    // 1 Lakh+
    const lakh = rupees / 1_00_000
    return `₹${lakh.toFixed(2)} L`
  }
  if (rupees >= 1_000) {
    // 1 Thousand+
    const thousands = rupees / 1_000
    return `₹${thousands.toFixed(1)}K`
  }

  return `₹${rupees.toFixed(0)}`
}

/**
 * Formats a Rupee integer directly to compact INR using Indian terminology.
 */
export function rupeesToInrCompact(rupees: number): string {
  return paisaToInrCompact(rupees * 100)
}
