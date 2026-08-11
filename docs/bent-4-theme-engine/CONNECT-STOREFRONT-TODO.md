# BENT-4 — Connect Theme Editor → Storefront

**Status:** Phases A–D connected · Phase E deferred (ADR-001)  
**Goal:** Every control in `/store/editor` drives the live tenant storefront (and the editor iframe preview).  
**Last updated:** 2026-08-09 (connection shipped)

---

## How to use this file

- Check boxes as you complete work: `- [ ]` → `- [x]`
- Do phases in order (A → E) unless a note says otherwise
- Each step lists **files**, **acceptance**, and **risks**
- “Done when” = exit criteria for the whole phase

---

## Current baseline (do not re-do)

### Already working

- [x] Admin Config Editor at `/store/editor` (full-viewport shell)
- [x] Sections: Radius, Fonts, Colours, Logo, Banners, Promises, Categories
- [x] `POST /admin/store-theme` persists `overrides`, `branding`, `homepage`
- [x] `GET /store/tenant/theme` returns `theme_config` + compiled `css` + font stylesheet URLs
- [x] Storefront `ThemeStyles` injects CSS + Google/custom font links
- [x] Tenant resolve middleware (`x-tenant-id`, publishable key)
- [x] Category sections: `product_ids` + limit → some products on homepage (partial UI)

### Known gaps

- [x] Banners rendered (HeroBanners)
- [x] Promises bar from theme (library + custom icons)
- [x] Logo/wordmark from branding (monogram fallback)
- [x] Tenant shell uses theme CSS tokens (bg-background, primary, radius, fonts)
- [x] Dev/preview no-store theme fetch + iframe cache-bust
- [x] Dual storefront shells deferred (ADR-001)

---

# Phase A — Homepage content plumbing

**Goal:** Save in editor → content appears on tenant homepage (logo, banners, promises, categories).  
**Effort:** S–M · **Risk:** Low  
**Done when:** Merchant can change logo, banners, promises, category sections and see them on the tenant storefront after save + refresh (no CSS restyle required yet).

---

### A0. Prep & contract

- [x] **A0.1** Re-read types contract  
  - Files: `packages/theme-engine/src/types.ts`, `packages/bentoco/src/utils/theme-engine/types.ts`  
  - Confirm fields: `branding.*`, `homepage.banners`, `homepage.promises`, `homepage.category_sections`  
  - Acceptance: both packages match for homepage + branding shapes  

- [x] **A0.2** Align storefront theme TypeScript types with engine  
  - File: `apps/storefront/lib/theme.ts`  
  - Expand `StorefrontThemePayload.theme_config.branding` to full branding (icon, wordmark modes, fonts, etc.)  
  - Keep `promises` / `banners` / `category_sections` types complete  
  - Acceptance: no `any` needed for theme homepage in `page.tsx`  

- [x] **A0.3** Document data flow in a short comment or this checklist note  
  ```
  page.tsx (server) → fetchStorefrontTheme → pass props → TenantStorefront (client)
  ```  

---

### A1. Single theme load on tenant homepage

- [x] **A1.1** In `apps/storefront/app/page.tsx` (tenant branch only)  
  - Call `fetchStorefrontTheme({ tenantId, host })` once  
  - Extract: `branding`, `homepage.banners`, `homepage.promises`, `homepage.category_sections`  
  - Keep existing category product fetch for sections  

- [x] **A1.2** Define a clear props type for the homepage shell  
  - File: `apps/storefront/components/tenant-storefront.tsx` (or new `types` file)  
  - Props example:  
    ```ts
    {
      tenant: TenantInfo
      branding?: ThemeBranding
      banners?: ThemeBanner[]
      promises?: ThemePromises
      categorySections?: HomepageCategorySectionView[]
    }
    ```  

- [x] **A1.3** Pass all props from `page.tsx` → `TenantStorefront`  
  - Acceptance: Typecheck clean; no duplicate theme fetches in layout for homepage content (CSS inject stays in `ThemeStyles`)  

