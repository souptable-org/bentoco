import {
  compileThemeToCss,
  collectGoogleFontFamilies,
  googleFontsStylesheetUrl,
  buildCustomFontAssets,
  familiesForGoogle,
} from "./compile"
import { parseDesignMd } from "./parse"
import type {
  ThemeBranding,
  ThemeConfig,
  ThemeHomepage,
  ThemeOverrides,
} from "./types"

export type BuildThemeConfigInput = {
  themeId: string
  designMd: string
  layoutId?: "default"
  overrides?: ThemeOverrides
  branding?: ThemeBranding
  homepage?: ThemeHomepage
}

export type BuiltTheme = {
  config: ThemeConfig
  css: string
  font_stylesheet_url: string | null
  /** Extra stylesheets (custom CSS font kits, etc.) */
  font_stylesheet_urls: string[]
  variables: Record<string, string>
}

/**
 * Full pipeline: DESIGN.md → ThemeConfig + compiled CSS.
 */
export function buildThemeConfig(input: BuildThemeConfigInput): BuiltTheme {
  const { tokens } = parseDesignMd(input.designMd)
  const { css: varsCss, variables } = compileThemeToCss({
    tokens,
    overrides: input.overrides,
  })

  const fontFamilies = new Set(collectGoogleFontFamilies(tokens))
  if (input.overrides?.fonts?.display)
    fontFamilies.add(input.overrides.fonts.display)
  if (input.overrides?.fonts?.text) fontFamilies.add(input.overrides.fonts.text)
  if (input.overrides?.fonts?.highlight)
    fontFamilies.add(input.overrides.fonts.highlight)

  const googleFamilies = familiesForGoogle(
    Array.from(fontFamilies),
    input.overrides?.fonts
  )
  const custom = buildCustomFontAssets(input.overrides?.fonts)

  // Wordmark custom font file (branding)
  const wordmarkFontCss =
    input.branding?.wordmark_font_url &&
    input.branding?.wordmark_font_family &&
    /\.(woff2?|ttf|otf)(\?|$)/i.test(input.branding.wordmark_font_url)
      ? (() => {
          const url = input.branding!.wordmark_font_url!
          const family = input.branding!.wordmark_font_family!.replace(
            /["']/g,
            ""
          )
          const format = url.match(/\.woff2/i)
            ? "woff2"
            : url.match(/\.woff/i)
              ? "woff"
              : url.match(/\.otf/i)
                ? "opentype"
                : "truetype"
          return `@font-face{font-family:"${family}";src:url("${url}") format("${format}");font-display:swap;font-weight:100 900;font-style:normal;}`
        })()
      : ""

  const css = [custom.fontFaceCss, wordmarkFontCss, varsCss]
    .filter(Boolean)
    .join("\n\n")

  const config: ThemeConfig = {
    schema_version: 1,
    active_theme_id: input.themeId,
    layout_id: input.layoutId || "default",
    design_md: input.designMd,
    tokens,
    overrides: input.overrides,
    branding: input.branding,
    homepage: input.homepage,
    published_at: new Date().toISOString(),
  }

  return {
    config,
    css,
    font_stylesheet_url: googleFontsStylesheetUrl(googleFamilies),
    font_stylesheet_urls: custom.stylesheetUrls,
    variables,
  }
}
