# Plan: Unify Bentoco DB — Full Medusa API + Multi-Tenant Agency

**Date:** 2026-08-04  
**Goal:** One PostgreSQL database named `bentoco` that supports:

1. Full Medusa commerce API (`/auth/*`, `/admin/*`) so the admin dashboard works  
2. Bentoco multi-tenancy (`tenant`, RLS, subdomain resolution)  
3. Agency access & agency login system (invite, consent, team RBAC, audit, store switcher)

**Non-goals (this migration):** Rebuilding agency product UX from scratch; renaming packages; production hardening of email/Redis.

---

## Current state (why we need this)

| Asset | Location | What it has |
|--------|----------|-------------|
| Prototype multi-tenant + agency | DB `bentoco` + `packages/bentoco/src/app.ts` | `tenant`, `agency*`, wallets; simplified `user`/`product`/`order`; stub HTTP |
| Clean Medusa schema | DB `bentoco_medusa` | Full module tables; no agency/tenant product tables |
| Admin UI | Vite `:7001` | Merchant Medusa admin + `/agency/*` shell |
| Real engine | `npx medusa develop` | Full loaders/routes; needs full schema |

**Conflict:** Shared table names (`user`, `product`, `order`, `store`, `customer`, `cart`) exist in **both** DBs with **different columns**. Blind merge is unsafe.

**Strategy:** Rebuild foundation as full Medusa → **add** agency/tenant layer on top → port APIs off the stub → one process on `:9000`.

---

## Target architecture

```text
                    ┌─────────────────────────────┐
                    │  Admin Vite :7001           │
                    │  /login  /orders  /agency/* │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  Medusa (Bentoco) :9000     │
                    │  /auth/*  /admin/*          │
                    │  /api/agency/*  (ported)    │
                    │  tenant middleware + RLS    │
                    └──────────────┬──────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  PostgreSQL DB: bentoco     │
                    │  [Medusa core + links]      │
                    │  [tenant + agency + wallet] │
                    │  [tenant_id columns + RLS]  │
                    └─────────────────────────────┘
```

**Principle (from Agency Access plan):** Agency never owns the store. Merchant owns; agency gets consent-based access; staff use agency credentials only.

---

## Stage 0 — Freeze, backup, decide data fate

**Status:** COMPLETED 2026-08-04 (stamp `20260804-114036`)  
**Notes:** `backups/STAGE-0-FREEZE.md`

**Duration:** ~30–60 min  
**Owner:** Dev  
**Exit criteria:** Restorable backups exist; team agrees wipe vs preserve for prototype rows.

### Tasks

0.1 Stop treating `app.ts` as the long-term API (document: stub is temporary). **Done** — documented in Stage 0 freeze notes.  
0.2 Full backups: **Done**

```text
backups/bentoco_prototype_20260804-114036.dump   # gitignored binary
backups/bentoco_medusa_20260804-114036.dump      # gitignored binary
```

0.3 Export agency-critical data to portable SQL/JSON: **Done** (committed under `backups/exports/`)

- `agency`, `agency_store_access`, `agency_store_log`, `agency_team_member`
- `tenant`, `user`, `store`, `ownership_status`
- Seed emails: `admin@bentoco.com`, `agcy@bentoco.com`

0.4 Decision gate: **Prefer Option B** (preserve via dumps + portable exports; re-seed if remap fails)

| Option | When |
|--------|------|
| **A. Wipe & re-seed** | Prototype data disposable |
| **B. Restore agency tables after Medusa foundation** | Want to keep invite/audit history — **preferred** |

0.5 Inventory checklist (done once):

- [x] Schema diff documented (`bentoco` vs `bentoco_medusa`)
- [x] Agency tables/row counts known
- [x] Agency helpers: `agency-access.ts`, `agency-store-transfer.ts`, email utils
- [x] Admin agency routes under `packages/admin/dashboard/src/routes/agency/`
- [x] Binary dumps + portable exports + git push of Stage 0 artifacts

### Risks

- Losing unbacked agency rows if wipe proceeds without dump. **Mitigated** for stamp `20260804-114036`.

---

## Stage 1 — Config & single-DB foundation (Medusa only)

**Status:** COMPLETED 2026-08-04  
**Notes:** `backups/STAGE-1-COMPLETE.md`

**Duration:** ~1–2 hours  
**Exit criteria:** `DATABASE_URL` → `bentoco`; full migrations + links succeed; Medusa boots; health + unauthenticated probe work.

### Tasks

