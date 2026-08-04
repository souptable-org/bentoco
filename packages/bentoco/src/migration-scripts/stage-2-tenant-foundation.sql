-- Stage 2: Multi-tenant foundation ON TOP of full Medusa schema
-- Safe to re-run (IF NOT EXISTS / ADD COLUMN IF NOT EXISTS).
-- Does NOT:
--   - recreate product/order/user/cart/customer tables
--   - FORCE RLS on Medusa core tables (that is Stage 6)
-- Does:
--   - tenant registry (+ agency-ready columns for Stage 3)
--   - tenant ↔ Medusa store link table
--   - nullable tenant_id on selected commerce tables
--   - BYOG payment config, wallet, OTP, order state history

BEGIN;

CREATE TABLE IF NOT EXISTS "bentoco_schema_migrations" (
  "id" VARCHAR(255) PRIMARY KEY,
  "applied_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Idempotent early exit marker is handled by the runner; SQL stays re-runnable.

-- ---------------------------------------------------------------------------
-- 1. Tenant registry
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "tenant" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "store_name" VARCHAR(255) NOT NULL,
  "subdomain" VARCHAR(255) NOT NULL UNIQUE,
  "custom_domain" VARCHAR(255) UNIQUE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_tenant_subdomain" ON "tenant" ("subdomain");
CREATE INDEX IF NOT EXISTS "idx_tenant_custom_domain" ON "tenant" ("custom_domain");

-- Agency / plan fields used later (Stage 3+) — nullable / defaulted so Stage 2 is complete
ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "agency_id" UUID;
ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "ownership_status" VARCHAR(50) DEFAULT 'INDEPENDENT_MERCHANT';
ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "transfer_code_hash" VARCHAR(255);
ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "transfer_expires_at" TIMESTAMP WITH TIME ZONE;
ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "system_password_hash" VARCHAR(255);
ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "plan" VARCHAR(50) DEFAULT 'free';
ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "can_go_live" BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS "idx_tenant_plan" ON "tenant" ("plan");
CREATE INDEX IF NOT EXISTS "idx_tenant_ownership_status" ON "tenant" ("ownership_status");

-- ---------------------------------------------------------------------------
-- 2. Map Bentoco tenant → Medusa store (1:1 preferred identity bridge)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "tenant_store" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL REFERENCES "tenant" ("id") ON DELETE CASCADE,
  "store_id" TEXT NOT NULL,
  "is_primary" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE ("tenant_id"),
  UNIQUE ("store_id")
);

CREATE INDEX IF NOT EXISTS "idx_tenant_store_store_id" ON "tenant_store" ("store_id");

-- Optional FK to Medusa store when table exists (store.id is text in Medusa)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'store'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_store_store_id_fkey'
  ) THEN
    ALTER TABLE "tenant_store"
      ADD CONSTRAINT "tenant_store_store_id_fkey"
      FOREIGN KEY ("store_id") REFERENCES "store" ("id") ON DELETE CASCADE;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 3. Nullable tenant_id on Medusa commerce tables (no NOT NULL, no FORCE RLS)
-- ---------------------------------------------------------------------------
ALTER TABLE "product" ADD COLUMN IF NOT EXISTS "tenant_id" UUID REFERENCES "tenant" ("id") ON DELETE SET NULL;
ALTER TABLE "order" ADD COLUMN IF NOT EXISTS "tenant_id" UUID REFERENCES "tenant" ("id") ON DELETE SET NULL;
ALTER TABLE "customer" ADD COLUMN IF NOT EXISTS "tenant_id" UUID REFERENCES "tenant" ("id") ON DELETE SET NULL;
ALTER TABLE "cart" ADD COLUMN IF NOT EXISTS "tenant_id" UUID REFERENCES "tenant" ("id") ON DELETE SET NULL;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "tenant_id" UUID REFERENCES "tenant" ("id") ON DELETE SET NULL;

-- Optional Bentoco role flag (agency vs merchant) — does not replace Medusa auth
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" VARCHAR(50);

CREATE INDEX IF NOT EXISTS "idx_product_tenant" ON "product" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_order_tenant" ON "order" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_customer_tenant" ON "customer" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_cart_tenant" ON "cart" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_user_tenant" ON "user" ("tenant_id");

-- ---------------------------------------------------------------------------
-- 4. Tenant-scoped Bentoco product tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "tenant_payment_config" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL REFERENCES "tenant" ("id") ON DELETE CASCADE,
  "provider_id" VARCHAR(50) NOT NULL,
  "encrypted_payload" JSONB NOT NULL,
  "is_active" BOOLEAN DEFAULT TRUE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE ("tenant_id", "provider_id")
);

