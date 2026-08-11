# Plan: Fill Theme ↔ Storefront Gaps (Post A–D)

**Date:** 2026-08-11  
**Status:** Proposed  
**Context:** Phases A–D of CONNECT-STOREFRONT are shipped. Phase E (shell unification) is deferred (ADR-001). Admin `/store` now embeds a live iframe; editor at `/store/editor` is the full Config Editor.

**Goal:** Close product, engineering, and trust gaps so the theme system is **merchant-safe**, **ops-stable**, and **one continuous storefront UX** — without re-litigating A–D.

**Non-goals (this plan):**
- New homepage block types beyond current banners/promises/categories
- Marketing site redesign (`apps/marketing`)
- Multi-layout (`layout_id` other than `default`)
- Agency product rebuild

---

## Gap inventory (from current reality)

| # | Gap | Severity | Why it hurts |
|---|-----|----------|--------------|
| G1 | Shared preview URL logic duplicated | Low–Med | Drift between hub and editor |
| G2 | `/store` hub UX unclear (tall/short iframe + library) | Med | Merchants don't know "live store" vs "edit" |
| G3 | Ops fragility (env defaults, `dist` Zod lag, default tenant) | High | "It works on my machine"; silent wrong tenant |
| G4 | Session tenant ≠ env default tenant | High | Agency / multi-store edits wrong `theme_config` |
| G5 | Save is live with no draft/publish/rollback | High | Bad save = instant customer impact |
| G6 | Dual storefront shells (ADR-001) | Med–High | Shop/PDP/checkout chrome ≠ themed homepage |
| G7 | Preview trust (iframe vs customer URL, dirty state) | Med | Operators unsure what customers see |
| G8 | Automated smoke / CI coverage thin | Med | Regressions only found manually |
| G9 | Docs lag (PHASE-3, merchant help) | Low | Onboarding friction |
| G10 | Dual theme-engine trees (`packages/theme-engine` vs `packages/bentoco/.../theme-engine`) | Med | Type/logic drift; only bentoco tree is runtime |
| G11 | Storefront URL defaults diverge (`:3001` preview vs `__STOREFRONT_URL__` → `:8000` in admin-bundler / `lib/storefront.ts`) | Med | Wrong host in links vs iframe |

**Already partially done:**
- E4 hub `pagePreview` → live iframe (compact height) — **done**, polish remains in G2
- A–D content + tokens + cache-bust — **done**
- Admin store-theme Zod src/dist currently aligned (fonts `*_url`); trap remains if rebuild is skipped

---

## Target architecture (end state)

```text
┌──────────────────────────────────────────────────────────────────┐
│ Admin :7001                                                      │
│  /store          → Store hub: compact live preview + library     │
│  /store/editor   → Config Editor (device frames, path, dirty)    │
│  shared          → storefrontPreviewUrl() + useStorefrontPreview │
└────────────────────────────┬─────────────────────────────────────┘
                             │ GET/POST /admin/store-theme
                             │ tenant_id from auth session (not only env)
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ API :9000  packages/bentoco                                      │
│  theme_config: { draft?, published, published_at, history[]? }   │
│  compile src middlewares always = what runtime loads             │
└────────────────────────────┬─────────────────────────────────────┘
                             │ GET /store/tenant/theme (published)
                             │ GET …?preview=1 may serve draft
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│ Storefront :3001                                                 │
│  One TenantChrome (Header/Footer) on all tenant routes           │
│  Homepage sections + shop/PDP/cart use same tokens + branding    │
└──────────────────────────────────────────────────────────────────┘
```

---

## Phase map (recommended order)

| Phase | Name | Effort | Risk | Depends on |
|-------|------|--------|------|------------|
| **F0** | Hardening & shared preview | S | Low | — |
| **F1** | Store hub product polish | S | Low | F0 |
| **F2** | Tenant identity (session-scoped theme) | M | Med | F0 |
| **F3** | Draft / publish / rollback | M–L | Med | F2 |
| **F4** | Shell unification (Phase E, E1-A) | L | High | F0–F1; ideally after F3 |
| **F5** | Trust, smoke, docs | S–M | Low | F3–F4 as available |

Ship F0→F2 first (stability). F3 before broad merchant use. F4 when continuous chrome matters more than new editor knobs.

---

