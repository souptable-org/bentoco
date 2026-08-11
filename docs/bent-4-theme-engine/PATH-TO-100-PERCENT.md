# Path to 100% — Gap-Fill Delivery Brief

**Role of this doc:** Senior delivery brief for engineering.  
**Date:** 2026-08-11  
**Audience:** Implementers + anyone claiming “done”  
**Source of truth for scope:** `GAP-FILL-PLAN.md`  
**Do not treat as done:** `GAP-FILL-PLAN-SUMMARY.txt` alone (it is a feature inventory, not acceptance)

---

## 0. Executive notes (manager view)

### Current state (honest)

| Layer | Status |
|-------|--------|
| Theme editor → API → storefront tokens/content (A–D) | **Working (MVP)** |
| Shared preview helper, hub iframe, Publish buttons, TenantChrome start | **Scaffolded** |
| True draft-only save, multi-tenant hard scope, full shell, full smoke/docs | **Not done** |

**We are demo-complete, not gap-fill complete.**

Calling it 100% today creates three risks:

1. **Trust risk** — “Save draft” still mutates live config; customers can see half-edited themes.  
2. **Multi-tenant risk** — wrong store can receive theme writes via env/default UUID.  
3. **UX risk** — shop/PDP/chrome inconsistency undermines the product story.

### Definition of 100% (non-negotiable)

We only claim 100% when **all** of the following are true:

1. Customer site only changes after **Publish** (or explicit “save live” is removed from product language).  
2. **Save draft** never overwrites `published` or `history`.  
3. Admin theme ops target the **session active store**, not a silent demo tenant in production.  
4. Tenant routes share **TenantChrome + branding** (at least commerce + content pages listed below).  
5. Preview iframe defaults to the real storefront port (`:3001`) without env guesswork in local dev.  
6. Automated smoke proves draft ≠ live and publish promotes draft.  
7. Docs (`SUMMARY`, `CONNECT`, this file) match code — no “complete” without checklist green.

### What “working” does **not** mean

- Build exit code 0 ≠ product complete  
- Buttons existing ≠ lifecycle complete  
- Demo on one tenant ≠ multi-tenant safe  
- Docs checkboxes ≠ verification  

---

## 1. Corrections to `GAP-FILL-PLAN-SUMMARY.txt`

Use this table to correct false confidence. Update the summary file after each workstream lands.

| Summary claim | Correction | Required truth |
|---------------|------------|----------------|
| “Status: 100% COMPLETE AND VERIFIED” | **False** | Status must be `IN PROGRESS` until Section 7 sign-off |
| “Every gap G1–G11 closed” | **False** | G4, G5, G6, G8–G11 still open or partial |
| F0 “port resolved to :3000” | **Wrong target** | Storefront dev is `next dev -p 3001`; default base must be `http://localhost:3001` |
| F1 badge “Saves apply live” | **Contradicts F3** | After F3 fix: badge = “Draft” / “Unpublished changes” / `published_at` |
| F2 “session-scoped theme” | **Partial only** | Today: header/body/`req.tenant_id` then env UUID — not membership resolve |
| F3 “draft/publish lifecycle done” | **API shell only** | `updateTenantThemeOverrides` writes flat config via `buildThemeConfig` and can wipe v2 fields |
| F3 discard/rollback hooks | **Hooks unused in UI** | Wire Discard + Rollback or do not claim complete |
| F4 “shell unification” | **Partial** | Only `/`, `/shop`, `/product/*`; branding missing on shop/PDP |
| F5 “smoke & docs complete” | **Thin** | Smoke only GETs; no `MERCHANT-THEME.md`; no end-to-end publish proof |
| “production builds clean = verified” | **Insufficient** | Verification = functional checklist + smoke script green |

### Immediate doc hygiene (do first, 15 min)

1. Edit `GAP-FILL-PLAN-SUMMARY.txt` status → `IN PROGRESS — MVP scaffold only`.  
2. Edit `CONNECT-STOREFRONT-TODO.md` F0–F5 checkboxes → uncheck or mark “partial” until Section 7.  
3. Keep this file as the **only** gate for “100%”.

---

## 2. Priority order (do not reorder casually)

| Priority | Workstream | Why first |
|----------|------------|-----------|
| **P0** | **W1 — Draft save path** | Without this, Publish is theater and “Save draft” is a lie |
| **P0** | **W2 — Preview base URL :3001** | Broken local iframe without env |
| **P1** | **W3 — Tenant hard scope** | Silent wrong-tenant writes |
| **P1** | **W4 — Editor trust UI** | Discard/Rollback/labels so operators trust the system |
| **P1** | **W5 — TenantChrome + branding coverage** | Continuous merchant UX |
| **P2** | **W6 — Smoke + docs honesty** | Prevents future false “100%” |
| **P2** | **W7 — Theme-engine drift (G10)** | Long-term maintainability |

