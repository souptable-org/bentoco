# BENT-4 Phase 0 — Theme Contract

**Status:** locked for implementation  
**Date:** 2026-08-09  
**Feature:** Dynamic Theme Engine & Store Customizer (Store & Theme Settings)

---

## 1. Decision: source format

We adopt **Google Labs DESIGN.md** as the theme authoring format.

| Source | URL |
|--------|-----|
| Spec (canonical) | https://github.com/google-labs-code/design.md |
| Spec file | https://github.com/google-labs-code/design.md/blob/main/docs/spec.md |
| CLI | `npx @google/design.md` / `npx -p @google/design.md designmd` |
| Examples / community packs | https://github.com/voltagent/awesome-design-md |

### Why this, not a home-grown YAML

- **Machine + human:** YAML front matter (normative tokens) + markdown prose (rationale).
- **Interop:** export to Tailwind v4 `@theme` CSS, DTCG `tokens.json`, Tailwind v3 JSON.
- **Tooling:** official lint / diff / export CLI.
- **Matches product language:** roadmap “YAML-to-CSS DESIGN.md compiler” is this format.

### Explicit non-goals for Phase 0

- Free-form page / section builder  
- Multiple layout templates (v1 = **one** premade storefront layout)  
- Using Bentoco **marketing** brand DESIGN.md as a merchant theme (marketing stays in `apps/marketing`)

---

## 2. Product model (one feature, two views)

```
Store & Theme Settings (hub)
  ├─ Active theme preview + name
  ├─ Library: install / download / remove / import DESIGN.md
  └─ [EDITOR] → Theme Config Editor
                  tweak tokens + branding on the active theme
                  (same engine; not a second product)
```

- **Themes** = pre-authored `DESIGN.md` packs applied to a fixed layout.  
- **EDITOR** = surface-level value tweaks within that theme’s token system.  
- **Layout** = single premade template for v1; more templates later.

---

## 3. File anatomy (DESIGN.md)

