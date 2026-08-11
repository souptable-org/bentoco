import {
  COLOR_TOKEN_TO_CSS,
  RADIUS_STEP_TO_ROUNDED_KEY,
  TYPOGRAPHY_ROLE_KEYS,
  type CssCompileInput,
  type CssCompileResult,
} from "./css-map"
import { mergeThemeTokens } from "./merge"
import type { DesignMdTokens, RadiusStep } from "./types"

function mapColorRecord(
  colors: Record<string, string> | undefined
): Record<string, string> {
  const variables: Record<string, string> = {}
  if (colors) {
    for (const [name, value] of Object.entries(colors)) {
      if (!value) continue
      variables[`--theme-color-${name}`] = value
      const cssVar = COLOR_TOKEN_TO_CSS[name]
      if (!cssVar) continue
      const isAlias =
        name === "neutral" ||
        name === "surface" ||
        name === "on-surface" ||
        name === "tertiary" ||
        name === "error"
      if (isAlias && variables[cssVar]) continue
      variables[cssVar] = value
    }
  }
  ensureFallback(variables, "--color-background", [
    colors?.background,
    colors?.neutral,
  ])
  ensureFallback(variables, "--color-foreground", [
    colors?.foreground,
    colors?.primary,
    colors?.["on-surface"],
  ])
  ensureFallback(variables, "--color-primary", [
    colors?.primary,
    colors?.foreground,
  ])
  ensureFallback(variables, "--color-primary-foreground", [
    colors?.["primary-foreground"],
    colors?.["on-primary"],
    colors?.background,
  ])
  ensureFallback(variables, "--color-accent", [
    colors?.accent,
    colors?.tertiary,
  ])
  ensureFallback(variables, "--color-accent-foreground", [
    colors?.["accent-foreground"],
    colors?.["on-accent"],
    colors?.background,
  ])
  ensureFallback(variables, "--color-muted", [colors?.muted, colors?.secondary])
  ensureFallback(variables, "--color-muted-foreground", [
    colors?.["muted-foreground"],
  ])
  ensureFallback(variables, "--color-card", [colors?.card, colors?.background])
  ensureFallback(variables, "--color-card-foreground", [
    colors?.["card-foreground"],
    colors?.foreground,
  ])
  ensureFallback(variables, "--color-border", [colors?.border])
  ensureFallback(variables, "--color-secondary", [
    colors?.secondary,
    colors?.muted,
  ])
  return variables
}

function blockFromVars(selector: string, vars: Record<string, string>): string {
  const lines = Object.entries(vars)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `  ${k}: ${v};`)
  if (!lines.length) return ""
  return `${selector} {\n${lines.join("\n")}\n}`
}

/**
 * Compile merged theme tokens into CSS for storefront.
 * Light → html, :root; dark → html.dark, .dark (next-themes).
 */
export function compileThemeToCss(input: CssCompileInput): CssCompileResult {
  const tokens = mergeThemeTokens(input.tokens, input.overrides)
  const lightColorVars = mapColorRecord(tokens.colors)
  const darkColorVars = mapColorRecord(input.overrides?.colors_dark)

  const shared: Record<string, string> = {}

  const display = resolveFont(tokens, "display")
  const text = resolveFont(tokens, "text")
  const highlight = resolveFont(tokens, "highlight")
  if (display) shared["--font-display"] = quoteFont(display)
  if (text) {
    shared["--font-text"] = quoteFont(text)
    shared["--font-sans"] = quoteFont(text)
  }
  if (highlight) shared["--font-highlight"] = quoteFont(highlight)

  if (tokens.rounded) {
    for (const [k, v] of Object.entries(tokens.rounded)) {
      shared[`--radius-${k}`] = v
    }
  }

  const step: RadiusStep =
    input.overrides?.radius_step !== undefined
      ? input.overrides.radius_step
      : 2
  const defaultRadius = resolveRadiusStep(tokens, step)
  if (defaultRadius) {
    shared["--radius"] = defaultRadius
  }

  if (tokens.spacing) {
    for (const [k, v] of Object.entries(tokens.spacing)) {
      shared[`--spacing-${k}`] = String(v)
    }
  }

  // Default dark palette if merchant has not configured colors_dark yet
  const darkResolved =
    Object.keys(darkColorVars).length > 0
      ? darkColorVars
      : mapColorRecord({
          background: "#0a0a0a",
          foreground: "#fafafa",
          primary: "#fafafa",
          accent: "#38bdf8",
          muted: "#262626",
          "muted-foreground": "#a3a3a3",
          card: "#111111",
          border: "#262626",
          secondary: "#262626",
        })

  const lightRoot = { ...shared, ...lightColorVars }
  // :not(.dark) so light tokens never win over html.dark after next-themes toggles
  const parts = [
    blockFromVars("html:not(.dark), :root:not(.dark), :host:not(.dark)", lightRoot),
    blockFromVars("html.dark, .dark", { ...shared, ...darkResolved }),
  ]

  return { css: parts.filter(Boolean).join("\n\n"), variables: lightRoot }
}

