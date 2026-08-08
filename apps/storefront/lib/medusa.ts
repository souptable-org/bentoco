import type { Product } from "./types"

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  process.env.MEDUSA_BACKEND_URL ||
  "http://localhost:9000"
).replace(/\/$/, "")

const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

type MedusaImage = { url?: string; id?: string }
type MedusaVariant = {
  id?: string
  title?: string
  calculated_price?: {
    calculated_amount?: number
    original_amount?: number
    currency_code?: string
  }
  prices?: { amount?: number; currency_code?: string }[]
  options?: { value?: string }[]
}
type MedusaProduct = {
  id: string
  title?: string
  handle?: string
  description?: string | null
  thumbnail?: string | null
  images?: MedusaImage[]
  collection?: { title?: string } | null
  tags?: { value?: string }[]
  variants?: MedusaVariant[]
  created_at?: string
}

/**
 * Store API fetch with publishable key (Medusa v2).
 */
export async function medusaFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${BACKEND_URL}${path.startsWith("/") ? path : `/${path}`}`
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init?.headers || {}),
  }
  if (PUBLISHABLE_KEY) {
    ;(headers as Record<string, string>)["x-publishable-api-key"] =
      PUBLISHABLE_KEY
  }

  const res = await fetch(url, {
    ...init,
    headers,
    // Shop listing can be cached lightly; client pages revalidate on demand
    next: { revalidate: 30 },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new Error(
      `Medusa ${res.status} ${path}${body ? `: ${body.slice(0, 200)}` : ""}`
    )
  }
  return res.json() as Promise<T>
}

/**
 * Medusa v2 amounts are already major currency units (INR rupees, not paisa).
 * Round for display; do not divide by 100.
 */
function toRupees(amount: number | undefined | null): number {
  if (amount == null || Number.isNaN(Number(amount))) return 0
  return Math.round(Number(amount))
}

function variantAmount(v?: MedusaVariant): number {
  return (
    v?.calculated_price?.calculated_amount ??
    v?.prices?.[0]?.amount ??
    0
  )
}

export function mapMedusaProduct(p: MedusaProduct): Product {
  const variants = (p.variants || []).map((v) => ({
    id: v.id || "",
    title: v.title || "Default",
    price: toRupees(variantAmount(v)),
    options: (v.options || [])
      .map((o) => o.value?.trim() || "")
      .filter(Boolean),
  })).filter((v) => v.id)

  const variant = p.variants?.[0]
  const rawPrice = variantAmount(variant)
  const rawOriginal =
    variant?.calculated_price?.original_amount != null &&
    variant.calculated_price.original_amount !==
      variant.calculated_price.calculated_amount
      ? variant.calculated_price.original_amount
      : undefined

  const images: string[] = []
  if (p.thumbnail) images.push(p.thumbnail)
  for (const img of p.images || []) {
    if (img.url && !images.includes(img.url)) images.push(img.url)
  }
  if (images.length === 0) {
    images.push(`https://picsum.photos/seed/${p.id}/800/1000`)
  }

  const sizes = new Set<string>()
  for (const v of variants) {
    for (const val of v.options) {
      if (/^(xxs|xs|s|m|l|xl|xxl|xxxl|\d+)$/i.test(val)) {
        sizes.add(val.toUpperCase())
      }
    }
  }

  const tags = (p.tags || []).map((t) => t.value || "").filter(Boolean)
  const category = p.collection?.title || tags[0] || "Collection"

  return {
    id: p.id,
    name: p.title || "Untitled",
    slug: p.handle || p.id,
    description: p.description || "",
    price: toRupees(rawPrice),
    originalPrice: rawOriginal != null ? toRupees(rawOriginal) : undefined,
    images,
    category,
    sizes: sizes.size ? Array.from(sizes) : undefined,
    tags,
    isNew: p.created_at
      ? Date.now() - new Date(p.created_at).getTime() < 1000 * 60 * 60 * 24 * 30
      : false,
    rating: 4.6,
    reviews: 0,
    features: [],
    details: {},
    variantId: variants[0]?.id,
    variants,
  }
}

/** Pick Medusa variant id from product + optional size/color labels. */
export function resolveVariantId(
  product: Product,
  size?: string,
  color?: string
): string | undefined {
  if (!product.variants?.length) return product.variantId
  const needles = [size, color].filter(Boolean).map((s) => s!.toLowerCase())
  if (!needles.length) return product.variants[0].id

  const match = product.variants.find((v) => {
    const opts = v.options.map((o) => o.toLowerCase())
    const title = v.title.toLowerCase()
    return needles.every(
      (n) => opts.some((o) => o.includes(n) || n.includes(o)) || title.includes(n)
    )
  })
  return match?.id || product.variants[0].id
}

export async function fetchStoreProducts(limit = 50): Promise<Product[]> {
  const data = await medusaFetch<{ products: MedusaProduct[] }>(
    `/store/products?limit=${limit}&fields=*variants,*variants.calculated_price,*images,*collection,*tags`
  )
  return (data.products || []).map(mapMedusaProduct)
}

export async function fetchStoreProductByHandle(
  handle: string
): Promise<Product | null> {
  const data = await medusaFetch<{ products: MedusaProduct[] }>(
    `/store/products?handle=${encodeURIComponent(handle)}&limit=1&fields=*variants,*variants.calculated_price,*images,*collection,*tags`
  )
  const p = data.products?.[0]
  return p ? mapMedusaProduct(p) : null
}

export function getMedusaBackendUrl() {
  return BACKEND_URL
}

export function isMedusaConfigured() {
  return Boolean(BACKEND_URL)
}
