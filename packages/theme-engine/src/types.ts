/**
 * BENT-4 Phase 0 — Theme config contract.
 *
 * Authoring format: Google Labs DESIGN.md
 * @see https://github.com/google-labs-code/design.md
 * @see docs/bent-4-theme-engine/PHASE-0-CONTRACT.md
 */

/** Spec version of the Google DESIGN.md format we target. */
export type DesignMdSpecVersion = "alpha"

/** Only layout shipped in v1. More templates later. */
export type LayoutId = "default"

/**
 * Typography entry as defined in DESIGN.md YAML front matter.
 * @see Google DESIGN.md Typography token type
 */
export type DesignMdTypography = {
  fontFamily: string
  fontSize?: string
  fontWeight?: number | string
  lineHeight?: number | string
  letterSpacing?: string
  fontFeature?: string
  fontVariation?: string
}

/**
 * Parsed YAML front matter from a DESIGN.md file (normative tokens).
 * Keys under colors/typography/etc. are open-ended per the Google spec.
 */
export type DesignMdTokens = {
  version?: DesignMdSpecVersion | string
  name: string
  description?: string
  omitted?: Array<string | { section: string; reason?: string }>
  colors?: Record<string, string>
  typography?: Record<string, DesignMdTypography>
  rounded?: Record<string, string>
  spacing?: Record<string, string | number>
  components?: Record<string, Record<string, string>>
}

/**
 * Config Editor radius control: 5 discrete steps mapped onto the theme's
 * `rounded` scale at apply time.
 */
export type RadiusStep = 0 | 1 | 2 | 3 | 4

/**
 * Surface-level tweaks from Theme Config Editor (not free-form layout).
 * Merged over base DESIGN.md tokens: overrides win.
 */
export type ThemeOverrides = {
  /** Light mode semantic colors (default) */
  colors?: Record<string, string>
  /** Dark mode semantic colors — applied under html.dark / .dark */
  colors_dark?: Record<string, string>
  /** Prefer font family names; applied to display / text / highlight roles. */
  fonts?: {
    display?: string
    text?: string
    highlight?: string
    display_url?: string
    text_url?: string
    highlight_url?: string
  }
  /** 0 = sharp … 4 = most rounded */
  radius_step?: RadiusStep
}

export type ThemeBranding = {
  logo_icon_url?: string
  logo_icon_file_name?: string
  /** @deprecated use logo_icon_url */
  logo_url?: string
  wordmark_enabled?: boolean
  wordmark_mode?: "svg" | "font"
  wordmark_svg_url?: string
  wordmark_svg_file_name?: string
  wordmark_text?: string
  wordmark_font_family?: string
  wordmark_font_url?: string
  wordmark_font_file_name?: string
  /** @deprecated legacy */
  wordmark?:
    | string
    | {
        type: string
        value: string
      }
}

export type ThemeBanner = {
  url: string
  alt?: string
}

/**
 * Homepage category block (theme config, not a Medusa category itself).
 * Merchants name a section, optionally browse a native product category,
 * curate product_ids (toggles + one-by-one), and cap how many show.
 */
export type ThemeCategorySection = {
  /** Display title on the storefront */
  title: string
  /**
   * How products were picked (mutually exclusive in the editor):
   * - category: browse a Medusa category + toggles
   * - offer: products targeted by a Medusa promotion
   * - manual: add products one by one via search
   */
  source?: "category" | "manual" | "offer"
  /**
   * Medusa product category id (`pcat_…`) when source is "category".
   * Products are still curated via product_ids.
   */
  category_id?: string
  /** Medusa promotion id when source is "offer" */
  promotion_id?: string
  /** Ordered product ids to show (curated list) */
  product_ids?: string[]
  /**
   * Max products in this section (used when source is category or offer).
   * Manual sections ignore this and show all product_ids.
   */
  limit?: number
  sort: number
}

/** Trust bar under hero: Free delivery, 100% cotton, etc. */
export type ThemePromiseItem = {
  /**
   * Library icon key (e.g. "truck") or "custom" when using icon_url.
   */
  icon: string
  /** preset = library; custom = uploaded file at icon_url */
  icon_mode?: "preset" | "custom"
  /** Server-hosted custom icon URL (SVG/PNG/WebP) */
  icon_url?: string
  icon_file_name?: string
  /** Short sub text shown under/beside the icon */
  text: string
}

export type ThemePromises = {
  /** When false, hide the whole promises bar from the layout */
  enabled?: boolean
  /** Up to 3–4 items recommended */
  items?: ThemePromiseItem[]
}

export type ThemeHomepage = {
  banners?: ThemeBanner[]
  /** Trust / promises bar under hero */
  promises?: ThemePromises
  category_sections?: ThemeCategorySection[]
}

/**
 * Persisted per-tenant theme state (`tenant.theme_config`).
 * Base look comes from DESIGN.md; editor writes overrides + branding + homepage.
 */
export type ThemeConfig = {
  schema_version: 1
  /** Stable id of the installed base pack (e.g. "warm-minimalist") */
  active_theme_id: string
  layout_id: LayoutId
  /** Full DESIGN.md source for the active base theme (import/export/download) */
  design_md: string
  /** Parsed front matter from design_md (recomputed on install/import) */
  tokens: DesignMdTokens
  overrides?: ThemeOverrides
  branding?: ThemeBranding
  homepage?: ThemeHomepage
  published_at?: string
}

/** Merchant library entry (installed packs available to install as active). */
export type ThemeLibraryEntry = {
  id: string
  name: string
  description?: string
  design_md: string
  source: "preset" | "import"
  installed_at?: string
}
