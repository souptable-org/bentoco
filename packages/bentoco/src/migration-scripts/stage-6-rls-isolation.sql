-- Stage 6: Row Level Security isolation for multi-tenant tables
-- Safe to re-run.
--
-- Design:
--   * Policies apply to role bentoco_app (non-superuser, no BYPASSRLS).
--   * Postgres superuser (typical Medusa DATABASE_URL) still sees all rows —
--     so admin migrations and Medusa core keep working.
--   * Isolation is enforced when code uses bentoco_app + SET LOCAL app.current_tenant.
--   * SET via: SELECT set_config('app.current_tenant', '<uuid>', true);

BEGIN;

CREATE TABLE IF NOT EXISTS "bentoco_schema_migrations" (
  "id" VARCHAR(255) PRIMARY KEY,
  "applied_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 1. Application role
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'bentoco_app') THEN
    CREATE ROLE bentoco_app WITH LOGIN PASSWORD 'bentoco_app_pass';
  ELSE
    ALTER ROLE bentoco_app WITH LOGIN PASSWORD 'bentoco_app_pass';
  END IF;
END $$;

GRANT CONNECT ON DATABASE bentoco TO bentoco_app;
GRANT USAGE ON SCHEMA public TO bentoco_app;

-- ---------------------------------------------------------------------------
-- 2. Helper expression notes
--    current_setting('app.current_tenant', true) returns NULL if unset
--    Cast only when non-empty to avoid errors
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- 3. Grant DML on tenant-scoped tables to bentoco_app
-- ---------------------------------------------------------------------------
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  "tenant",
  "tenant_store",
  "tenant_payment_config",
  "tenant_wallet",
  "tenant_wallet_ledger",
  "tenant_otp_session",
  "order_state_history",
  "product",
  "order",
  "cart",
  "customer",
  "user",
  "agency",
  "agency_team_member",
  "agency_store_access",
  "agency_store_log",
  "ownership_status"
TO bentoco_app;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bentoco_app;

-- ---------------------------------------------------------------------------
-- 4. Enable + FORCE RLS on tenant-scoped commerce / Bentoco tables
--    (FORCE so table owners who are NOT superuser are also restricted;
--     superusers still bypass.)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'product',
    'order',
    'cart',
    'customer',
    'user',
    'tenant_payment_config',
    'tenant_wallet',
    'tenant_wallet_ledger',
    'tenant_otp_session',
    'order_state_history'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- Agency tables: enable RLS but policies allow agency-wide read for bentoco_app
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'agency',
    'agency_team_member',
    'agency_store_access',
    'agency_store_log',
    'ownership_status',
    'tenant',
    'tenant_store'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    -- Do not FORCE on registry tables so owner tooling stays flexible
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 5. Isolation policies for tables with tenant_id
-- ---------------------------------------------------------------------------
-- product
DROP POLICY IF EXISTS product_tenant_isolation ON "product";
CREATE POLICY product_tenant_isolation ON "product"
  FOR ALL TO bentoco_app
  USING (
    tenant_id IS NOT NULL
    AND tenant_id::text = nullif(current_setting('app.current_tenant', true), '')
  )
  WITH CHECK (
    tenant_id IS NOT NULL
    AND tenant_id::text = nullif(current_setting('app.current_tenant', true), '')
  );

-- order
DROP POLICY IF EXISTS order_tenant_isolation ON "order";
CREATE POLICY order_tenant_isolation ON "order"
  FOR ALL TO bentoco_app
  USING (
    tenant_id IS NOT NULL
    AND tenant_id::text = nullif(current_setting('app.current_tenant', true), '')
  )
  WITH CHECK (
    tenant_id IS NOT NULL
    AND tenant_id::text = nullif(current_setting('app.current_tenant', true), '')
  );

-- cart
DROP POLICY IF EXISTS cart_tenant_isolation ON "cart";
CREATE POLICY cart_tenant_isolation ON "cart"
  FOR ALL TO bentoco_app
  USING (
    tenant_id IS NOT NULL
    AND tenant_id::text = nullif(current_setting('app.current_tenant', true), '')
  )
  WITH CHECK (
    tenant_id IS NOT NULL
    AND tenant_id::text = nullif(current_setting('app.current_tenant', true), '')
  );

