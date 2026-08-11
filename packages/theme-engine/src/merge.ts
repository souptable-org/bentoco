import type { DesignMdTokens, ThemeOverrides } from "./types"
import { TYPOGRAPHY_ROLE_KEYS } from "./css-map"

/**
 * Merge editor overrides onto base DESIGN.md tokens.
 * Overrides win. Does not mutate inputs.
 */
export function mergeThemeTokens(
  base: DesignMdTokens,
  overrides?: ThemeOverrides
): DesignMdTokens {
  if (!overrides) {
    return structuredClone(base)
  }

  const merged: DesignMdTokens = structuredClone(base)
  merged.colors = { ...(base.colors || {}) }

  if (overrides.colors) {
    for (const [k, v] of Object.entries(overrides.colors)) {
      if (v) merged.colors[k] = v
    }
  }

  if (overrides.fonts) {
    merged.typography = { ...(base.typography || {}) }
    applyFontRole(merged, "display", overrides.fonts.display)
    applyFontRole(merged, "text", overrides.fonts.text)
    applyFontRole(merged, "highlight", overrides.fonts.highlight)
  }

  // radius_step is applied at compile time against rounded scale
  return merged
}

function applyFontRole(
  tokens: DesignMdTokens,
  role: keyof typeof TYPOGRAPHY_ROLE_KEYS,
  fontFamily?: string
) {
  if (!fontFamily || !tokens.typography) return
  const keys = TYPOGRAPHY_ROLE_KEYS[role]
  let applied = false
  for (const key of keys) {
    if (tokens.typography[key]) {
      tokens.typography[key] = {
        ...tokens.typography[key],
        fontFamily,
      }
      applied = true
    }
  }
  if (!applied) {
    // Create the primary role key so compile still finds a family
    const primary = keys[0]
    tokens.typography[primary] = { fontFamily }
  }
}
