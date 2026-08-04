# Stage 2 — Multi-tenant foundation (completed)

**Date:** 2026-08-04  
**Plan:** `thoughts/shared/plans/2026-08-04-bentoco-medusa-agency-db-migration.md`

## Design choices

| Choice | Decision |
|--------|----------|
| Identity bridge | **`tenant` 1:1 Medusa `store`** via `tenant_store` |
| `tenant_id` on commerce rows | **Nullable** on `product`, `order`, `customer`, `cart`, `user` |
| FORCE RLS on Medusa tables | **Not enabled** (Stage 6) |
| Agency tables (`agency`, access, log) | **Not in Stage 2** (Stage 3) |

## Applied artifacts

- SQL: `packages/bentoco/src/migration-scripts/stage-2-tenant-foundation.sql`
- Runner: `scripts/run-stage-2-tenant-migration.js`

```bash
node scripts/run-stage-2-tenant-migration.js
```

## Tables created / extended

| Object | Purpose |
|--------|---------|
| `tenant` | Registry (subdomain, plan, ownership fields for Stage 3) |
| `tenant_store` | Links `tenant.id` ↔ Medusa `store.id` |
| `tenant_payment_config` | BYOG credentials per tenant |
| `tenant_wallet` / `tenant_wallet_ledger` | Communications wallet (paisa) |
| `tenant_otp_session` | COD OTP sessions |
| `order_state_history` | Indian order state audit |
| `bentoco_schema_migrations` | Bentoco migration bookkeeping |
| `product/order/customer/cart/user.tenant_id` | Nullable isolation column |
| `user.role` | Optional Bentoco flag (`MERCHANT` seeded on admin) |
| role `bentoco_app` | Created for future RLS (Stage 6) |

## Seed

| Field | Value |
|-------|--------|
| Tenant subdomain | `admin` |
| Store name | Bentoco Default Store |
| Linked store_id | default Medusa store from Stage 1 |

## Smoke tests after migration (passed)

| Check | Result |
|--------|--------|
| `GET /health` | 200 |
| Login `admin@bentoco.com` | 200 |
| `GET /admin/stores` | 200 |
| `GET /admin/users/me` | 200 |
| `GET /admin/products` | 200 |
| `GET /admin/orders` | 200 |
| Core tables RLS forced? | **No** (`relrowsecurity` / `relforcerowsecurity` = f) |
| `agency` table present? | **No** (Stage 3) |

## What Stage 2 does **not** include

- Agency invite/access/audit tables  
- Middleware registration in Medusa process  
- RLS enforcement on reads  
- Restoring Stage 0 prototype agency rows  

## Next

**Stage 3** — agency schema + optional data restore from Stage 0 exports.