# Phase F0 — Hardening & shared preview

**Goal:** One preview helper; build pipeline can't strip theme validation; env documented.  
**Done when:** Hub and editor import the same URL builder; `POST /admin/store-theme` accepts full branding/fonts without hand-patching `dist`.

### F0.1 Shared preview module (admin)

- **Create** `packages/admin/dashboard/src/lib/storefront-preview.ts`
  - `normalizePreviewPath(raw: string): string`
  - `storefrontPreviewUrl({ path, tenantId, cacheBust, draft? })`
  - `getStorefrontBaseUrl()` from `VITE_MEDUSA_STOREFRONT_URL` | `VITE_STOREFRONT_URL` | `http://localhost:3001`
- **Refactor**
  - `routes/store-theme/editor/store-theme-editor.tsx` — delete local helpers; import shared
  - `routes/store-theme/store-theme.tsx` — delete local helpers; import shared
- **Acceptance:** Grep shows single definition; both UIs load same tenant homepage URL shape  
  `?preview=1&tenant_id=…&t=…`

### F0.2 Optional hook

- **Create** `packages/admin/dashboard/src/hooks/use-storefront-preview.ts`
  - State: `iframeKey`, `path`, `device`, `refresh()`, `setPath()`
  - Used by editor fully; hub uses subset (homepage only + refresh)
- **Acceptance:** Editor behavior unchanged; less duplicated state later

### F0.3 Middleware / dist integrity

- **Problem:** Runtime loads compiled `packages/bentoco/dist/...`; hand-edited or stale `dist` stripped Zod fields and broke saves.
- **Actions:**
  1. Confirm `yarn workspace` / package build copies **src** `middlewares.ts` → dist on every API start path used in docs
  2. Add a **unit or smoke test** that Zod `PostBody` accepts a fixture with `colors_dark`, font URLs, full branding, promises custom icons
  3. Document in `packages/bentoco` or CONNECT todo: never edit `dist` by hand
  4. Optional: CI step `yarn workspace @bentoco/medusa build` (or bentoco package) on PRs that touch `store-theme`
- **Files:** `packages/bentoco/src/api/admin/store-theme/middlewares.ts`, build scripts, new test under package or `scripts/smoke-theme-*.ts`
- **Acceptance:** Clean install + build + POST save of full editor payload succeeds without dist surgery

### F0.4 Env contract sheet

| Consumer | Variable | Default |
|----------|----------|---------|
| Admin preview iframe | `VITE_MEDUSA_STOREFRONT_URL` or `VITE_STOREFRONT_URL` | `http://localhost:3001` |
| Admin other storefront links | `__STOREFRONT_URL__` / `lib/storefront.ts` | **must match** preview base (today wrongly defaults to `:8000`) |
| Storefront → API | `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | `http://localhost:9000` |
| Storefront | `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | (required for store APIs) |
| Storefront public URL | `APP_URL` | `http://localhost:3001` (document; wire if useful) |
| API theme fallback | `BENTOCO_DEFAULT_TENANT_ID` (alias `RAZORPAY_DEFAULT_TENANT_ID`) | demo tenant only (dev) |

- **Actions:**
  1. Align `.env.example` in admin + storefront
  2. Make `getStorefrontBaseUrl()` the **single** admin source; refactor `lib/storefront.ts` + bundler define to same default (`:3001` in dev)
  3. Prefer renaming fallback to `BENTOCO_DEFAULT_TENANT_ID` with alias for old name
- **Acceptance:** New dev can start three processes from examples alone; payment/store links and theme iframe hit the same host

### F0.6 Theme-engine single source (lightweight)

- **Problem:** Contract package `packages/theme-engine` is not what Medusa imports; runtime is mirrored under `packages/bentoco/src/utils/theme-engine`.
- **Actions (pick one for this phase — prefer A):**
  - **A (cheap):** Add a CI/script check that key type files stay in sync, or document “edit bentoco tree first, mirror types”
  - **B (better, later):** Bentoco runtime imports `@bentoco/theme-engine` for types + compile so one tree owns the contract
- **Acceptance:** No silent drift on `ThemeConfig` / overrides fields used by editor + APIs

### F0.5 Preview health indicator (minimal)

- On hub + editor: if iframe fails to load base URL (optional fetch `/` or `onError` banner), show "Storefront not reachable at {url}"
- **Acceptance:** Stopping `:3001` shows clear banner instead of blank frame

