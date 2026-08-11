/**
 * BENT-4 Phase 0 — DESIGN.md token → storefront CSS custom property map.
 *
 * Phase 1 implements the compiler that walks tokens + overrides and emits
 * a `:root { ... }` block. This file freezes the mapping table.
 *
 * Storefront shell: apps/storefront/app/globals.css
 */

import type { DesignMdTokens, RadiusStep, ThemeOverrides } from "./types"

/** Preferred color token names → CSS variables used by the storefront shell. */
export const COLOR_TOKEN_TO_CSS: Record<string, string> = {
  // Semantic (preferred when present on DESIGN.md)
  background: "--color-background",
  foreground: "--color-foreground",
  card: "--color-card",
  "card-foreground": "--color-card-foreground",
  popover: "--color-popover",
  "popover-foreground": "--color-popover-foreground",
  primary: "--color-primary",
  "on-primary": "--color-primary-foreground",
  "primary-foreground": "--color-primary-foreground",
  secondary: "--color-secondary",
  "on-secondary": "--color-secondary-foreground",
  "secondary-foreground": "--color-secondary-foreground",
  muted: "--color-muted",
  "muted-foreground": "--color-muted-foreground",
  accent: "--color-accent",
  "on-accent": "--color-accent-foreground",
  "accent-foreground": "--color-accent-foreground",
  destructive: "--color-destructive",
  error: "--color-destructive",
  border: "--color-border",
  input: "--color-input",
  ring: "--color-ring",
  // Common Google DESIGN.md palette names (fallback aliases)
  neutral: "--color-background",
  surface: "--color-card",
  "on-surface": "--color-card-foreground",
  tertiary: "--color-accent",
}

/**
 * Typography role resolution order for Config Editor fonts.
 * First key found in DESIGN.md typography wins for that role.
 */
export const TYPOGRAPHY_ROLE_KEYS = {
  display: ["display", "h1", "headline-display", "headline-lg"] as const,
  text: ["body", "body-md", "body-lg", "body-sm"] as const,
  highlight: ["highlight", "label-md", "label-caps", "label-lg"] as const,
}

export const FONT_ROLE_TO_CSS = {
  display: "--font-display",
  text: "--font-text",
  /** Also alias body stack used by the shell */
  textSans: "--font-sans",
  highlight: "--font-highlight",
} as const

/** Radius scale keys on DESIGN.md `rounded` for each editor step 0–4. */
export const RADIUS_STEP_TO_ROUNDED_KEY: Record<RadiusStep, string[]> = {
  0: ["none", "0"],
  1: ["sm", "xs"],
  2: ["md"],
  3: ["lg"],
  4: ["xl", "2xl", "full"],
}

export const RADIUS_CSS_VARS = {
  default: "--radius",
  sm: "--radius-sm",
  md: "--radius-md",
  lg: "--radius-lg",
  full: "--radius-full",
} as const

/**
 * Documents how merged tokens (base + overrides) become CSS.
 * Implementation lands in Phase 1 (`compileThemeToCss`).
 */
export type CssCompileInput = {
  tokens: DesignMdTokens
  overrides?: ThemeOverrides
}

export type CssCompileResult = {
  /** Full `:root { ... }` or plain custom-property block */
  css: string
  /** Flat map of var name → value for debugging / preview */
  variables: Record<string, string>
}