CREATE TABLE IF NOT EXISTS "tenant_wallet" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL UNIQUE REFERENCES "tenant" ("id") ON DELETE CASCADE,
  "balance_paisa" INT DEFAULT 0 CHECK (balance_paisa >= 0),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "tenant_wallet_ledger" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL REFERENCES "tenant" ("id") ON DELETE CASCADE,
  "type" VARCHAR(20) NOT NULL CHECK (type IN ('topup', 'deduction')),
  "amount_paisa" INT NOT NULL,
  "balance_after_paisa" INT NOT NULL,
  "reason" TEXT NOT NULL,
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_wallet_ledger_tenant"
  ON "tenant_wallet_ledger" ("tenant_id", "created_at");

CREATE TABLE IF NOT EXISTS "tenant_otp_session" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL REFERENCES "tenant" ("id") ON DELETE CASCADE,
  "order_id" TEXT NOT NULL,
  "phone" VARCHAR(50) NOT NULL,
  "otp_code_hash" VARCHAR(255) NOT NULL,
  "attempts" INT DEFAULT 0,
  "max_attempts" INT DEFAULT 3,
  "is_verified" BOOLEAN DEFAULT FALSE,
  "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_otp_session_lookup"
  ON "tenant_otp_session" ("tenant_id", "phone", "order_id");

CREATE TABLE IF NOT EXISTS "order_state_history" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL REFERENCES "tenant" ("id") ON DELETE CASCADE,
  "order_id" TEXT NOT NULL,
  "from_status" VARCHAR(50) NOT NULL,
  "to_status" VARCHAR(50) NOT NULL,
  "reason" TEXT,
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_order_state_history_tenant_order"
  ON "order_state_history" ("tenant_id", "order_id");

-- Soft FKs to order when present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'order'
  ) THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tenant_otp_session_order_id_fkey') THEN
      ALTER TABLE "tenant_otp_session"
        ADD CONSTRAINT "tenant_otp_session_order_id_fkey"
        FOREIGN KEY ("order_id") REFERENCES "order" ("id") ON DELETE CASCADE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'order_state_history_order_id_fkey') THEN
      ALTER TABLE "order_state_history"
        ADD CONSTRAINT "order_state_history_order_id_fkey"
        FOREIGN KEY ("order_id") REFERENCES "order" ("id") ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 5. App role for future RLS (Stage 6) — create only, do not FORCE on core tables
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'bentoco_app') THEN
    CREATE ROLE bentoco_app WITH LOGIN PASSWORD 'bentoco_app_pass';
  END IF;
END $$;

GRANT USAGE ON SCHEMA public TO bentoco_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  "tenant",
  "tenant_store",
  "tenant_payment_config",
  "tenant_wallet",
  "tenant_wallet_ledger",
  "tenant_otp_session",
  "order_state_history"
TO bentoco_app;

-- ---------------------------------------------------------------------------
-- 6. Seed: default tenant linked to first Medusa store (if any)
-- ---------------------------------------------------------------------------
INSERT INTO "tenant" ("store_name", "subdomain", "plan", "can_go_live", "ownership_status")
SELECT 'Bentoco Default Store', 'admin', 'free', FALSE, 'INDEPENDENT_MERCHANT'
WHERE NOT EXISTS (SELECT 1 FROM "tenant" WHERE "subdomain" = 'admin');

INSERT INTO "tenant_store" ("tenant_id", "store_id", "is_primary")
SELECT t.id, s.id, TRUE
FROM "tenant" t
CROSS JOIN LATERAL (
  SELECT id FROM "store" ORDER BY created_at ASC NULLS LAST LIMIT 1
) s
WHERE t.subdomain = 'admin'
  AND NOT EXISTS (SELECT 1 FROM "tenant_store" ts WHERE ts.tenant_id = t.id)
  AND NOT EXISTS (SELECT 1 FROM "tenant_store" ts WHERE ts.store_id = s.id);

-- Mark merchant admin user role if column present
UPDATE "user"
SET "role" = COALESCE("role", 'MERCHANT')
WHERE "email" = 'admin@bentoco.com';

INSERT INTO "bentoco_schema_migrations" ("id")
VALUES ('stage-2-tenant-foundation')
ON CONFLICT ("id") DO NOTHING;

COMMIT;
