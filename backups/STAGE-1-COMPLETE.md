# Stage 1 — Medusa foundation on `bentoco` (completed)

**Date:** 2026-08-04  
**Plan:** `thoughts/shared/plans/2026-08-04-bentoco-medusa-agency-db-migration.md`

## What was done

1. Pointed `DATABASE_URL` / `medusa-config.js` at `postgres://…/bentoco`
2. Stopped processes on port 9000
3. **Reset** database `bentoco` (DROP + CREATE) — prototype multi-tenant data removed from live DB  
   - Restorable from Stage 0 dumps: `backups/bentoco_prototype_20260804-114036.dump`  
   - Portable agency export: `backups/exports/bentoco_agency_tenant_20260804-114036.json`
4. Ran `npx medusa db:migrate` **with links** (no `--skip-links`)
5. Created admin user via `npx medusa user`
6. Started `npx medusa develop --no-lint --types false -p 9000`

## Smoke tests (passed)

| Check | Result |
|--------|--------|
| `GET /health` | 200 `OK` |
| `POST /auth/user/emailpass` (`admin@bentoco.com` / `supersecret`) | 200 + JWT |
| `GET /admin/stores` (Bearer token) | 200 — default "Medusa Store" |
| `GET /admin/users/me` | 200 — `admin@bentoco.com` |
| Public table count | **143** |
| Link table `publishable_api_key_sales_channel` | present |
| `tenant` table | **not present** (Stage 2) |

## Admin login (local)

- **URL:** http://localhost:7001 (Vite admin; backend http://localhost:9000)
- **Email:** `admin@bentoco.com`
- **Password:** `supersecret`

Change this password for any shared/dev environment.

## Runtime

- API: **real Medusa** on `:9000` (not `app.ts` stub)
- DB: **`bentoco`** with full Medusa schema + link tables
- Agency / multi-tenant product tables: **not yet** (Stages 2–3)

## Next

**Stage 2** — multi-tenant schema on top of this Medusa foundation (`tenant` registry, optional `tenant_id` / store mapping).
