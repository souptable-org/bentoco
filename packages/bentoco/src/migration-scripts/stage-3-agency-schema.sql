-- Stage 3: Agency org, access grants, audit log, team members
-- Safe to re-run. Depends on Stage 2 (tenant, tenant_store).
-- Does NOT FORCE RLS on Medusa core tables.

BEGIN;

CREATE TABLE IF NOT EXISTS "bentoco_schema_migrations" (
  "id" VARCHAR(255) PRIMARY KEY,
  "applied_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 1. Agency master
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "agency" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL,
  "subdomain" VARCHAR(255) NOT NULL UNIQUE,
  "unique_uid" VARCHAR(50) NOT NULL UNIQUE,
  "owner_email" VARCHAR(255) NOT NULL,
  "master_uid" VARCHAR(50),
  "owner_id" TEXT,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_agency_uid" ON "agency" ("unique_uid");
CREATE INDEX IF NOT EXISTS "idx_agency_subdomain" ON "agency" ("subdomain");
CREATE INDEX IF NOT EXISTS "idx_agency_owner_email" ON "agency" ("owner_email");

-- Optional FK to Medusa user for owner_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agency_owner_id_fkey'
  ) THEN
    ALTER TABLE "agency"
      ADD CONSTRAINT "agency_owner_id_fkey"
      FOREIGN KEY ("owner_id") REFERENCES "user" ("id") ON DELETE SET NULL;
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2. Agency team members (staff under an agency)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "agency_team_member" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "agency_id" UUID NOT NULL REFERENCES "agency" ("id") ON DELETE CASCADE,
  "user_id" TEXT NOT NULL,
  "email" VARCHAR(255) NOT NULL,
  "role" VARCHAR(50) NOT NULL DEFAULT 'AGENCY_MEMBER'
    CHECK ("role" IN ('AGENCY_OWNER', 'AGENCY_MEMBER')),
  "rbac_role" VARCHAR(50) DEFAULT 'FULL_ACCESS'
    CHECK ("rbac_role" IN ('FULL_ACCESS', 'PRODUCTS_ORDERS', 'READ_ONLY')),
  "assigned_tenant_ids" JSONB DEFAULT '[]'::jsonb,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_agency_team_member_agency"
  ON "agency_team_member" ("agency_id", "user_id");
CREATE INDEX IF NOT EXISTS "idx_agency_team_member_email"
  ON "agency_team_member" ("email");

ALTER TABLE "agency_team_member"
  ADD COLUMN IF NOT EXISTS "rbac_role" VARCHAR(50) DEFAULT 'FULL_ACCESS';

-- ---------------------------------------------------------------------------
-- 3. Consent-based store access
--    Primary merchant identity: tenant_id (UUID text or 'PENDING_CREATION')
--    Secondary Medusa identity: store_id (nullable until store exists)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "agency_store_access" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "agency_id" UUID NOT NULL REFERENCES "agency" ("id") ON DELETE CASCADE,
  "tenant_id" TEXT NOT NULL,
  "store_id" TEXT,
  "merchant_email" VARCHAR(255) NOT NULL,
  "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING'
    CHECK ("status" IN ('PENDING', 'ACTIVE', 'REVOKED')),
  "invite_token" VARCHAR(512),
  "token_expires_at" TIMESTAMP WITH TIME ZONE,
  "invited_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "confirmed_at" TIMESTAMP WITH TIME ZONE,
  "revoked_at" TIMESTAMP WITH TIME ZONE,
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_agency_store_access_agency"
  ON "agency_store_access" ("agency_id");
CREATE INDEX IF NOT EXISTS "idx_agency_store_access_tenant"
  ON "agency_store_access" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_agency_store_access_store"
  ON "agency_store_access" ("store_id");
CREATE INDEX IF NOT EXISTS "idx_agency_store_access_token"
  ON "agency_store_access" ("invite_token");
CREATE INDEX IF NOT EXISTS "idx_agency_store_access_status"
  ON "agency_store_access" ("status");

ALTER TABLE "agency_store_access" ADD COLUMN IF NOT EXISTS "store_id" TEXT;

-- ---------------------------------------------------------------------------
-- 4. Audit log
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "agency_store_log" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "agency_id" UUID NOT NULL REFERENCES "agency" ("id") ON DELETE CASCADE,
  "tenant_id" TEXT NOT NULL,
  "store_id" TEXT,
  "member_id" UUID REFERENCES "agency_team_member" ("id") ON DELETE SET NULL,
  "member_email" VARCHAR(255),
  "action" VARCHAR(100) NOT NULL,
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "ip_address" VARCHAR(45),
  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS "idx_agency_store_log_agency"
  ON "agency_store_log" ("agency_id");
CREATE INDEX IF NOT EXISTS "idx_agency_store_log_tenant"
  ON "agency_store_log" ("tenant_id");
CREATE INDEX IF NOT EXISTS "idx_agency_store_log_created"
  ON "agency_store_log" ("created_at" DESC);

ALTER TABLE "agency_store_log" ADD COLUMN IF NOT EXISTS "store_id" TEXT;

-- ---------------------------------------------------------------------------
-- 5. Ownership status (store-level agency management flag)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "ownership_status" (
  "id" SERIAL PRIMARY KEY,
  "store_id" TEXT NOT NULL,
  "agency_id" UUID REFERENCES "agency" ("id") ON DELETE SET NULL,
  "status" VARCHAR(50) DEFAULT 'INDEPENDENT_MERCHANT',
  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS "idx_ownership_status_store"
  ON "ownership_status" ("store_id");

-- ---------------------------------------------------------------------------
-- 6. Wire tenant.agency_id → agency
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tenant' AND column_name = 'agency_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenant_agency_id_fkey'
  ) THEN
    ALTER TABLE "tenant"
      ADD CONSTRAINT "tenant_agency_id_fkey"
      FOREIGN KEY ("agency_id") REFERENCES "agency" ("id") ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "idx_tenant_agency_id" ON "tenant" ("agency_id");

-- ---------------------------------------------------------------------------
-- 7. Grants for future app role
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'bentoco_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
      "agency",
      "agency_team_member",
      "agency_store_access",
      "agency_store_log",
      "ownership_status"
    TO bentoco_app;
    GRANT USAGE, SELECT ON SEQUENCE ownership_status_id_seq TO bentoco_app;
  END IF;
END $$;

INSERT INTO "bentoco_schema_migrations" ("id")
VALUES ('stage-3-agency-schema')
ON CONFLICT ("id") DO NOTHING;

COMMIT;
