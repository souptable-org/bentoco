# BENT-4 Phase 3 — Theme Config Editor

## Layout

Full-viewport shell at **`/store/editor`** (no MainLayout / generic admin sidebar).

```
[ top bar: back | title | Save ]
[ section nav | inspector | storefront iframe ]
```

## Sections

1. Corner radius (5 steps)
2. Fonts (display / text / highlight)
3. Colours (presets + full custom palette)
4. Logo (icon URL + wordmark)
5. Banners (PNG URLs → carousel if &gt;1)
6. Custom homepage categories

## Save

`POST /admin/store-theme` with `overrides`, `branding`, `homepage`.

## Preview

Iframe loads `VITE_MEDUSA_STOREFRONT_URL` or `http://localhost:3001`. Refresh after save reloads iframe.
