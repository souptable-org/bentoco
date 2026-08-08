# Bentoco (Bharat Commerce Engine) — Product Architecture & Specification

## Executive Overview
**Bentoco** is a hard fork of Medusa 2.0 re-engineered specifically for Indian D2C brands, solo operators, and high-velocity merchants. It replaces Western e-commerce abstractions (email-first flows, credit cards, complex VAT, Western carriers) with native Indian commerce primitives: **Single-DB Multi-Tenancy (PostgreSQL RLS), WhatsApp-native OTP & Prepaid Flip workflows, 1-Click UPI Intent checkout, native GST accounting, and zero-app-bloat conversion engines.**

---

## Technical Architecture Decision Summary

| Domain | Architecture Choice | Key Implementation Detail |
| :--- | :--- | :--- |
| **Multi-Tenancy** | Single DB + Row-Level Security (RLS) | `tenant_id` UUID column + Postgres RLS policy on all tables (`product`, `order`, `cart`, `customer`, `user`, `payment_config`). |
| **Engine Bloat Removal** | Strip Western Tax, Western Carriers & Multi-Currency | Lock math engine to `INR` (stored as integer Paisa); replace Avalara/TaxJar with flat GST module; remove FedEx/UPS/DHL defaults. |
| **Order State Machine** | Indian Pre-Paid Flip & COD OTP Pipeline | Native states: `ORDER_INITIATED` → `WHATSAPP_VERIFYING` → (`COD_VERIFIED` \| `PREPAID_FLIPPED`) → `AWB_GENERATED`. |
| **WhatsApp Engine** | Hybrid (Evolution API + Meta Cloud API) | Default QR Linked Devices (Evolution API via Baileys) for zero per-message cost; optional Meta Cloud API toggle for enterprise. |
| **Payment Gateway** | Tenant-Isolated BYOG Engine | Dynamic `tenant_payment_config` table for Razorpay, Cashfree, PhonePe with native mobile UPI Intent drawer. |
| **Storefront & Themes** | Edge-Rendered Next.js + `DESIGN.md` | Sub-1s static SSG edge rendering on 4G; 1-click theme swapping via YAML-to-CSS variable compiler (`DESIGN.md`). |
| **Logistics & Apps** | Native Built-in Feature Set | Shiprocket & Delhivery AWB/Tracking, Pincode Serviceability, 6-digit Pincode Auto-Complete, RTO & Returns Portal, WhatsApp Reviews, In-cart Bumps. |

---

## Monorepo Refactoring Strategy

### 1. Database Schema Isolation (`packages/bentoco/src/migration-scripts`)
```sql
-- 1. Tenant Registry Table
CREATE TABLE tenant (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(255) UNIQUE NOT NULL,
    custom_domain VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Inject tenant_id across Core Tables
ALTER TABLE "product" ADD COLUMN tenant_id UUID REFERENCES tenant(id) ON DELETE CASCADE;
ALTER TABLE "order" ADD COLUMN tenant_id UUID REFERENCES tenant(id) ON DELETE CASCADE;
ALTER TABLE "customer" ADD COLUMN tenant_id UUID REFERENCES tenant(id) ON DELETE CASCADE;
ALTER TABLE "cart" ADD COLUMN tenant_id UUID REFERENCES tenant(id) ON DELETE CASCADE;
ALTER TABLE "user" ADD COLUMN tenant_id UUID REFERENCES tenant(id) ON DELETE CASCADE;

-- 3. Row Level Security Policies
ALTER TABLE "product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "product" FORCE ROW LEVEL SECURITY;

ALTER TABLE "order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "order" FORCE ROW LEVEL SECURITY;

CREATE POLICY product_tenant_isolation ON "product"
    FOR ALL TO bentoco_app USING (tenant_id = current_setting('app.current_tenant', true)::UUID);

CREATE POLICY order_tenant_isolation ON "order"
    FOR ALL TO bentoco_app USING (tenant_id = current_setting('app.current_tenant', true)::UUID);
```

### 2. Custom Payment Config Table (`BYOG`)
```sql
CREATE TABLE tenant_payment_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES tenant(id) ON DELETE CASCADE,
    provider_id VARCHAR(50) NOT NULL, -- 'razorpay', 'cashfree', 'phonepe'
    encrypted_payload JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(tenant_id, provider_id)
);
```

---

## Next Steps Roadmap

1. **Step 1: Branding & Package Namespace Migration**: Re-namespaced `@medusajs/*` packages to `@bentoco/*` and renamed directories.
2. **Step 2: Database Schema & RLS Layer**: Executed Drizzle/Postgres migrations for `tenant_id` and RLS context middleware (`✅ PASSED`).
3. **Step 3: Order State Machine Refactor**: Extend Medusa workflows to support `WHATSAPP_VERIFYING`, `COD_VERIFIED`, and `PREPAID_FLIPPED`.
4. **Step 4: WhatsApp Engine & UPI Intent**: Build dynamic adapters for Razorpay/Cashfree/PhonePe and WhatsApp Evolution API endpoints.