function ensureFallback(
  vars: Record<string, string>,
  key: string,
  candidates: Array<string | undefined>
) {
  if (vars[key]) return
  for (const c of candidates) {
    if (c) {
      vars[key] = c
      return
    }
  }
}

function resolveFont(
  tokens: DesignMdTokens,
  role: keyof typeof TYPOGRAPHY_ROLE_KEYS
): string | undefined {
  const keys = TYPOGRAPHY_ROLE_KEYS[role]
  for (const key of keys) {
    const fam = tokens.typography?.[key]?.fontFamily
    if (fam) return fam
  }
  return undefined
}

function quoteFont(family: string): string {
  const trimmed = family.trim()
  if (trimmed.includes(",") || trimmed.startsWith('"')) return trimmed
  if (/\s/.test(trimmed)) return `"${trimmed}", ui-sans-serif, system-ui, sans-serif`
  return `${trimmed}, ui-sans-serif, system-ui, sans-serif`
}

function resolveRadiusStep(
  tokens: DesignMdTokens,
  step: RadiusStep
): string | undefined {
  const keys = RADIUS_STEP_TO_ROUNDED_KEY[step]
  for (const k of keys) {
    if (tokens.rounded?.[k]) return tokens.rounded[k]
  }
  // numeric fallbacks
  const fallbacks: Record<RadiusStep, string> = {
    0: "0px",
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
  }
  return fallbacks[step]
}

/** Google Fonts link families from typography (unique). */
export function collectGoogleFontFamilies(tokens: DesignMdTokens): string[] {
  const set = new Set<string>()
  if (!tokens.typography) return []
  for (const t of Object.values(tokens.typography)) {
    if (t.fontFamily) {
      // first family only
      const first = t.fontFamily.split(",")[0].replace(/["']/g, "").trim()
      if (first && !isSystemFont(first)) set.add(first)
    }
  }
  return Array.from(set)
}

function isSystemFont(name: string): boolean {
  const n = name.toLowerCase()
  return (
    n.includes("system") ||
    n === "serif" ||
    n === "sans-serif" ||
    n === "monospace" ||
    n === "ui-sans-serif" ||
    n === "ui-serif"
  )
}

export function googleFontsStylesheetUrl(families: string[]): string | null {
  if (!families.length) return null
  // Exclude families that are loaded via custom URL (handled separately)
  const q = families
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, "+")}:wght@400;500;600;700`)
    .join("&")
  return `https://fonts.googleapis.com/css2?${q}&display=swap`
}

function isFontFileUrl(url: string): boolean {
  return /\.(woff2?|ttf|otf)(\?|$)/i.test(url)
}

/**
 * Build @font-face rules for custom font *files* (woff/woff2/ttf/otf).
 * CSS stylesheet URLs are returned for <link> injection instead.
 */
export function buildCustomFontAssets(
  fonts?: {
    display?: string
    text?: string
    highlight?: string
    display_url?: string
    text_url?: string
    highlight_url?: string
  } | null
): { fontFaceCss: string; stylesheetUrls: string[] } {
  if (!fonts) return { fontFaceCss: "", stylesheetUrls: [] }

  const roles: Array<{
    family?: string
    url?: string
  }> = [
    { family: fonts.display, url: fonts.display_url },
    { family: fonts.text, url: fonts.text_url },
    { family: fonts.highlight, url: fonts.highlight_url },
  ]

  const faces: string[] = []
  const sheets = new Set<string>()

  for (const role of roles) {
    const url = role.url?.trim()
    const family = role.family?.trim()
    if (!url) continue

    if (isFontFileUrl(url) && family) {
      const format = url.match(/\.woff2/i)
        ? "woff2"
        : url.match(/\.woff/i)
          ? "woff"
          : url.match(/\.otf/i)
            ? "opentype"
            : "truetype"
      const safeFamily = family.replace(/["']/g, "")
      faces.push(
        `@font-face{font-family:"${safeFamily}";src:url("${url}") format("${format}");font-display:swap;font-weight:100 900;font-style:normal;}`
      )
    } else {
      // Treat as CSS stylesheet (Adobe Fonts, self-hosted CSS, etc.)
      sheets.add(url)
    }
  }

  return {
    fontFaceCss: faces.join("\n"),
    stylesheetUrls: Array.from(sheets),
  }
}

/** Families that should NOT be requested from Google (system or custom-file loaded). */
export function familiesForGoogle(
  families: string[],
  fonts?: {
    display?: string
    text?: string
    highlight?: string
    display_url?: string
    text_url?: string
    highlight_url?: string
  } | null
): string[] {
  const skip = new Set<string>()
  if (fonts?.display_url && fonts.display) skip.add(fonts.display)
  if (fonts?.text_url && fonts.text) skip.add(fonts.text)
  if (fonts?.highlight_url && fonts.highlight) skip.add(fonts.highlight)

  return families.filter((f) => {
    const first = f.split(",")[0].replace(/["']/g, "").trim()
    if (!first || isSystemFont(first)) return false
    if (skip.has(first)) return false
    return true
  })
}