1.1 Point env at the product DB name: **Done**

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/bentoco
```

1.2 Keep `medusa-config.js` on `defineConfig` with:

- JWT / cookie secrets  
- `adminCors` / `authCors` including `http://localhost:7001`  
- `admin.disable: true` while Vite admin is separate  

1.3 Reset `bentoco` public schema (only after Stage 0 backup): **Done** (DROP DATABASE + CREATE)

1.4 Run **full** migrations (do **not** skip links): **Done** — links synced (incl. `publishable_api_key_sales_channel`)

1.5 Create Medusa admin user: **Done**

```bash
npx medusa user -e admin@bentoco.com -p supersecret
```

1.6 Start real API: **Done** — `medusa develop` on `:9000`

1.7 Smoke tests: **All passed**

| Call | Result |
|------|--------|
| `GET /health` | 200 `OK` |
| `POST /auth/user/emailpass` | 200 + JWT |
| `GET /admin/stores` | 200 (default store) |
| `GET /admin/users/me` | 200 `admin@bentoco.com` |

1.8 Retire temporary DB when stable:

- Day-to-day uses **`bentoco`** now  
- `bentoco_medusa` optional to drop later  

### Risks

- Link tables missing if `--skip-links` used again → defaults/user create fail. **Avoided.**  
- Port 9000 still occupied by stub → kill stub first. **Done.**

### Deliverable

Merchant admin can log in against **empty-but-valid** Medusa on DB `bentoco`. **Met.**

---

## Stage 2 — Multi-tenant schema on top of Medusa

**Status:** COMPLETED 2026-08-04  
**Notes:** `backups/STAGE-2-COMPLETE.md`  
**SQL:** `packages/bentoco/src/migration-scripts/stage-2-tenant-foundation.sql`  
**Runner:** `scripts/run-stage-2-tenant-migration.js`

**Duration:** ~0.5–1 day  
**Exit criteria:** `tenant` (+ related) exist beside Medusa tables; `tenant_id` on chosen commerce entities; no broken Medusa boot.

### Tasks

2.1 Add **tenant registry** migration: **Done**

- `tenant` + indexes + plan/ownership columns (agency-ready for Stage 3)
- `tenant_store` bridge to Medusa `store`

2.2 Add nullable `tenant_id` on: **Done** — `product`, `order`, `customer`, `cart`, `user`  
Also optional `user.role` for Bentoco flags.

**Design choice locked:**

| Approach | Status |
|----------|--------|
| **A. `tenant` 1:1 `store` via `tenant_store`** | **Chosen** |
| **B. row-level `tenant_id` only** | Also applied (nullable) for future RLS |

2.3 Wallet / payment / OTP / order state tables: **Done**

2.4 Do **not** drop Medusa columns: **Honored**

2.5 Verify Medusa still boots: **Passed** (health, login, stores, products, orders)

### Exit tests

- [x] `SELECT * FROM tenant` works (seeded `admin` ↔ default store)  
- [x] Medusa admin APIs still 200  
- [x] No FORCE RLS on core tables  

### Risks mitigated

- Did **not** run old `0000-tenant-multi-tenancy-rls.sql` as-is (it FORCE RLS + fake CREATE TABLE stubs).  
- Stage 2 SQL is additive / IF NOT EXISTS only.

---

## Stage 3 — Agency schema + data restore

**Status:** COMPLETED 2026-08-04  
**Notes:** `backups/STAGE-3-COMPLETE.md`  
**SQL:** `packages/bentoco/src/migration-scripts/stage-3-agency-schema.sql`  
**Runner:** `scripts/run-stage-3-agency-migration.js`

**Duration:** ~0.5 day  
**Exit criteria:** All agency tables present; optional restored rows; FKs consistent with new Medusa IDs.

### Tasks

3.1 Create agency tables: **Done**

| Table | Purpose |
|--------|---------|
| `agency` | Agency org (`unique_uid`, name, subdomain, owner) |
| `agency_store_access` | Invite/consent lifecycle PENDING → ACTIVE → REVOKED |
| `agency_store_log` | Audit: who entered which store when |
| `agency_team_member` | Staff + `rbac_role` + assigned tenants/stores |
| `ownership_status` | Store-level management flag |

3.2 Align IDs with Medusa world: **Done**

- Primary merchant key: **`tenant_id`** (TEXT; allows `PENDING_CREATION`)  
- Secondary: **`store_id`** (Medusa store, set when known)  
- Agency owner/member: Medusa **`user.id`** on `agency.owner_id` / `agency_team_member.user_id`