---

# Phase F1 — Store hub product polish (`/store`)

**Goal:** Hub = "your live store at a glance + theme library," not a second full editor.

### F1.1 Layout contract

```text
┌─────────────────────────────────────────────┐
│ Live store                    [Open live ↗] │
│ ┌─────────────────┐  theme: Name            │
│ │ iframe ~280–360 │  [Refresh] [EDITOR]     │
│ │ px fixed height │  last saved / published │
│ └─────────────────┘                         │
├─────────────────────────────────────────────┤
│ Themes library          [Themes] [import]   │
│ rows: install / download / remove           │
└─────────────────────────────────────────────┘
```

- Keep iframe **fixed height** (280–360px); do not grow with viewport
- Secondary actions only (no path bar / device frames on hub — those stay in editor)
- **Open live** → `window.open` customer-facing URL (without `preview=1` if possible; with tenant host when known)

### F1.2 Status line

- Show `active_theme_id` / token name
- Show `published_at` when F3 lands; until then show "Saves apply immediately" badge (honest copy)

### F1.3 Files

- `packages/admin/dashboard/src/routes/store-theme/store-theme.tsx`
- Shared preview from F0

### F1.4 Acceptance

- [ ] Hub loads in MainLayout without feeling like a full browser
- [ ] EDITOR opens full-viewport editor
- [ ] Refresh reloads iframe only
- [ ] Library install still works and iframe updates after refresh

---

# Phase F2 — Tenant identity (stop env-default footguns)

**Goal:** Theme read/write always targets the **merchant's active store**, not a hardcoded demo UUID.

### F2.1 Resolve tenant for admin theme APIs

- Today: `defaultTenantIdFromEnv(body.tenant_id)` in  
  `packages/bentoco/src/api/admin/store-theme/route.ts`  
  and `packages/bentoco/src/utils/theme-engine/tenant-theme-db.ts`
- **Target:**
  1. Prefer explicit `tenant_id` query/body when actor is allowed (agency)
  2. Else resolve from authenticated user → store/tenant membership
  3. Else env default **only** in development (log warning)
  4. Production: 400/403 if tenant cannot be resolved

### F2.2 Admin client

- `useStoreTheme` / `useUpdateStoreTheme` pass session tenant when available
- Store switcher (if any) invalidates `store-theme` query key

### F2.3 Storefront preview query

- Keep `?tenant_id=` + `preview=1` for iframe when host-based resolve is unavailable in local dev
- Document production path: custom domain / subdomain → middleware resolve (no tenant_id in customer URL)

### F2.4 Acceptance

- [ ] Two tenants: save on A never mutates B
- [ ] Iframe always shows A when admin context is A
- [ ] Removing env default in prod fails closed with clear error

### F2.5 Files (expected)

- `packages/bentoco/src/api/admin/store-theme/route.ts`
- `packages/bentoco/src/utils/theme-engine/tenant-theme-db.ts`
- `packages/admin/dashboard/src/hooks/api/store-theme.tsx`
- Agency/store context hooks already used elsewhere in dashboard

---

# Phase F3 — Draft / publish / rollback (trust & safety)

**Goal:** Editing does not have to equal customer-visible instantly; mistakes are reversible.

### F3.1 Data model (v1, keep JSONB)

Extend `ThemeConfig` (schema_version bump to **2** when ready):

```ts
ThemeConfig = {
  schema_version: 2
  active_theme_id: string
  layout_id: "default"
  design_md: string
  tokens: DesignMdTokens
  // Customer-visible
  published: {
    overrides?, branding?, homepage?
    published_at: string
  }
  // Editor working copy (optional; if absent, published is source)
  draft?: {
    overrides?, branding?, homepage?
    updated_at: string
  }
  // Optional ring buffer for rollback
  history?: Array<{
    at: string
    snapshot: { overrides?, branding?, homepage?, active_theme_id, design_md? }
  }>  // max 10
}
```

**Migration strategy:**
- On read: if no `published` / `draft`, treat current flat fields as **published** (back-compat)
- Compiler for storefront customer requests uses **published** only
- Admin GET returns both; editor loads **draft ?? published**
- Save in editor → write **draft** only (or keep "Save & publish" as explicit)
- Publish action → copy draft → published, push previous published to history, set `published_at`