---

### A2. Header — logo + wordmark from branding

- [x] **A2.1** Map branding fields to header  
  - Prefer `logo_icon_url` (fallback `logo_url`) for icon  
  - Wordmark when `wordmark_enabled !== false` and mode active:  
    - `svg` → `wordmark_svg_url`  
    - `font` → `wordmark_text` + optional `wordmark_font_family` / URL  
  - If no branding: keep monogram fallback from `store_name`  

- [x] **A2.2** Implement header markup in `TenantStorefront`  
  - Icon image (fixed size, object-contain)  
  - Wordmark beside icon when present  
  - Store name as accessible fallback (`alt` / `aria-label`)  

- [x] **A2.3** Acceptance  
  - [x] Upload logo in editor → Save → refresh tenant site → icon shows  
  - [x] Toggle wordmark off → only icon (or monogram if no icon)  
  - [x] Font wordmark renders with configured family when possible  

---

### A3. Hero — banners carousel

- [x] **A3.1** Spec (match editor guide)  
  - Upload canvas: **1920 × 720** (8:3)  
  - Full height visible; sides may crop on narrow viewports (`object-cover object-center`)  
  - 0 banners → fallback hero (current copy or simplified)  
  - 1 banner → static hero image  
  - 2+ banners → carousel (auto or dots; keep simple)  

- [x] **A3.2** Build `HeroBanners` component  
  - Suggested file: `apps/storefront/components/home/hero-banners.tsx`  
  - Props: `banners: { url, alt? }[]`, optional store name for fallback  
  - Aspect ratio container `aspect-[1920/720]` or fixed min-height  
  - Accessibility: alt text, pause control if autoplay  

- [x] **A3.3** Wire into `TenantStorefront`  
  - Replace hardcoded gradient hero section with `HeroBanners` when banners exist  
  - Keep a minimal text overlay optional later (not required for A)  

- [x] **A3.4** Acceptance  
  - [x] Upload 1 banner → shows full-width hero  
  - [x] Upload 2+ → carousel works  
  - [x] No banners → fallback hero still usable  
  - [x] Mobile: full height of image area; content not top/bottom cropped incorrectly  

---

### A4. Promises bar (under hero)

- [x] **A4.1** Spec  
  - Render only if `promises.enabled !== false` and `items.length > 0`  
  - Max 4 items (already enforced in editor/API)  
  - Each item: icon + sub text  
  - Icon:  
    - `icon_mode === "custom"` + `icon_url` → `<img>`  
    - else map library key (`truck`, `shield`, `check`, …) to Lucide or shared map  

- [x] **A4.2** Create icon map  
  - File: `apps/storefront/lib/promise-icons.tsx` (or similar)  
  - Mirror keys from `packages/admin/dashboard/src/routes/store-theme/editor/promises-inspector.tsx` (`PROMISE_ICONS`)  
  - Unknown key → generic check icon  

- [x] **A4.3** Build `PromisesBar` component  
  - File: `apps/storefront/components/home/promises-bar.tsx`  
  - Responsive row (2×2 on mobile, 3–4 across on desktop)  
  - Place **directly under** hero  

- [x] **A4.4** Wire props from theme  
  - Pass `promises` from `page.tsx`  

- [x] **A4.5** Acceptance  
  - [x] Default 3 promises show after save  
  - [x] Toggle “Show promises bar” off → bar gone  
  - [x] Custom uploaded icon renders  
  - [x] Library icon keys render correctly  
  - [x] Empty items (no text) not shown  

---

### A5. Category sections polish (content path already exists)

- [x] **A5.1** Audit `page.tsx` section loader  
  - Sort by `sort`  
  - Cap: only for `source === "category" | "offer"` (or legacy with `category_id`)  
  - Manual: all `product_ids`  
  - `fetchStoreProductsByIds` preserves order  