3.3 Restore data: **Clean re-seed** (Option B spirit)

- Restored stable agency UUID / `AGENCY-849201` from Stage 0  
- Did **not** bulk-import broken PENDING invite rows  
- Seeded ACTIVE access on default tenant + one PENDING demo invite  

3.4 Seed scripts: **Done** — `run-stage-3-agency-migration.js`  
Medusa users: `admin@bentoco.com`, `agcy@bentoco.com`

### Exit tests

- [x] Counts non-zero for agency seed (1 agency, 2 members, 2 access, 1 audit)  
- [x] ACTIVE access has real tenant_id + store_id  
- [x] Medusa merchant + agency login still 200  

---

## Stage 4 — Port agency HTTP off `app.ts` into Medusa

**Status:** COMPLETED 2026-08-04  
**Notes:** `backups/STAGE-4-COMPLETE.md`  
**Routes:** `packages/bentoco/src/api/api/agency/*/route.ts` (compiled to `dist/api/api/agency`)

**Duration:** ~1–2 days  
**Exit criteria:** Agency endpoints served by Medusa process; stub no longer required on 9000.

### Tasks

4.1 Create Medusa API routes: **Done** (package paths → `/api/agency/*`)

```text
POST   /api/agency/invite-store
GET    /api/agency/confirm-access
DELETE /api/agency/revoke-access
POST   /api/agency/member-login
GET    /api/agency/access-log
GET    /api/agency/overview
GET    /api/agency/stores
GET    /api/agency/team
GET    /api/agency/billing
POST   /api/agency/transfer-store
POST   /api/agency/confirm-transfer
POST   /api/agency/grant-temporary-access
```

4.2 Reuse existing logic with thin adapters: **Done**

- Helpers: `agency-access.ts`, `agency-store-transfer.ts`  
- Shared: `withPgClient` + `agency-handlers.ts`  
- Fixed access-log join (`tenant.store_name`)

4.3 Register CORS for admin origin (already in config): **Yes**

4.4 Register `tenantMiddleware` in Medusa middleware pipeline for routes that need isolation.

4.5 Auth bridge (minimum viable):

| Actor | Auth |
|--------|------|
| Merchant admin | Medusa emailpass + session (existing) |
| Agency owner/member | Medusa user with agency membership row |
| Enter merchant store | `member-login` checks access + RBAC → sets tenant/store context + session policy |

4.6 Deprecate stub:

- Remove or move `packages/bentoco/src/app.ts` to `scripts/prototype-server.ts`  
- Document: **only** `medusa develop` for local API  

### Exit tests

- Agency invite → confirm → ACTIVE without stub  
- Member-login denied when REVOKED  
- Audit log row written  
- Merchant `/admin/stores` still works  

---

## Stage 5 — Agency login & admin UI wiring

**Duration:** ~1–2 days  
**Exit criteria:** `/agency/*` UI talks to real APIs; login is not header-email hacks.

### Tasks

5.1 Agency login page → Medusa auth (`/auth/user/emailpass` or dedicated actor if you split later).  
5.2 After login, load profile: role/membership from `agency_team_member` / flags.  
5.3 Route guard: agency users → `/agency/*`; merchants → merchant shell (your admin-mode resolver).  
5.4 Replace demo fixtures gradually:

- Dashboard KPIs / store list from `/api/agency/*`  
- Keep demo banners only where data still mocked (billing ok to lag)  

5.5 Store switcher:

- List ACTIVE access  
- On open: `member-login` → open merchant admin URL with tenant host/header  
- a11y: “opens in new tab” where applicable  

5.6 Logout wired for agency and merchant.

### Exit tests

- Login `agency` user → agency shell  
- Login merchant → merchant orders list (Medusa)  
- Open store from switcher → audit log entry  

---

## Stage 6 — RLS & isolation hardening (optional but product-critical)

**Duration:** ~1–3 days  
**Exit criteria:** Cross-tenant reads fail under app DB role; superuser migrations still work.

### Tasks

6.1 App role `bentoco_app` (non-superuser).  
6.2 `ENABLE` / `FORCE ROW LEVEL SECURITY` on tenant-scoped tables.  
6.3 Policies: `tenant_id = current_setting('app.current_tenant', true)::uuid`.  
6.4 Ensure every request path sets `SET LOCAL app.current_tenant` inside the transaction (middleware + connection from pool).  
6.5 Agency “god” paths: either bypass with explicit security definer functions or set tenant per store operation after RBAC check.  
6.6 Automated tests: tenant A cannot read tenant B products/orders.