Per [Google DESIGN.md alpha](https://github.com/google-labs-code/design.md):

1. **YAML front matter** (between `---` fences) — normative tokens  
2. **Markdown body** — sections in order: Overview → Colors → Typography → Layout → Elevation → Shapes → Components → Do's and Don'ts  

### Token groups we use in v1

| YAML group | Role for storefront |
|------------|---------------------|
| `name` | Theme display name |
| `version` | Spec version (`alpha`) + optional pack semver in description |
| `colors` | Semantic + palette colors → CSS `--color-*` |
| `typography` | Roles, especially display / body / highlight → fonts + type scale |
| `rounded` | Corner scale → radius tokens (editor maps 5 presets onto this scale) |
| `spacing` | Optional rhythm tokens |
| `components` | Optional component-level refs (future polish) |

### Bentoco extensions (not in Google core; stored beside DESIGN.md)

Merchant overrides and content that the Config Editor exposes, stored in `theme_config` JSON on the tenant (not forced into DESIGN.md prose):

| Extension | Editor section |
|-----------|----------------|
| `branding.logo_url` / `wordmark` | Logo |
| `homepage.banners[]` | Banners |
| `homepage.category_sections[]` | Custom categories |
| `overrides` | Partial token overrides (colors, fonts, radius step) after install |

Base theme pack remains a pure DESIGN.md. Overrides merge at apply time: **overrides win**.

---

## 4. Runtime model (`theme_config`)

Persisted per tenant (column already selected on tenant resolve: `theme_config`).

```ts
// packages/theme-engine/src/types.ts — source of truth
ThemeConfig = {
  schema_version: 1
  active_theme_id: string
  layout_id: "default"           // only layout in v1
  design_md: string              // full DESIGN.md source of active base theme
  tokens: DesignMdTokens         // parsed YAML front matter (compiled)
  overrides?: ThemeOverrides     // editor tweaks
  branding?: ThemeBranding
  homepage?: ThemeHomepage
  published_at?: string
}
```

**Apply pipeline (Phase 1):**

```
DESIGN.md (base) → parse YAML → tokens
                 + overrides (editor)
                 → CSS custom properties
                 → inject into storefront :root
```

Storefront layout components only read CSS vars / branding slots — they do not hardcode Bentoco marketing tokens.

---

## 5. CSS variable map (storefront)

Maps DESIGN.md tokens → variables already expected by `apps/storefront` shell.

| DESIGN.md / override | CSS custom property |
|----------------------|---------------------|
| `colors.background` or `colors.neutral` | `--color-background` |
| `colors.foreground` or `colors.primary` (ink) | `--color-foreground` |
| `colors.primary` (brand/CTA when semantic) | `--color-primary` |
| `colors.on-primary` / inverse | `--color-primary-foreground` |
| `colors.secondary` | `--color-secondary` |
| `colors.muted` / `colors.secondary` soft | `--color-muted` / `--color-muted-foreground` |
| `colors.accent` / `colors.tertiary` | `--color-accent` |
| `colors.border` | `--color-border` |
| `colors.card` / surface | `--color-card` |
| `colors.destructive` / `colors.error` | `--color-destructive` |
| `typography.display` / `h1` fontFamily | `--font-display` (and headline roles) |
| `typography.body` / `body-md` fontFamily | `--font-sans` / `--font-text` |
| `typography.highlight` / `label-*` fontFamily | `--font-highlight` |
| `rounded.sm`…`rounded.lg` | `--radius-sm` … `--radius-lg` |
| editor radius step `0..4` | picks from `rounded` scale → `--radius` default |

Exact merge rules live in `packages/theme-engine/src/css-map.ts` (Phase 1 implements; Phase 0 defines the table).

### Editor radius presets (5 levels)

| Step | Intent | Typical token |
|------|--------|---------------|
| 0 | Sharp | `rounded.none` / `0px` |
| 1 | Subtle | `rounded.sm` |
| 2 | Default | `rounded.md` |
| 3 | Soft | `rounded.lg` |
| 4 | Pill / bubbly | `rounded.xl` or `full` for controls |

---

## 6. Typography roles (Config Editor)

| Editor label | DESIGN.md typography keys (preferred) |
|--------------|----------------------------------------|
| Display font | `display`, `h1`, `headline-display` |
| Text font | `body`, `body-md`, `body-lg` |
| Highlighting font | `highlight`, `label-md`, `label-caps` |

Compiler resolves first match in that order.

---

## 7. v1 layout

| Field | Value |
|-------|--------|
| `layout_id` | `"default"` |
| Templates | Single shared storefront shell (home, shop, PDP, cart, checkout) |
| Later | Additional `layout_id`s; same token contract |

---

## 8. Library actions (hub) — data ops only

| Action | Effect |
|--------|--------|
| Install | Set theme as active; recompile tokens into `theme_config` |
| Download | Export active/base `DESIGN.md` |
| Remove | Drop from merchant library (not platform catalog) |
| Import | Upload DESIGN.md (or bundle); lint; add to library |
| EDITOR | Open Config Editor against active theme + overrides |

---

## 9. Phase 0 deliverables (this folder + package)

| Path | Purpose |
|------|---------|
| `docs/bent-4-theme-engine/PHASE-0-CONTRACT.md` | This document |
| `packages/theme-engine/src/types.ts` | `ThemeConfig`, tokens, overrides |
| `packages/theme-engine/src/css-map.ts` | Token → CSS var mapping table (types + comments) |
| `packages/theme-engine/presets/warm-minimalist/DESIGN.md` | First Google-format preset for storefront |
| `packages/theme-engine/README.md` | Package overview |

### Out of Phase 0 → done in Phase 1

See `docs/bent-4-theme-engine/PHASE-1.md` for parse/compile/APIs/storefront inject.

Still later (Phase 2–3): Settings hub UI + Config Editor screens.

---

## 10. Relation to existing Bentoco DESIGN.md

`desgineTocken/Bentoco — DESIGN.md` and marketing tokens describe **Bentoco brand / marketing site**. They are **not** merchant storefront themes.

Merchant themes use **Google DESIGN.md front matter** under `packages/theme-engine/presets/*` and tenant `theme_config`.

---

## 11. Lint (optional local check)

```bash
npx -p @google/design.md designmd lint packages/theme-engine/presets/warm-minimalist/DESIGN.md
```

Use this in CI later when Phase 1 lands the compiler.