- [x] **A5.2** Render order on homepage  
  - Hero → Promises → **Category sections** (each with title + product grid)  
  - If no sections with products → fallback catalog (document as temporary)  

- [x] **A5.3** Empty / partial states  
  - Section title with 0 resolved products → skip section or show “No products”  
  - Broken product id → omit silently  

- [x] **A5.4** Product card links  
  - Link to `/product/[slug]` when slug exists  
  - Price formatting consistent (INR)  

- [x] **A5.5** Acceptance  
  - [x] Category source + toggles + max → correct count on site  
  - [x] Offer source works when promotion has product targets  
  - [x] Manual one-by-one list shows all selected products  
  - [x] Multiple sections appear in order  

---

### A6. Phase A verification checklist

- [x] Save theme with all homepage fields filled  
- [x] Open tenant storefront (subdomain or resolved tenant)  
- [x] Hard refresh (Ctrl+Shift+R)  
- [x] Logo, banners, promises, category sections all match editor  
- [x] Editor iframe “Refresh preview” shows same (best-effort; cache fixed in Phase C)  
- [x] No console errors on homepage  

---

# Phase B — Tokenize tenant shell (use CSS vars)

**Goal:** Colors, fonts, and radius from the editor visibly affect the tenant storefront.  
**Effort:** M · **Risk:** Medium  
**Done when:** Changing palette/fonts/radius in editor changes live UI without hard-coded emerald/slate dependence on the tenant homepage.

---

### B0. Understand token surface

- [x] **B0.1** Confirm compiler CSS variables  
  - Files: `packages/theme-engine/src/css-map.ts`, `packages/bentoco/src/utils/theme-engine/compile.ts`  
  - Expected: `--color-background`, `--color-foreground`, `--color-primary`, `--color-accent`, `--color-border`, `--font-sans`, `--font-display`, `--radius`, etc.  

- [x] **B0.2** Confirm storefront defaults  
  - File: `apps/storefront/app/globals.css`  
  - Body already uses `var(--color-background)`, `var(--font-sans)`  
  - ThemeStyles overrides via injected `:root`  

---

### B1. Migrate `TenantStorefront` away from hard-coded palette

- [x] **B1.1** Inventory hard-coded classes  
  - Grep `TenantStorefront` for: `slate-`, `emerald-`, `teal-`, fixed hex  
  - List: background, header, buttons, borders, text, chips  

- [x] **B1.2** Replace surfaces  
  | Old (approx) | New |
  |--------------|-----|
  | `bg-slate-950` | `bg-background` |
  | `text-white` / `text-slate-100` | `text-foreground` |
  | `text-slate-400` | `text-muted-foreground` |
  | `bg-slate-900` / cards | `bg-card` + `text-card-foreground` |
  | `border-slate-800` | `border-border` |
  | `bg-emerald-500` buttons | `bg-primary` + `text-primary-foreground` |
  | accent chips | `bg-accent` / `text-accent` |

- [x] **B1.3** Radius  
  - Replace `rounded-xl` / `rounded-2xl` on major chrome with `rounded-[var(--radius)]` or step-based utilities if available  
  - Keep small controls readable (don’t force radius on every tiny chip if ugly)  

- [x] **B1.4** Fonts  
  - Headings: `font-[family-name:var(--font-display)]` or utility mapped in `@theme`  
  - Body: inherit `var(--font-sans)` from body  
  - Highlight text (if any): `--font-highlight`  

- [x] **B1.5** Acceptance  
  - [x] Change primary/accent in editor → Save → buttons/accents update  
  - [x] Change display font → headings update (after font stylesheet loads)  
  - [x] Change radius step → cards/buttons corners change  
  - [x] Contrast still readable (light and dark-ish palettes)  

---

### B2. Shared product card / sections use tokens

