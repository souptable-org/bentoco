# BENT-4 Phase 2 — Store & Theme Settings hub

## What shipped

Merchant admin UI for theme gallery + management (Notion wireframe).

### Routes

| Path | Screen |
|------|--------|
| `/store` | Store theme hub (main sidebar) |
| `/store/editor` | EDITOR entry (Phase 3 stub) |

Nav: **Main sidebar → Store → Theme** (not under Settings).

### Hub features

**Active theme panel**
- Token preview (pagePreview) using compiled CSS vars
- Active theme name / id / layout
- **EDITOR** → `/store/editor`
- Download active DESIGN.md

**Library**
- **Themes** tab — builtin presets + active import; Install / Download / Remove
- **Import** tab — paste or upload DESIGN.md → install as active

### API (Phase 1)

- `GET /admin/store-theme`
- `POST /admin/store-theme` (`install_preset`, `design_md`, overrides)

### Files

- `packages/admin/dashboard/src/routes/store-theme/`
- `packages/admin/dashboard/src/hooks/api/store-theme.tsx`
- Main sidebar **Store** + route map under `MainLayout`

## Phase 3 (next)

Full Theme Config Editor: sidebar / inspector / iframe, writing overrides via the same POST API.