### Note

Do this **after** Medusa + agency APIs are stable; RLS bugs look like “empty admin” and are hard to debug earlier.

---

## Stage 7 — Cleanup, docs, verification

**Duration:** ~0.5 day  
**Exit criteria:** One DB, one server, docs match reality.

### Tasks

7.1 `.env` only references `bentoco`.  
7.2 Drop or archive `bentoco_medusa` after sign-off.  
7.3 README / internal doc: how to boot (migrate, user, develop, admin vite).  
7.4 Update seed scripts; remove obsolete Drizzle-only assumptions that conflict with Medusa models (or keep Drizzle only for **extra** tables).  
7.5 Full verification matrix:

| Area | Check |
|------|--------|
| Merchant login | Works |
| Admin stores/orders | 200, no error boundary |
| Agency login | Works |
| Invite + confirm | End-to-end |
| Member store enter | RBAC + audit |
| Tenant isolation | Manual or test |
| Stub | Not required on 9000 |

7.6 Changelog note for the hardfork team: “API process is Medusa; agency is a module/layer on the same DB.”

---

## Stage dependency graph

```text
Stage 0 Backup
    │
    ▼
Stage 1 Medusa foundation on bentoco  ──► Merchant admin login works
    │
    ▼
Stage 2 Tenant schema                  ──► Multi-tenant registry exists
    │
    ▼
Stage 3 Agency schema + seed           ──► Agency data model live
    │
    ▼
Stage 4 Port agency APIs to Medusa     ──► Stub retired
    │
    ▼
Stage 5 Agency UI + login bridge       ──► Dual-mode product usable
    │
    ▼
Stage 6 RLS hardening                  ──► Isolation guaranteed
    │
    ▼
Stage 7 Cleanup & docs
```

---

## What happens to the “complex agency login system”

| Piece | Fate |
|--------|------|
| Product rules (consent, no ownership, audit) | **Keep** |
| Tables `agency*` | **Recreate on Stage 3** (+ restore if wanted) |
| `agency-access.ts` / transfer helpers | **Keep**, adapt DB access |
| Routes in `app.ts` | **Port** Stage 4, then delete from main path |
| `/agency/*` UI | **Keep**, wire to real APIs Stage 5 |
| Fake Bearer email tokens | **Replace** with Medusa auth + membership |

You are **not** throwing the agency system away; you are **mounting it on the real engine**.

---

## Explicit non-merge rule

Do **not**:

```text
pg_dump bentoco + pg_dump bentoco_medusa → restore both into one DB
```

Do:

```text
empty bentoco
  → Medusa migrations (full + links)
  → tenant/agency migrations
  → optional data restore/remap
  → Medusa process + ported routes
```

---

## Suggested first implementation slice (smallest valuable path)

If executing immediately after plan approval:

1. Stage 0 backup  
2. Stage 1 only (Medusa on `bentoco`, admin login)  
3. Stage 3 agency tables empty + Stage 4 one route (`GET /api/agency/stores` stub-from-DB)  
4. Then deepen Stages 2, 5, 6  

That proves the combined DB idea before full RLS and full invite email flows.

---

## Open decisions (resolve before Stage 2–3)

1. **Primary store identity for agency access:** `tenant.id` vs Medusa `store.id` vs both with a link table?  
2. **Wipe vs restore** prototype agency rows?  
3. **Agency auth actor:** same Medusa `user` actor as admin, or separate auth actor later?  
4. **How strict Day-1 isolation:** app-level filters only vs full RLS (Stage 6)?

---

## Success definition

- One DB name: **`bentoco`**  
- One API process: **`medusa develop` :9000**  
- Merchant Medusa admin works  
- Agency system (schema + login + invite/access/audit) works on the **same** DB and process  
- `app.ts` stub is not required  
- Multi-tenant direction preserved (registry + path to RLS)

---

## References

- Agency product plan: `docs-ob/Bentoco/Notes/Agency Access System — Implementation Plan.md`  
- Multi-tenancy roadmap: `docs-ob/Bentoco/Docs/P1 Database Multi-Tenancy & RLS/Roadmap.md`  
- Stub API (temporary): `packages/bentoco/src/app.ts`  
- Agency helpers: `packages/bentoco/src/utils/agency-access.ts`, `agency-store-transfer.ts`  
- Tenant middleware: `packages/bentoco/src/api/tenant-middleware.ts`  
- Config: `medusa-config.js`, `.env`