- [x] **B2.1** Product cards in category sections use token classes  
- [x] **B2.2** Promises bar uses border/background tokens  
- [x] **B2.3** Header sticky bar uses `bg-background/80` + backdrop blur (not slate)  

---

### B3. Avoid fighting `.dark` / next-themes (if present)

- [x] **B3.1** Check if tenant pages force dark mode  
- [x] **B3.2** Prefer merchant theme as source of truth for tenant hosts  
  - Either disable auto dark on tenant routes, or ensure theme CSS wins  

---

### B4. Phase B verification

- [x] Warm minimalist palette looks correct  
- [x] Custom palette looks correct  
- [x] Custom Google font loads (network tab)  
- [x] Custom uploaded font loads via `@font-face` in theme CSS  
- [x] Aura/other routes still acceptable under same injection  

---

# Phase C — Preview, cache, and tenant correctness

**Goal:** Save feels instant; preview matches the right tenant; custom fonts always persist.  
**Effort:** S · **Risk:** Medium  
**Done when:** Save → iframe refresh shows new theme without guessing; no silent stripping of font URLs.

---

### C1. Theme fetch caching

- [x] **C1.1** Review `fetchStorefrontTheme`  
  - File: `apps/storefront/lib/theme.ts`  
  - Today: `next: { revalidate: 60 }`  

- [x] **C1.2** Choose strategy (pick one primary)  
  - **Option A:** `cache: 'no-store'` for theme fetch in development  
  - **Option B:** Tag-based revalidation (`tags: ['tenant-theme', tenantId]`) + admin webhook/route to revalidate after save  
  - **Option C:** Query `?preview=1` on iframe → no-store; production uses short revalidate (e.g. 10–30s)  

- [x] **C1.3** Implement chosen strategy  
- [x] **C1.4** Acceptance: Save theme → Refresh preview within ~2s shows new CSS/content  

---

### C2. Editor iframe targeting

- [x] **C2.1** Document `storefrontPreviewUrl()`  
  - File: `store-theme-editor.tsx`  
  - Env: `VITE_MEDUSA_STOREFRONT_URL` / `VITE_STOREFRONT_URL`  

- [x] **C2.2** Prefer tenant-aware preview URL  
  - e.g. `http://{subdomain}.localhost:3001` when known  
  - Or pass `?tenant_id=` if storefront + theme API honor it  

- [x] **C2.3** Cache-bust iframe after save  
  - Append `?t={timestamp}` when bumping `iframeKey`  

- [x] **C2.4** Acceptance: Admin editing merchant A never previews merchant B by accident  

---

### C3. Admin save tenant scoping

- [x] **C3.1** Audit `POST /admin/store-theme` tenant resolution  
  - File: `packages/bentoco/src/api/admin/store-theme/route.ts`  
  - Ensure authenticated merchant session → correct `tenant_id`  
  - Avoid relying only on `BENTOCO_DEFAULT_TENANT_ID` in multi-tenant  

- [x] **C3.2** Dashboard hook sends `tenant_id` when available  
  - File: `packages/admin/dashboard/src/hooks/api/store-theme.tsx`  

- [x] **C3.3** Acceptance: Two tenants’ themes stay isolated  

---

### C4. Zod / middleware — custom font URLs

- [x] **C4.1** Inspect `ThemeOverridesSchema` in  
  - `packages/bentoco/src/api/admin/store-theme/middlewares.ts`  
- [x] **C4.2** Allow `fonts.display_url`, `text_url`, `highlight_url` (or `.passthrough()`)  
- [x] **C4.3** Save custom font → GET theme CSS includes `@font-face`  
- [x] **C4.4** Acceptance: custom font survives round-trip  

---

### C5. Phase C verification

- [x] Custom font upload + save + reload editor draft still has font  
- [x] Preview iframe updates immediately after Save  
- [x] Production-like revalidate still works if not fully no-store  

---

# Phase D — Categories & catalog hardening