**Rule:** Do not start W5 cosmetics before W1 is green.

---

## 3. Workstream instructions (engineer-ready)

---

### W1 — Draft-only save (P0) — **closes G5 for real**

#### Problem

`updateTenantThemeOverrides` currently:

1. Builds a **fresh** `ThemeConfig` via `buildThemeConfig` (`schema_version: 1`, stamps `published_at`).  
2. Saves that object as the entire `theme_config`.  
3. **Drops** `draft`, `published`, `history`.

So Save = live overwrite.

#### Target behavior

| Action | DB effect | Customer site | Iframe `?preview=1` |
|--------|-----------|---------------|---------------------|
| Save draft | Write/update `draft` only; keep `published` + `history` | Unchanged | Shows draft |
| Publish | Copy draft → `published` + top-level mirrors; push old published to `history` (max 10); clear `draft` | Updates | Matches live |
| Discard | Clear `draft` | Unchanged | Matches published |
| Rollback | Restore `history[0]` → `published` (+ top-level); clear `draft` | Updates to previous | Matches |

#### Implementation steps

**File:** `packages/bentoco/src/utils/theme-engine/tenant-theme-db.ts`

1. Replace `updateTenantThemeOverrides` save strategy:

```ts
// Pseudocode — do not wipe published/history
const existing = await getTenantThemeConfig(tenantId) ?? materializeDefault()
const now = new Date().toISOString()

// Merge patch into draft snapshot
const draft: ThemeSnapshot = {
  active_theme_id: patch.theme_id || existing.active_theme_id,
  design_md: patch.design_md || existing.design_md,
  overrides: patch.overrides ?? existing.draft?.overrides ?? existing.overrides,
  branding: patch.branding ?? existing.draft?.branding ?? existing.branding,
  homepage: patch.homepage ?? existing.draft?.homepage ?? existing.homepage,
  updated_at: now,
}

// Preserve base pack fields
const next: ThemeConfig = {
  ...existing,
  schema_version: 2,
  design_md: draft.design_md || existing.design_md,
  active_theme_id: draft.active_theme_id || existing.active_theme_id,
  // Keep customer-facing published as-is
  published: existing.published ?? bootstrapPublishedFromFlat(existing),
  draft,
  history: existing.history ?? [],
  // Optional: do NOT update top-level overrides/branding/homepage on draft save
  // Top-level should mirror published for back-compat readers
  overrides: existing.published?.overrides ?? existing.overrides,
  branding: existing.published?.branding ?? existing.branding,
  homepage: existing.published?.homepage ?? existing.homepage,
  published_at: existing.published?.published_at ?? existing.published_at,
}

// Recompute tokens if design_md changed (install/import only usually)
await saveTenantThemeConfig(tenantId, next)
// Return payload compiled from DRAFT for admin response (editor preview)
```

2. Add helper `bootstrapPublishedFromFlat(config)` for v1 tenants: first time we touch v2, copy flat fields into `published` so customers don’t flash empty.

3. Fix `buildThemeConfig` callers:
   - `buildThemeConfig` may still produce tokens/css for a snapshot.
   - **Never** use its return value as the entire row to save after editor edits.

4. Confirm `publishTenantTheme` / `discard` / `rollback` still work against the new shape (they already assume draft/published — align field copies with top-level mirrors on publish).

5. **Install preset** behavior (product decision — implement as below):
   - Install/import → write to **draft** + set `active_theme_id`/`design_md`/`tokens` on draft path; **or** install as draft and require Publish.  
   - **Recommended:** install preset updates draft (and base design_md), does not change customer until Publish.  
   - Document in merchant help.

**File:** `packages/bentoco/src/api/store/tenant/theme/route.ts`  
Already branches preview vs published — re-test after save fix:

- `preview=1` + draft present → draft CSS/content  
- no preview + published present → published  
- no published (legacy) → flat fields (back-compat)

**Admin response (optional polish):**  
`GET /admin/store-theme` return `has_unpublished_draft: boolean` for hub badge.

#### Acceptance (W1)

