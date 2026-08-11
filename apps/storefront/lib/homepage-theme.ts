/**
 * Pure homepage theme helpers (shipped entry points for unit tests).
 * Used by page.tsx / TenantStorefront to apply editor config without re-implementing logic.
 */

export type CategorySectionSource = "category" | "manual" | "offer" | string

export type RawCategorySection = {
  title?: string
  source?: CategorySectionSource
  category_id?: string
  promotion_id?: string
  product_ids?: string[]
  limit?: number
  sort?: number
}

/**
 * Whether this section uses a max product cap (category / offer browse modes).
 * Manual one-by-one lists use the full product_ids array.
 */
export function sectionUsesLimit(sec: {
  source?: string
  category_id?: string
}): boolean {
  if (sec.source === "category" || sec.source === "offer") return true
  // Legacy: only category_id without source
  if (!sec.source && !!sec.category_id) return true
  return false
}

/**
 * Slice product ids for a homepage section given source + limit.
 * Preserves order. Manual sections return all ids (up to 48 safety cap).
 */
export function sliceSectionProductIds(
  productIds: string[] | undefined,
  options: { source?: string; category_id?: string; limit?: number }
): string[] {
  const ids = (productIds || []).filter(Boolean)
  if (!ids.length) return []
  const usesLimit = sectionUsesLimit(options)
  if (!usesLimit) {
    return ids.slice(0, 48)
  }
  const limit = Math.max(1, Math.min(48, options.limit ?? 8))
  return ids.slice(0, limit)
}

/**
 * Re-order API products to match curated id list order; drop missing ids.
 */
export function orderProductsByIds<T extends { id: string }>(
  products: T[],
  orderedIds: string[]
): T[] {
  const byId = new Map(products.map((p) => [p.id, p]))
  return orderedIds.map((id) => byId.get(id)).filter(Boolean) as T[]
}

/**
 * Sort sections by sort field ascending.
 */
export function sortCategorySections<T extends { sort?: number }>(
  sections: T[]
): T[] {
  return [...sections].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
}

/**
 * True when promises bar should render.
 */
export function promisesBarVisible(promises?: {
  enabled?: boolean
  items?: Array<{ text?: string }>
}): boolean {
  if (!promises) return false
  if (promises.enabled === false) return false
  const items = (promises.items || []).filter((i) => (i.text || "").trim())
  return items.length > 0
}

/**
 * Normalize banner list for hero: only entries with url.
 */
export function activeBanners(
  banners?: Array<{ url?: string; alt?: string }>
): Array<{ url: string; alt?: string }> {
  return (banners || [])
    .filter((b) => (b.url || "").trim())
    .map((b) => ({ url: b.url!.trim(), alt: b.alt }))
}

/**
 * Whether to suppress the Unsplash mock catalog.
 * True when any configured section resolved to products.
 */
export function shouldSuppressMockCatalog(
  categorySections: Array<{ products?: unknown[] }>
): boolean {
  return categorySections.some((s) => (s.products?.length || 0) > 0)
}
