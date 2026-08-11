import { compileThemeToCss, collectGoogleFontFamilies, googleFontsStylesheetUrl } from "./compile"
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
  variables: Record<string, string>
}

/**
 * Full pipeline: DESIGN.md → ThemeConfig + compiled CSS.
 */
export function buildThemeConfig(input: BuildThemeConfigInput): BuiltTheme {
  const { tokens } = parseDesignMd(input.designMd)
  const { css, variables } = compileThemeToCss({
    tokens,
    overrides: input.overrides,
  })
  const fonts = collectGoogleFontFamilies(
    input.overrides?.fonts
      ? {
          ...tokens,
          typography: {
            ...(tokens.typography || {}),
          },
        }
      : tokens
  )
  // Re-collect after merge is already inside compile; use variables for font families
  const fontFamilies = new Set(fonts)
  if (input.overrides?.fonts?.display)
    fontFamilies.add(input.overrides.fonts.display)
  if (input.overrides?.fonts?.text) fontFamilies.add(input.overrides.fonts.text)
  if (input.overrides?.fonts?.highlight)
    fontFamilies.add(input.overrides.fonts.highlight)

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
    font_stylesheet_url: googleFontsStylesheetUrl(Array.from(fontFamilies)),
    variables,
  }
}
