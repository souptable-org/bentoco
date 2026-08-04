# Stage 4 — Port agency HTTP into Medusa (completed)

**Date:** 2026-08-04  
**Plan:** `thoughts/shared/plans/2026-08-04-bentoco-medusa-agency-db-migration.md`

## Goal

Serve `/api/agency/*` from **real Medusa** on `:9000` so the admin dashboard no longer depends on `packages/bentoco/src/app.ts`.

## Routes registered

| Method | Path | Handler |
|--------|------|---------|
| GET | `/api/agency/overview` | KPIs + recent audit |
| GET | `/api/agency/stores` | Access list (`?agencyId=`) |
| GET | `/api/agency/team` | Team members |
| GET | `/api/agency/billing` | Placeholder billing |
| GET | `/api/agency/access-log` | Audit log |
| POST | `/api/agency/invite-store` | Invite merchant |
| GET | `/api/agency/confirm-access` | Merchant consent link |
| DELETE | `/api/agency/revoke-access` | Revoke grant |
| POST | `/api/agency/member-login` | Enter merchant store |
| POST | `/api/agency/transfer-store` | Start ownership handshake |
| POST | `/api/agency/confirm-transfer` | Confirm handshake code |
| POST | `/api/agency/grant-temporary-access` | Temp access code |

## Source layout

```text
packages/bentoco/src/api/api/agency/<name>/route.ts   # URL: /api/agency/<name>
packages/bentoco/src/utils/agency-handlers.ts
packages/bentoco/src/utils/pg-client.ts
packages/bentoco/src/utils/agency-access.ts           # existing helpers
packages/bentoco/src/utils/agency-store-transfer.ts
```

**Important:** Medusa loads routes from **`dist/api`**, not only `src`. After changing routes:

```bash
cd packages/bentoco
yarn run -T tsc --build
# then restart medusa develop
```

(`tsc` may still report unrelated errors e.g. `evolution-api-client`; agency files still emit.)

## Auth posture (Stage 4)

All agency routes export `AUTHENTICATE = false` (same openness as the old stub).  
**Stage 5** should gate them with Medusa session / agency membership checks.

## Smoke tests (passed)

| Endpoint | Status |
|----------|--------|
| overview / stores / team / billing / access-log | 200 |
| member-login | 200 `allowed: true` |
| invite-store | 200 PENDING |
| grant-temporary-access | 200 (+ `accessCode` in non-prod) |
| transfer-store | 200 TRANSFER_PENDING |
| `/admin/stores` merchant auth | 200 |

## Stub server

`packages/bentoco/src/app.ts` is **no longer required** for agency APIs.  
Do not run it on port 9000 (it would shadow Medusa).

## Next

**Stage 5** — wire agency UI login + store switcher to these real APIs; add proper auth.