- [ ] Save draft twice does not change customer homepage CSS/content  
- [ ] After save, `theme_config.draft` is set in DB; `published` unchanged  
- [ ] Publish updates customer; `draft` cleared; history length +1 (cap 10)  
- [ ] Discard restores editor to published  
- [ ] Rollback restores previous published  
- [ ] `schema_version` is 2 after first draft save  
- [ ] Rebuild bentoco package / restart API so dist matches src  

#### Test procedure (manual)

1. Note current live accent color.  
2. Editor: change accent → **Save draft** only.  
3. Open storefront **without** `preview=1` → old accent.  
4. Open iframe / `?preview=1` → new accent.  
5. **Publish** → live matches new accent.  
6. Change again, Save draft, **Discard** → preview matches published.  
7. Publish A, Publish B, **Rollback** → back to A.

---

### W2 — Preview base URL (P0) — **closes G11 for local**

#### Problem

`getStorefrontBaseUrl()` defaults to `http://localhost:3000`.  
Storefront package scripts use port **3001**.

#### Steps

**File:** `packages/admin/dashboard/src/lib/storefront-preview.ts`

```ts
return "http://localhost:3001"
```

**Also:**

1. Align admin `.env.example`: `VITE_MEDUSA_STOREFRONT_URL=http://localhost:3001`  
2. Confirm `lib/storefront.ts` still imports shared helper (already does).  
3. Optional: health banner if iframe fails (nice-to-have; not blocking 100% if Open live works).

#### Acceptance (W2)

- [ ] No env set → iframe loads storefront on 3001  
- [ ] With env set → env wins  
- [ ] Open live opens same host without `preview=1` (or with intentional live URL)

---

### W3 — Tenant identity hard scope (P1) — **closes G4**

#### Problem

`defaultTenantIdFromEnv()` falls back to hard-coded demo UUID. Admin GET/POST prefer `req.tenant_id` but middleware often **does not set it** for pure admin JWT calls.

#### Target behavior

| Environment | Missing tenant after resolve | Result |
|-------------|------------------------------|--------|
| development | yes | Allow env default + **console warn** |
| production / staging | yes | **400/403** with clear message — never silent demo UUID |

#### Steps

1. **Resolve function** (new helper e.g. `resolveAdminThemeTenantId(req)`):

   Order:

   1. Explicit `tenant_id` query/body if actor allowed (agency assume-store)  
   2. `req.tenant_id` / `req.tenant?.id` from middleware  
   3. Session/store binding used elsewhere in admin (reuse existing “active store” / actor metadata if present)  
   4. Env default **only if** `NODE_ENV !== "production"`  

2. Wire into:

   - `packages/bentoco/src/api/admin/store-theme/route.ts`  
   - `publish/route.ts`, `discard/route.ts`, `rollback/route.ts`  

3. **Admin client:**  
   - If dashboard has active store/tenant context, pass `tenant_id` on all theme hooks.  
   - Invalidate `store-theme` queries on store switch.

4. Remove hard-coded UUID from production path (keep only as last-resort dev default or remove entirely if env always set in dev).

#### Acceptance (W3)

- [ ] Two tenants A/B: admin on A never writes B’s `theme_config`  
- [ ] Production-like env without tenant → API error, not demo write  
- [ ] Iframe `tenant_id` matches admin context tenant  

---

### W4 — Editor & hub trust UI (P1) — **closes G7**

#### Steps

**Editor** `store-theme-editor.tsx`:

1. Keep **Save draft** + **Publish**.  
2. Wire **Discard draft** → `useDiscardStoreThemeDraft` + confirm dialog.  
3. Wire **Rollback** → `useRollbackStoreTheme` + confirm (“Restore previous published version?”).  
4. Labels:

   - Dirty client state: “Unsaved”  
   - Server draft present: “Unpublished draft”  
   - Iframe: “Draft preview” when `preview=1`  

5. Toast copy:

   - Save: “Draft saved — not live until Publish”  
   - Publish: “Published to live store”  

**Hub** `store-theme.tsx`:

1. Remove badge **“Saves apply live”**.  
2. Replace with:

   - If draft: orange **“Unpublished changes”**  
   - Else: green **“Published”** + optional date from `published_at`  

3. Keep compact iframe + Refresh + Open live + EDITOR.

#### Acceptance (W4)

- [ ] No UI text claims “saves apply live” unless a true live-save mode exists  
- [ ] Discard/Rollback reachable and work with W1  
- [ ] Hub status matches server draft/published state  

---

### W5 — Shell unification completion (P1) — **closes G6**

#### Decision (locked)

**E1-A:** `TenantChrome` is the only tenant chrome. Apex marketing may keep Aura Header/Footer.

#### Steps

