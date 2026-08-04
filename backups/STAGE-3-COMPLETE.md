# Stage 3 — Agency schema + seed (completed)

**Date:** 2026-08-04  
**Plan:** `thoughts/shared/plans/2026-08-04-bentoco-medusa-agency-db-migration.md`

## Design choices

| Choice | Decision |
|--------|----------|
| Merchant store identity | **`tenant_id` primary** (+ optional `store_id` Medusa bridge) |
| Agency identity | `agency.unique_uid` (e.g. `AGENCY-849201`) |
| Staff identity | Medusa `user.id` via `agency_team_member.user_id` |
| Stage 0 invite dump restore | **Clean re-seed** (ACTIVE + one PENDING demo), not all historical PENDING rows |

## Applied artifacts

- SQL: `packages/bentoco/src/migration-scripts/stage-3-agency-schema.sql`
- Runner/seed: `scripts/run-stage-3-agency-migration.js`

```bash
# optional: create agency login user first
npx medusa user -e agcy@bentoco.com -p supersecret

node scripts/run-stage-3-agency-migration.js
```

## Tables

| Table | Purpose |
|--------|---------|
| `agency` | Org registry (`unique_uid`, owner email/id) |
| `agency_team_member` | Staff + role + rbac_role |
| `agency_store_access` | PENDING / ACTIVE / REVOKED grants |
| `agency_store_log` | Audit trail |
| `ownership_status` | Per Medusa store management flag |

Also: `tenant.agency_id` FK wired when present.

## Seeded data

| Item | Value |
|------|--------|
| Agency | PixelCraft Digital Agency / `AGENCY-849201` |
| Owner | `admin@bentoco.com` (Medusa user id linked) |
| Member | `agcy@bentoco.com` / AGENCY_MEMBER / FULL_ACCESS |
| ACTIVE access | default tenant `admin` ↔ default Medusa store |
| PENDING access | `pending-merchant@example.com` (demo invite) |
| Audit | `ACCESS_GRANTED` seed row |

## Credentials (local only)

| User | Password | Role notes |
|------|----------|------------|
| `admin@bentoco.com` | `supersecret` | Merchant admin + agency owner membership |
| `agcy@bentoco.com` | `supersecret` | Agency member Medusa user |

## Smoke tests (passed)

| Check | Result |
|--------|--------|
| Medusa `/health` | 200 |
| Merchant login + `/admin/stores` | 200 |
| Agency user login + `/admin/users/me` | 200 |
| agency / team / access / log counts | non-zero |

## What Stage 3 does **not** include

- HTTP routes under Medusa (`/api/agency/*`) — **Stage 4**
- Agency UI wired to DB — **Stage 5**
- RLS enforcement — **Stage 6**

## Next

**Stage 4** — port agency endpoints from `app.ts` into Medusa API routes.
