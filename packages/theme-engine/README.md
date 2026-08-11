# `@bentoco/theme-engine` (BENT-4)

Theme contract for the Dynamic Theme Engine & Store Customizer.

## Phase 0 (current)

- Types: `ThemeConfig`, DESIGN.md tokens, editor overrides  
- CSS variable map for `apps/storefront`  
- First preset: `presets/warm-minimalist/DESIGN.md`  

**Authoring format:** [Google Labs DESIGN.md](https://github.com/google-labs-code/design.md)

See full contract: [`docs/bent-4-theme-engine/PHASE-0-CONTRACT.md`](../../docs/bent-4-theme-engine/PHASE-0-CONTRACT.md)

## Lint a preset

```bash
npx -p @google/design.md designmd lint packages/theme-engine/presets/warm-minimalist/DESIGN.md
```

## Phase 1 (implemented)

Runtime lives in **`packages/bentoco/src/utils/theme-engine`** (compiled with Medusa):

| Endpoint | Role |
|----------|------|
| `GET/POST /admin/store-theme` | Load / install preset / save overrides |
| `GET /store/tenant/theme` | Storefront: compiled CSS + fonts |

Storefront injects CSS via `apps/storefront/components/theme-styles.tsx`.

```bash
# Install Warm Minimalist on default tenant
curl -X POST http://localhost:9000/admin/store-theme \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"install_preset":"warm-minimalist"}'
```