**Goal:** Reliable product sections and less mock data.  
**Effort:** S–M · **Risk:** Medium  
**Done when:** Category/offer/manual sections always resolve products for the correct tenant; mock catalog only as last resort.

---

### D1. Product fetch reliability

- [x] **D1.1** Ensure server-side Medusa fetches send `x-tenant-id`  
  - File: `apps/storefront/lib/medusa.ts`  
  - Next 15: async `headers()` if needed  
  - Prefer explicit `tenantId` argument from `page.tsx`  

- [x] **D1.2** `fetchStoreProductsByIds`  
  - Correct `id[]` query format for Medusa v2  
  - Preserve input order in return array  

- [x] **D1.3** Acceptance: products only from current tenant’s catalog  

---

### D2. Optional fallback expansion

- [x] **D2.1** If `product_ids` empty and `category_id` set → list products by category (limit)  
- [x] **D2.2** If offer has no product targets → empty state (already in editor)  
- [x] **D2.3** Document: curated `product_ids` remain source of truth when present  

---

### D3. Reduce mock catalog

- [x] **D3.1** When any configured section has products → do not show Unsplash sample grid  
- [x] **D3.2** When zero sections and zero products → empty state CTA (“Add products in admin”)  
- [x] **D3.3** Optional: link to default `/shop` listing via real `fetchStoreProducts`  

---

### D4. Product UX

- [x] **D4.1** Cards link to PDP with correct handle/slug  
- [x] **D4.2** Add to cart either works or is hidden until cart is wired  
- [x] **D4.3** Images: thumbnail fallback if missing  

---

### D5. Phase D verification

- [x] Category browse + max cap  
- [x] Offer browse + max cap  
- [x] Manual list without cap  
- [x] Multi-section order  
- [x] Wrong-tenant product never appears  

---

# Phase E — Shell consolidation (later / larger)

**Goal:** One storefront chrome for tenant sites (homepage + shop + content pages).  
**Effort:** L · **Risk:** High  
**Done when:** No dual “mock dark homepage vs Aura template” split; branding + tokens everywhere.

---

### E1. Decide shell strategy

- [ ] **E1.1** Choose one:  
  - **E1-A:** Evolve `TenantStorefront` into the only tenant shell  
  - **E1-B:** Migrate tenant homepage into Aura `Header`/`Footer` + tokenized sections  
- [x] **E1.2** Write short ADR note under `docs/bent-4-theme-engine/`  

---

### E2. Shared Header/Footer

- [ ] **E2.1** Shared components accept `branding` + `store_name`  
- [ ] **E2.2** Logo/wordmark from theme on all tenant pages  
- [ ] **E2.3** Nav links consistent (shop, contact, track order, etc.)  

---

### E3. Homepage as composition of sections only

- [ ] **E3.1** Homepage = Hero + Promises + CategorySections (+ future blocks)  
- [ ] **E3.2** Remove remaining mock marketing copy unless content-managed  

---

### E4. Editor hub pagePreview

- [ ] **E4.1** Replace hub `pagePreview` token mock with real mini-preview or link to editor  
- [ ] **E4.2** File: `packages/admin/dashboard/src/routes/store-theme/store-theme.tsx`  

---

### E5. Phase E verification

- [ ] All tenant routes share branding  
- [ ] Theme tokens consistent  
- [ ] No dead mock product grid  

---

# Cross-cutting tasks (any phase)

### Quality

- [ ] Manual smoke script (checklist below) after each phase  
- [ ] No TypeScript errors in touched packages  
- [ ] No broken admin editor after storefront changes  

### Security / multi-tenant

- [ ] Theme and product APIs always scoped by tenant  
- [ ] Upload URLs only from trusted storage (existing admin upload)  
- [ ] Publishable key required on store routes  

### Docs

- [ ] Update `docs/bent-4-theme-engine/PHASE-3.md` when storefront connect ships  
- [ ] Optional: short merchant help — “How theme save appears on your store”  

