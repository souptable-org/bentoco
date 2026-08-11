/**
 * Tenant theme fetch for storefront.
 *
 * Data flow (tenant homepage):
 *   page.tsx (server) → fetchStorefrontTheme → pass branding/homepage props
 *   → TenantStorefront (client). CSS/fonts inject via ThemeStyles in layout.
 */

export type ThemeBranding = {
  logo_icon_url?: string
  logo_icon_file_name?: string
  logo_url?: string
  wordmark_enabled?: boolean
  wordmark_mode?: "svg" | "font" | string
  wordmark_svg_url?: string
  wordmark_svg_file_name?: string
  wordmark_text?: string
  wordmark_font_family?: string
  wordmark_font_url?: string
  wordmark_font_file_name?: string
  wordmark?: string | { type: string; value: string }
}

export type ThemeBanner = {
  url: string
  alt?: string
}

export type ThemePromiseItem = {
  icon: string
  icon_mode?: "preset" | "custom"
  icon_url?: string
  icon_file_name?: string
  text: string
}

export type ThemePromises = {
  enabled?: boolean
  items?: ThemePromiseItem[]
}

export type ThemeCategorySection = {
  title: string
  source?: "category" | "manual" | "offer"
  category_id?: string
  promotion_id?: string
  product_ids?: string[]
  limit?: number
  sort: number
}

export type StorefrontThemePayload = {
  tenant_id: string | null
  store_name?: string
  subdomain?: string | null
  custom_domain?: string | null
  theme_config?: {
    active_theme_id?: string
    layout_id?: string
    published_at?: string
    branding?: ThemeBranding
    homepage?: {
      banners?: ThemeBanner[]
      promises?: ThemePromises
      category_sections?: ThemeCategorySection[]
    }
  }
  css: string
  font_stylesheet_url: string | null
  font_stylesheet_urls?: string[]
  source?: string
}

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  process.env.MEDUSA_BACKEND_URL ||
  "http://localhost:9000"
).replace(/\/$/, "")

const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || ""

/**
 * Fetch compiled tenant theme CSS + config for storefront injection.
 * Falls back to empty CSS if API is unavailable (shell defaults apply).
 *
 * Cache: short revalidate in production; no-store when preview=1 or NODE_ENV=development
 * so editor Save → Refresh preview sees fresh theme without ~60s lag.
 */
export async function fetchStorefrontTheme(options?: {
  tenantId?: string | null
  host?: string | null
  /** Bust cache (editor iframe / after save) */
  preview?: boolean
}): Promise<StorefrontThemePayload> {
  const params = new URLSearchParams()
  if (options?.tenantId) params.set("tenant_id", options.tenantId)
  if (options?.host) params.set("domain", options.host)

  const qs = params.toString()
  const url = `${BACKEND_URL}/store/tenant/theme${qs ? `?${qs}` : ""}`

  const isDev = process.env.NODE_ENV === "development"
  const noStore = options?.preview === true || isDev

  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }
    if (PUBLISHABLE_KEY) {
      headers["x-publishable-api-key"] = PUBLISHABLE_KEY
    }
    if (options?.tenantId) {
      headers["x-tenant-id"] = options.tenantId
    }

    const res = await fetch(url, {
      headers,
      ...(noStore
        ? { cache: "no-store" as RequestCache }
        : { next: { revalidate: 15, tags: ["tenant-theme"] } }),
    })

    if (!res.ok) {
      console.warn("[theme] theme API failed", res.status)
      return emptyTheme()
    }

    const data = (await res.json()) as StorefrontThemePayload
    if (!data?.css && !data?.theme_config) return emptyTheme()
    return data
  } catch (err) {
    console.warn("[theme] theme fetch error", err)
    return emptyTheme()
  }
}

function emptyTheme(): StorefrontThemePayload {
  return {
    tenant_id: null,
    css: "",
    font_stylesheet_url: null,
    font_stylesheet_urls: [],
    source: "storefront-empty",
  }
}