1. **Load branding once per page** (or small shared helper):

   ```ts
   // pattern
   const theme = await fetchStorefrontTheme({ tenantId, host })
   const branding = theme.theme_config?.branding
   const storeName = theme.store_name || "Store"
   ```

2. Wrap with branding:

   | Route | Action |
   |-------|--------|
   | `/` | Already via TenantStorefront |
   | `/shop` | Pass real `tenant` + `branding` (not hardcoded “Merchant Catalog”) |
   | `/product/[slug]` | Pass real store_name + branding |
   | `/cart` | Wrap TenantChrome + branding |
   | `/checkout` | Wrap TenantChrome + branding |
   | `/contact` | Wrap |
   | `/faq` | Wrap |
   | `/shipping-returns` | Wrap |
   | `/track-order` | Wrap |
   | `/account`, `/wishlist` | Wrap if tenant-facing |

3. Keep apex (`page.tsx` non-tenant branch) on marketing Header/Footer.

4. Nav links in TenantChrome stay consistent (Home, Shop, Track Order, etc.).

5. Suppress mock catalog when real sections/products exist (already partial).

#### Acceptance (W5)

- [ ] From homepage → shop → PDP logo/wordmark continuous  
- [ ] Contact/FAQ under same header  
- [ ] Apex localhost marketing still distinct if designed so  
- [ ] Theme tokens still apply globally via ThemeStyles  

---

### W6 — Smoke + docs (P2) — **closes G8, G9**

#### Smoke script

Extend `scripts/smoke-theme-gaps.ts` (or new `smoke-theme-f3.ts`):

1. Admin auth token (env `SMOKE_ADMIN_TOKEN`).  
2. GET theme for tenant.  
3. POST draft override (unique accent).  
4. GET store theme **without** preview → assert accent **≠** draft accent (or equals old published).  
5. GET store theme **with** preview=1 → assert draft accent.  
6. POST publish.  
7. GET store without preview → assert new accent.  
8. Optional: rollback → previous accent.

Exit non-zero on any fail. Document env vars at top of script.

#### Docs

| File | Action |
|------|--------|
| `docs/bent-4-theme-engine/MERCHANT-THEME.md` | Create 1-pager: Save draft vs Publish, preview vs live, Open live |
| `GAP-FILL-PLAN-SUMMARY.txt` | Rewrite status after sign-off only |
| `CONNECT-STOREFRONT-TODO.md` | Check F boxes only when Section 7 green |
| `GAP-FILL-PLAN.md` | Status → Implemented when done |
| `ADR-001` | Amend: E1-A implemented (date) when W5 done |

#### Acceptance (W6)

- [ ] `npx tsx scripts/smoke-theme-gaps.ts` (or f3 script) green against local stack  
- [ ] Merchant doc exists and matches UI labels  
- [ ] No doc claims 100% until Section 7  

---

### W7 — Dual theme-engine trees (P2) — **closes G10**

Not blocking merchant demo, required for long-term 100% engineering health.

**Options:**

- **A (acceptable for 100% gate):** Document “runtime = `packages/bentoco/src/utils/theme-engine`”; types package is contract only; checklist “when changing types, update both.”  
- **B (better follow-up):** Bentoco imports `@bentoco/theme-engine` for types/compile.

**Minimum for 100%:** Option A written in `packages/theme-engine/README.md` + bentoco theme-engine README note.

---

## 4. Execution plan (calendar)

| Day | Deliverable | Exit |
|-----|-------------|------|
| Day 1 AM | W1 draft save + unit/manual publish path | Customer stable until Publish |
| Day 1 PM | W2 port default + rebuild/restart API | Iframe works on 3001 |
| Day 2 AM | W3 tenant resolve + fail-closed prod | No silent demo writes |
| Day 2 PM | W4 Discard/Rollback + hub badges | Trust UI honest |
| Day 3 | W5 TenantChrome + branding on all tenant routes | Continuous chrome |
| Day 4 AM | W6 smoke + docs rewrite | Scripts/docs green |
| Day 4 PM | Section 7 sign-off | Claim 100% |

One engineer can do this in ~3–4 focused days if no agency auth rabbit holes. W3 may take longer if no existing active-store context — timebox: ship fail-closed + explicit tenant_id from admin first.

---

## 5. Build & runtime discipline (ops notes)

1. **Never hand-edit `packages/bentoco/dist`.**  
2. After any theme API change:

   ```bash
   yarn workspace @bentoco/medusa build
   # restart API on :9000
   ```