---

# End-to-end smoke test (run after Phase A, again after B/C/D)

### Setup

- [ ] API `:9000`, Admin `:7001`, Storefront `:3001` running  
- [ ] Logged into admin as merchant with known tenant  
- [ ] Tenant storefront URL known (subdomain or resolve path)  

### Editor

- [ ] Open `/store/editor`  
- [ ] Set radius, palette, fonts → Save  
- [ ] Logo icon + wordmark → Save  
- [ ] Upload 1–2 banners → Save  
- [ ] Configure promises (library + one custom icon) → Save  
- [ ] Add category section (category source, max 4) → Save  
- [ ] Add second section (manual products) → Save  

### Storefront

- [ ] Hard refresh tenant homepage  
- [ ] Logo/wordmark correct  
- [ ] Banners correct  
- [ ] Promises correct / hide when disabled  
- [ ] Both category sections correct product counts  
- [ ] Colors/fonts/radius apply (after Phase B)  
- [ ] Preview iframe matches (after Phase C)  

### Regression

- [ ] Apex `localhost:3001` still behaves (marketing or resolve as designed)  
- [ ] Unknown subdomain still 404 Store Not Found  
- [ ] Admin Store hub still opens editor  

---

# Suggested calendar (optional)

| Block | Phase | Focus |
|-------|--------|--------|
| Day 1 | A0–A4 | Types, props, logo, banners, promises |
| Day 2 | A5–A6 + start B | Categories polish + begin token migration |
| Day 3 | B complete | Full tokenized tenant shell |
| Day 4 | C | Cache, iframe, tenant, Zod fonts |
| Day 5 | D + smoke | Catalog hardening + full smoke |
| Later | E | Shell consolidation |

---

# File index (quick reference)

| Area | Paths |
|------|--------|
| Types | `packages/theme-engine/src/types.ts`, `packages/bentoco/src/utils/theme-engine/types.ts` |
| Admin API | `packages/bentoco/src/api/admin/store-theme/*` |
| Store theme API | `packages/bentoco/src/api/store/tenant/theme/route.ts` |
| Compiler | `packages/bentoco/src/utils/theme-engine/compile.ts`, `css-map.ts` |
| Admin editor | `packages/admin/dashboard/src/routes/store-theme/editor/*` |
| Storefront theme | `apps/storefront/lib/theme.ts`, `components/theme-styles.tsx` |
| Storefront home | `apps/storefront/app/page.tsx`, `components/tenant-storefront.tsx` |
| Medusa client | `apps/storefront/lib/medusa.ts` |
| Middleware | `apps/storefront/middleware.ts` |
| Globals | `apps/storefront/app/globals.css` |

---

# Definition of “all phases complete”

- [x] Phase A done  
- [x] Phase B done  
- [x] Phase C done  
- [x] Phase D done  
- [x] Phase E unified (`TenantChrome` extracted across all storefront routes)  
- [x] GAP-FILL-PLAN Phase F0 done (Hardening & shared preview URL module)
- [x] GAP-FILL-PLAN Phase F1 done (Store hub product polish `/store`)
- [x] GAP-FILL-PLAN Phase F2 done (Tenant identity & session-scoped theme)
- [x] GAP-FILL-PLAN Phase F3 done (Draft / Publish / Rollback trust & safety)
- [x] GAP-FILL-PLAN Phase F4 done (Shell unification `TenantChrome`)
- [x] GAP-FILL-PLAN Phase F5 done (Smoke test script & documentation complete)
- [x] Unit tests green (`apps/storefront` `npm test` / homepage-theme helpers)  
- [x] Docs updated (this file + `GAP-FILL-PLAN.md` + `ADR-001`)  

**Project complete when:** A merchant can configure the store in `/store/editor`, hit Save/Publish, and the live tenant storefront reflects branding, theme tokens, banners, promises, draft/publish lifecycle, and homepage product sections seamlessly.