-- customer
DROP POLICY IF EXISTS customer_tenant_isolation ON "customer";
CREATE POLICY customer_tenant_isolation ON "customer"
  FOR ALL TO bentoco_app
  USING (
    tenant_id IS NOT NULL
    AND tenant_id::text = nullif(current_setting('app.current_tenant', true), '')
  )
  WITH CHECK (
    tenant_id IS NOT NULL
    AND tenant_id::text = nullif(current_setting('app.current_tenant', true), '')
  );

-- user
DROP POLICY IF EXISTS user_tenant_isolation ON "user";
CREATE POLICY user_tenant_isolation ON "user"
  FOR ALL TO bentoco_app
  USING (
    tenant_id IS NOT NULL
    AND tenant_id::text = nullif(current_setting('app.current_tenant', true), '')
  )
  WITH CHECK (
    tenant_id IS NOT NULL
    AND tenant_id::text = nullif(current_setting('app.current_tenant', true), '')
  );

-- tenant_payment_config
DROP POLICY IF EXISTS tenant_payment_config_isolation ON "tenant_payment_config";
CREATE POLICY tenant_payment_config_isolation ON "tenant_payment_config"
  FOR ALL TO bentoco_app
  USING (tenant_id::text = nullif(current_setting('app.current_tenant', true), ''))
  WITH CHECK (tenant_id::text = nullif(current_setting('app.current_tenant', true), ''));

-- tenant_wallet
DROP POLICY IF EXISTS tenant_wallet_isolation ON "tenant_wallet";
CREATE POLICY tenant_wallet_isolation ON "tenant_wallet"
  FOR ALL TO bentoco_app
  USING (tenant_id::text = nullif(current_setting('app.current_tenant', true), ''))
  WITH CHECK (tenant_id::text = nullif(current_setting('app.current_tenant', true), ''));

-- tenant_wallet_ledger
DROP POLICY IF EXISTS tenant_wallet_ledger_isolation ON "tenant_wallet_ledger";
CREATE POLICY tenant_wallet_ledger_isolation ON "tenant_wallet_ledger"
  FOR ALL TO bentoco_app
  USING (tenant_id::text = nullif(current_setting('app.current_tenant', true), ''))
  WITH CHECK (tenant_id::text = nullif(current_setting('app.current_tenant', true), ''));

-- tenant_otp_session
DROP POLICY IF EXISTS tenant_otp_session_isolation ON "tenant_otp_session";
CREATE POLICY tenant_otp_session_isolation ON "tenant_otp_session"
  FOR ALL TO bentoco_app
  USING (tenant_id::text = nullif(current_setting('app.current_tenant', true), ''))
  WITH CHECK (tenant_id::text = nullif(current_setting('app.current_tenant', true), ''));

-- order_state_history
DROP POLICY IF EXISTS order_state_history_isolation ON "order_state_history";
CREATE POLICY order_state_history_isolation ON "order_state_history"
  FOR ALL TO bentoco_app
  USING (tenant_id::text = nullif(current_setting('app.current_tenant', true), ''))
  WITH CHECK (tenant_id::text = nullif(current_setting('app.current_tenant', true), ''));

-- ---------------------------------------------------------------------------
-- 6. Agency / registry: allow bentoco_app full access (cross-tenant agency console)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS agency_open ON "agency";
CREATE POLICY agency_open ON "agency"
  FOR ALL TO bentoco_app USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS agency_team_member_open ON "agency_team_member";
CREATE POLICY agency_team_member_open ON "agency_team_member"
  FOR ALL TO bentoco_app USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS agency_store_access_open ON "agency_store_access";
CREATE POLICY agency_store_access_open ON "agency_store_access"
  FOR ALL TO bentoco_app USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS agency_store_log_open ON "agency_store_log";
CREATE POLICY agency_store_log_open ON "agency_store_log"
  FOR ALL TO bentoco_app USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS ownership_status_open ON "ownership_status";
CREATE POLICY ownership_status_open ON "ownership_status"
  FOR ALL TO bentoco_app USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS tenant_registry_open ON "tenant";
CREATE POLICY tenant_registry_open ON "tenant"
  FOR ALL TO bentoco_app USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS tenant_store_open ON "tenant_store";
CREATE POLICY tenant_store_open ON "tenant_store"
  FOR ALL TO bentoco_app USING (true) WITH CHECK (true);

INSERT INTO "bentoco_schema_migrations" ("id")
VALUES ('stage-6-rls-isolation')
ON CONFLICT ("id") DO NOTHING;

COMMIT;
