# Stage 6 — RLS isolation (completed)

**Date:** 2026-08-04  
**Plan:** `thoughts/shared/plans/2026-08-04-bentoco-medusa-agency-db-migration.md`

## Goal

Enforce **PostgreSQL Row Level Security** so tenant A cannot read/write tenant B data when using the app role — safe foundation for multi-tenant seeding and isolation tests.

## Model

| Connection | Role | Sees |
|------------|------|------|
| `DATABASE_URL` (Medusa default) | `postgres` superuser | **All rows** (RLS bypass) — admin + Medusa modules work |
| `DATABASE_APP_URL` / derived | `bentoco_app` | **Only** rows matching `app.current_tenant` |

Tenant context (transaction-local):

```sql
SELECT set_config('app.current_tenant', '<tenant-uuid>', true);
```

Helper: `packages/bentoco/src/utils/tenant-rls-context.ts`

## Applied

```bash
node scripts/run-stage-6-rls-migration.js
node scripts/seed-multi-tenant-rls.js
node scripts/test-stage-6-rls.js
```

### Tables with ENABLE + FORCE RLS

- `product`, `order`, `cart`, `customer`, `user`
- `tenant_wallet`, `tenant_wallet_ledger`, `tenant_payment_config`
- `tenant_otp_session`, `order_state_history`

### Agency / registry tables

RLS enabled with **open policies** for `bentoco_app` (agency console is cross-tenant by design).

## Seeded tenants (for testing)

| Subdomain | Store | Product | Wallet (paisa) |
|-----------|--------|---------|----------------|
| `alpha` | Alpha Textiles | Alpha Silk Shirt | 150000 |
| `beta` | Beta Gear | Beta Leather Jacket | 275000 |

## Isolation test result

```text
✅ STAGE 6 RLS PASSED: tenants isolated under bentoco_app
```

Checks:

1. Superuser sees both products  
2. `bentoco_app` with no tenant context → 0 products  
3. Alpha context → only Alpha product + wallet  
4. Beta context → only Beta product + wallet  
5. Cross-tenant INSERT blocked by `WITH CHECK`

## Medusa after RLS

Still healthy on superuser URL:

- `/health` 200  
- `/auth/user/emailpass` 200  
- `/admin/products`, `/admin/stores` 200  
- `/api/agency/overview` 200  

## How to use in custom APIs

```js
const { Client } = require("pg")
const { getTenantAppDatabaseUrl, withTenantTransaction } =
  require("./packages/bentoco/src/utils/tenant-rls-context") // or dist

const client = new Client({ connectionString: getTenantAppDatabaseUrl() })
await client.connect()
const rows = await withTenantTransaction(client, tenantId, async (c) => {
  return (await c.query("SELECT * FROM product")).rows
})
```

## Optional `.env`

```env
DATABASE_URL=postgres://postgres:postgres@localhost:5432/bentoco
DATABASE_APP_URL=postgres://bentoco_app:bentoco_app_pass@localhost:5432/bentoco
BENTOCO_APP_PASSWORD=bentoco_app_pass
```

## Next

**Stage 7** — cleanup (drop `bentoco_medusa` if unused, docs, retire stub, PR summary).  
Optional later: run Medusa pool as non-superuser with session `SET ROLE` (harder; not required for seeding/tests).
