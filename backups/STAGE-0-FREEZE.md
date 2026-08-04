# Stage 0 — Freeze & Backup (completed)

**Date:** 2026-08-04  
**Stamp:** `20260804-114036`  
**Plan:** `thoughts/shared/plans/2026-08-04-bentoco-medusa-agency-db-migration.md`

## Decision

| Item | Choice |
|------|--------|
| Product DB name (target) | `bentoco` |
| Temporary Medusa-only DB | `bentoco_medusa` (reference until Stage 1 replaces foundation) |
| Main API long-term | `npx medusa develop` — **not** `packages/bentoco/src/app.ts` |
| Stub server | Temporary prototype only; do not treat as production API |
| Prototype agency data | **Preserve via dumps + portable exports** (Option B preferred when restoring) |

## Local binary dumps (not committed to git)

These live only on this machine under `backups/` (gitignored `*.dump`):

| File | Database | Size (approx) |
|------|----------|----------------|
| `bentoco_prototype_20260804-114036.dump` | `bentoco` (multi-tenant + agency prototype) | ~118 KB |
| `bentoco_medusa_20260804-114036.dump` | `bentoco_medusa` (full Medusa schema) | ~353 KB |

Restore example:

```bash
# requires pg_restore / PostgreSQL 15 tools
pg_restore -h localhost -U postgres -d bentoco --clean --if-exists backups/bentoco_prototype_20260804-114036.dump
```

## Portable exports (committed under `backups/exports/`)

| File | Contents |
|------|----------|
| `bentoco_agency_tenant_20260804-114036.json` | Rows + column schema for agency/tenant/user/store |
| `bentoco_agency_tenant_data_20260804-114036.sql` | Data-only INSERTs for agency/tenant/user tables |

### Row counts at freeze

| Table | Rows |
|-------|------|
| agency | 1 |
| agency_store_access | 9 |
| agency_store_log | 9 |
| agency_team_member | 0 |
| tenant | 3 |
| user | 2 |
| store | 5 |
| ownership_status | 5 |

### Seed emails present

- `admin@bentoco.com`
- `agcy@bentoco.com`

## Inventory checklist

- [x] Schema conflict understood (8 overlapping tables, different shapes)
- [x] Agency helpers exist (`agency-access.ts`, `agency-store-transfer.ts`)
- [x] Admin `/agency/*` UI exists
- [x] Tenant middleware exists (`tenant-middleware.ts`)
- [x] Binary dumps taken
- [x] Portable JSON/SQL exports taken
- [x] Migration plan written
- [x] Git commit of plan + exports (this Stage 0 backup)

## What Stage 0 does **not** do

- Does not wipe either database  
- Does not change runtime process on port 9000  
- Does not merge schemas  

Next: **Stage 1** — Medusa foundation on DB `bentoco` (after explicit go-ahead; uses these backups first).