### F3.2 API

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/admin/store-theme` | `{ draft, published, css_draft, css_published, … }` |
| POST | `/admin/store-theme` | Update draft (or install preset into draft) |
| POST | `/admin/store-theme/publish` | Draft → published + history |
| POST | `/admin/store-theme/discard` | Drop draft |
| POST | `/admin/store-theme/rollback` | Restore last history entry to draft (or publish?) — prefer restore to draft then re-publish |

Store theme public API:
- Default: compiled **published**
- `?preview=1` (admin iframe only): compiled **draft** if present

### F3.3 Editor UX

- Dirty indicator already exists → map to "Unsaved draft changes"
- Buttons: **Save draft** | **Publish** | **Discard draft**
- After publish: toast + refresh iframe without preview param optional secondary "View live"
- Hub badge: "Unpublished changes" when draft ≠ published

### F3.4 Acceptance

- [ ] Customer site unchanged until Publish
- [ ] Iframe with `preview=1` shows draft
- [ ] Rollback restores previous published branding within one click + confirm
- [ ] Old tenants without schema_version 2 still load

### F3.5 Files

- `packages/theme-engine/src/types.ts` (+ bentoco mirror)
- `packages/bentoco/src/utils/theme-engine/*` (compile, tenant-theme-db)
- `packages/bentoco/src/api/admin/store-theme/*` (+ publish/discard routes)
- `packages/bentoco/src/api/store/tenant/theme/route.ts`
- Editor + hub UI
- Storefront `fetchStorefrontTheme` — pass preview flag only from iframe

**Risk note:** Largest product behavior change. Ship behind feature flag `THEME_DRAFT_PUBLISH=1` if needed.

---

# Phase F4 — Shell unification (execute ADR-001 follow-up)

**Goal:** One continuous merchant UX across homepage + shop + PDP + content pages.  
**Decision (recommended):** **E1-A** — evolve `TenantStorefront` chrome into shared `TenantChrome`, retire dual Aura path for tenant hosts.

### F4.1 ADR update

- New ADR or amend ADR-001: **Accepted implement E1-A**
- Rationale: homepage already tokenized; Aura split confuses merchants after theme save

### F4.2 Extract shared chrome

```text
apps/storefront/components/tenant/
  tenant-chrome.tsx      # Header + Footer + cart/search shell
  tenant-header.tsx      # branding, nav, theme toggle
  tenant-footer.tsx
  use-tenant-nav.ts      # shop, contact, track-order, etc.
```

- Props: `tenant`, `branding`, optional cart count
- Homepage body stays sections-only (Hero, Promises, Category sections)
- Remove remaining mock product grid when `shouldSuppressMockCatalog` is true (already partial)

### F4.3 Route coverage

| Route | Action |
|-------|--------|
| `/` tenant | Use TenantChrome + sections |
| `/shop` | TenantChrome + existing shop grid |
| `/product/[slug]` | TenantChrome + PDP (fonts already themed) |
| `/cart`, checkout, contact, faq, shipping, track | TenantChrome |
| Apex marketing / unknown host | Unchanged (marketing or store-not-found) |

### F4.4 Layout integration

- Prefer composition in each page **or** a tenant layout segment that loads theme branding once
- Avoid double-fetch: layout loads theme CSS (ThemeStyles) + light branding; pages load section data

### F4.5 Acceptance (from CONNECT E5)

- [ ] All tenant routes share branding + tokens
- [ ] No "mock dark homepage vs Aura shop" split
- [ ] Nav links consistent
- [ ] Editor iframe path bar can navigate `/shop`, `/product/…` and look coherent

### F4.6 Out of scope for F4

- Pixel-perfect Aura feature parity if unused
- New page builder blocks

---

# Phase F5 — Trust, smoke, docs

### F5.1 Trust affordances

- Editor toolbar: **Live** vs **Draft preview** label (after F3)
- "Open in new tab" for both preview and live URLs
- Optional compare: side-by-side only if requested later (not v1)

### F5.2 Automated smoke

Extend `scripts/smoke-theme-phase1.ts` or add `scripts/smoke-theme-gaps.ts`:

1. GET admin theme for tenant A  
2. POST override accent color (draft or live per flag)  
3. GET store theme — assert CSS contains accent  
4. Publish (if F3) — assert public CSS  
5. Preview query returns draft CSS  

Runbook: document in CONNECT or GAP-FILL as checklist + script.

### F5.3 Manual smoke (update CONNECT list)

- Hub iframe height + refresh  
- Session tenant isolation  
- Draft → publish → customer  
- Shell: homepage → shop → PDP branding continuous  

### F5.4 Docs

| Doc | Update |
|-----|--------|
| `CONNECT-STOREFRONT-TODO.md` | Mark E4 done; link this plan for F0–F5 |
| `PHASE-3.md` | Reflect live iframe + draft/publish when shipped |
| `ADR-001` | Supersede when F4 starts |
| New: `docs/bent-4-theme-engine/MERCHANT-THEME.md` | 1-pager: Save vs Publish, preview vs live |
| `.env.example` | F0.4 table |

---

## Suggested calendar

| Block | Phase | Focus |
|-------|--------|--------|
| Day 1 | F0 | Shared preview, dist integrity, env sheet |
| Day 1–2 | F1 | Hub layout polish |
| Day 2–3 | F2 | Session tenant resolution |
| Day 3–5 | F3 | Draft/publish/rollback |
| Day 5–8 | F4 | TenantChrome + route migration |
| Day 8–9 | F5 | Smoke + docs |

Compress F3 if you accept "save is live" for longer; **do not skip F2** before multi-tenant demos.

---

## Priority if only one week

1. **F0** + **F2** (correctness)  
2. **F1** (hub polish — cheap)  
3. **F3** core (save draft + publish only; rollback later)  
4. Defer full F4 unless shop chrome is actively embarrassing

---

## Definition of done (whole plan)

- [ ] One shared preview URL module; hub + editor use it  
- [ ] Theme APIs tenant-scoped from session; env default is dev-only  
- [ ] Merchants can draft without affecting customers; publish is explicit  
- [ ] Rollback of last publish exists  
- [ ] Tenant routes share one chrome + branding  
- [ ] Smoke script + env examples + short merchant doc  
- [ ] CONNECT / ADR docs updated  

**Project success metric:** A merchant (or agency) can open `/store`, see the correct live store, open EDITOR, change theme safely, publish when ready, and walk shop + PDP without a visual identity break — with no hand-patched `dist` and no wrong-tenant saves.

---

## File index (quick reference)

| Area | Paths |
|------|--------|
| Hub | `packages/admin/dashboard/src/routes/store-theme/store-theme.tsx` |
| Editor | `packages/admin/dashboard/src/routes/store-theme/editor/store-theme-editor.tsx` |
| Preview util (new) | `packages/admin/dashboard/src/lib/storefront-preview.ts` |
| Admin theme API | `packages/bentoco/src/api/admin/store-theme/*` |
| Store theme API | `packages/bentoco/src/api/store/tenant/theme/route.ts` |
| Tenant DB | `packages/bentoco/src/utils/theme-engine/tenant-theme-db.ts` |
| Types | `packages/theme-engine/src/types.ts` |
| Storefront shell | `apps/storefront/components/tenant-storefront.tsx`, `app/*` |
| Theme inject | `apps/storefront/components/theme-styles.tsx`, `lib/theme.ts` |
| Existing connect todo | `docs/bent-4-theme-engine/CONNECT-STOREFRONT-TODO.md` |
| Shell ADR | `docs/bent-4-theme-engine/ADR-001-shell-unification-deferred.md` |

---

## Open decisions (confirm before F3/F4)

1. **Save semantics:** Draft-only saves + Publish, or keep "Save = live" with optional Draft mode flag?  
   - **Recommend:** Draft + Publish for production readiness.  
2. **Shell strategy:** Confirm E1-A (`TenantChrome`) vs E1-B (Aura-first).  
   - **Recommend:** E1-A.  
3. **History depth:** 5 vs 10 snapshots; store full `design_md` or overrides-only?  
   - **Recommend:** 10 entries; overrides + branding + homepage + `active_theme_id`; full `design_md` only on import/install events.  
4. **Default tenant env name:** keep `RAZORPAY_DEFAULT_TENANT_ID` alias or rename to `BENTOCO_DEFAULT_TENANT_ID`?  
   - **Recommend:** rename + alias one release.