3. Local three-process stack:

   | Process | Port |
   |---------|------|
   | API | 9000 |
   | Admin | 7001 |
   | Storefront | **3001** |

4. Env minimum:

   ```env
   # API
   DATABASE_URL=...
   BENTOCO_DEFAULT_TENANT_ID=<dev-only-tenant>

   # Admin
   VITE_MEDUSA_STOREFRONT_URL=http://localhost:3001

   # Storefront
   NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
   NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...
   ```

5. If iframe blank: check port, CORS, and `tenant_id` query.

---

## 6. Out of scope (do not pull into 100%)

- New homepage block types / page builder  
- Marketing site redesign  
- Multiple `layout_id`s  
- Agency product rewrite  
- Pixel-perfect Aura parity on every legacy page  

If asked mid-stream, park them. 100% means **gap-fill plan**, not all of Bentoco.

---

## 7. Final sign-off checklist (manager gate)

Only when **every** box is checked may status become **100% COMPLETE**:

### Product behavior

- [ ] Save draft does not change customer storefront  
- [ ] Publish changes customer storefront  
- [ ] Discard drops draft; preview matches live  
- [ ] Rollback restores previous published  
- [ ] Hub badge never says “Saves apply live”  
- [ ] Editor shows draft vs published clearly  

### Multi-tenant

- [ ] Theme write scoped to active tenant/session  
- [ ] Prod-like config fails closed without tenant  
- [ ] Two-tenant isolation verified manually  

### Storefront UX

- [ ] Home, shop, PDP share chrome + branding  
- [ ] Cart/checkout/contact/faq/track share TenantChrome  
- [ ] Apex marketing behavior unchanged (if applicable)  

### Engineering

- [ ] Preview default host is `:3001`  
- [ ] bentoco built; dist contains publish/discard/rollback  
- [ ] Smoke script proves draft ≠ live → publish promotes  
- [ ] `MERCHANT-THEME.md` exists  
- [ ] `GAP-FILL-PLAN-SUMMARY.txt` rewritten to match reality  
- [ ] `CONNECT-STOREFRONT-TODO.md` F boxes match reality  

### Builds

- [ ] `packages/bentoco` build clean  
- [ ] admin dashboard build clean  
- [ ] storefront build clean  

**Sign-off line (copy when done):**

```
Gap-fill 100% accepted on YYYY-MM-DD by <name>.
Evidence: smoke-theme log + manual W1 procedure + checklist above.
```

---

## 8. Assignment template (paste into tickets)

### Ticket A — W1 Draft save
**Files:** `tenant-theme-db.ts`, `build-theme-config.ts` (careful), store theme route tests  
**DoD:** Manual W1 procedure green  

### Ticket B — W2 Port
**Files:** `storefront-preview.ts`, admin env example  
**DoD:** Iframe without VITE env hits 3001  

### Ticket C — W3 Tenant
**Files:** admin store-theme routes, resolve helper, admin hooks  
**DoD:** Isolation test A/B  

### Ticket D — W4 UI
**Files:** `store-theme-editor.tsx`, `store-theme.tsx`  
**DoD:** Discard/Rollback + honest badges  

### Ticket E — W5 Chrome
**Files:** storefront app routes, `tenant-chrome.tsx`  
**DoD:** Continuous branding path  

### Ticket F — W6 Docs/smoke
**Files:** `scripts/smoke-theme-gaps.ts`, docs/*  
**DoD:** Script green + summary honest  

---

## 9. Manager communication (use this language)

**To stakeholders now:**

> Theme editing and live preview work for single-tenant demos. Draft/publish APIs exist but save still applies changes in a way that is not fully isolated from customers. We are finishing draft isolation, tenant hard-scoping, remaining storefront chrome, and verification before we call gap-fill 100% complete.

**To stakeholders after Section 7:**

> Gap-fill is 100% complete: merchants can draft safely, publish intentionally, roll back, and see a continuous themed storefront. Automated smoke and docs match the product.

---

## 10. First commands to start W1 (for implementer)

```bash
# 1. Read the broken save path
# packages/bentoco/src/utils/theme-engine/tenant-theme-db.ts → updateTenantThemeOverrides

# 2. Implement draft-only merge save (W1)

# 3. Build + restart API
yarn workspace @bentoco/medusa build

# 4. Manual W1 procedure with admin :7001 + storefront :3001

# 5. Only then proceed to W2–W6
```

---

**Bottom line:** The summary file lists real scaffolding. **100% means W1–W6 acceptance green and Section 7 signed.** Until then, status is **IN PROGRESS**, not complete.
