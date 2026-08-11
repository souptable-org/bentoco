# BENT-4 Phase 1 — Theme engine (backend + inject)

## What shipped

1. **Compiler pipeline** (`packages/bentoco/src/utils/theme-engine`)
   - `parseDesignMd` — Google DESIGN.md YAML front matter
   - `mergeThemeTokens` — editor overrides
   - `compileThemeToCss` — CSS custom properties for storefront
   - `buildThemeConfig` / `buildPresetTheme` — full ThemeConfig

2. **Persistence**
   - `tenant.theme_config` JSONB (migration `stage-7-theme-config.sql`, also auto-ADD COLUMN)
   - Default preset: Warm Minimalist

3. **APIs**
   - `GET /admin/store-theme?tenant_id=`
   - `POST /admin/store-theme` — `install_preset`, `overrides`, `design_md`, branding/homepage
   - `GET /store/tenant/theme?domain=` or `?tenant_id=` — public CSS payload

4. **Storefront**
   - `ThemeStyles` in root layout loads theme and injects `<style>` + Google Fonts

## Verify

```bash
# Public theme CSS
curl "http://localhost:9000/store/tenant/theme?domain=localhost:3001" \
  -H "x-publishable-api-key: $PK"

# Install preset (admin auth required)
curl -X POST http://localhost:9000/admin/store-theme \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"install_preset":"warm-minimalist","overrides":{"radius_step":3}}'
```

Open storefront — page background/accent should match Warm Minimalist limestone + clay.

## Not in Phase 1

- Settings hub UI / Theme Config Editor screens  
- Import library UX  
- Multiple layouts  
