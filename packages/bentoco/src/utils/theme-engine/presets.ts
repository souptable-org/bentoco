import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { buildThemeConfig, type BuiltTheme } from "./build-theme-config"
import type { ThemeOverrides, ThemeBranding, ThemeHomepage } from "./types"
import { WARM_MINIMALIST_DESIGN_MD } from "./presets/warm-minimalist-source"

export const WARM_MINIMALIST_ID = "warm-minimalist"

const PRESET_FILES: Record<string, string> = {
  [WARM_MINIMALIST_ID]: "warm-minimalist.DESIGN.md",
}

const EMBEDDED: Record<string, string> = {
  [WARM_MINIMALIST_ID]: WARM_MINIMALIST_DESIGN_MD,
}

/**
 * Load a builtin preset DESIGN.md source.
 * Tries disk paths first, then embedded fallback (works from dist).
 */
export function loadPresetDesignMd(themeId: string = WARM_MINIMALIST_ID): string {
  const file = PRESET_FILES[themeId]
  if (!file && !EMBEDDED[themeId]) {
    throw new Error(`Unknown preset theme id: ${themeId}`)
  }

  if (file) {
    const candidates = [
      join(__dirname, "presets", file),
      join(process.cwd(), "packages/bentoco/src/utils/theme-engine/presets", file),
      join(process.cwd(), "packages/theme-engine/presets/warm-minimalist/DESIGN.md"),
    ]

    for (const p of candidates) {
      if (existsSync(p)) {
        return readFileSync(p, "utf8")
      }
    }
  }

  if (EMBEDDED[themeId]) {
    return EMBEDDED[themeId]
  }

  throw new Error(`Could not load preset DESIGN.md for "${themeId}"`)
}

export function listBuiltinPresets(): Array<{ id: string; name: string }> {
  return [
    {
      id: WARM_MINIMALIST_ID,
      name: "Warm Minimalist",
    },
  ]
}

export function buildPresetTheme(
  themeId: string = WARM_MINIMALIST_ID,
  opts?: {
    overrides?: ThemeOverrides
    branding?: ThemeBranding
    homepage?: ThemeHomepage
  }
): BuiltTheme {
  const designMd = loadPresetDesignMd(themeId)
  return buildThemeConfig({
    themeId,
    designMd,
    layoutId: "default",
    overrides: opts?.overrides,
    branding: opts?.branding,
    homepage: opts?.homepage,
  })
}
