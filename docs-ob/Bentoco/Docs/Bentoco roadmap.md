# Bentoco (Bharat Commerce Engine) — Implementation Roadmap

This roadmap outlines the phased execution plan to hard-fork Medusa 2.0 and build **Bentoco**, a high-density, multi-tenant e-commerce platform engineered specifically for the Indian market.

---

## Phase 1: Codebase Detachment & Monorepo Cleanup (Completed)
> **Goal:** Burn upstream dependencies, re-brand the monorepo, and strip Western e-commerce bloat.

### Tasks:
- [x] **Package Re-namespacing**: Renamed all `@medusajs/*` internal packages in [package.json](file:///C:/Users/harsh/bentoco/package.json), `packages/*/package.json`, and [turbo.json](file:///C:/Users/harsh/bentoco/turbo.json) to `@bentoco/*` (6,774 files modified across 21,827 scanned files).
- [x] **Monorepo Folder Renaming**: Renamed core directories (`packages/medusa` -> `packages/bentoco`, `create-medusa-app` -> `create-bentoco-app`, `medusa-cli` -> `bentoco-cli`, `medusa-telemetry` -> `bentoco-telemetry`, `medusa-test-utils` -> `bentoco-test-utils`).
- [x] **Telemetry Removal**: Purged vendor telemetry, error reporting, post-install banners, and external pingback logic ([packages/bentoco-telemetry/src/telemeter.js](file:///C:/Users/harsh/bentoco/packages/bentoco-telemetry/src/telemeter.js)). Executed audit test [scripts/test-telemetry-purged.js](file:///C:/Users/harsh/bentoco/scripts/test-telemetry-purged.js) logged to [log/test-telemetry-purged.txt](file:///C:/Users/harsh/bentoco/log/test-telemetry-purged.txt) (`✅ TELEMETRY PURGE AUDIT PASSED`).
- [x] **Currency & Math Locking**: Built INR integer math engine [packages/bentoco/src/utils/inr-currency-math.ts](file:///C:/Users/harsh/bentoco/packages/bentoco/src/utils/inr-currency-math.ts) (`rupeesToPaisa`, `paisaToRupees`, `formatINR`, `calculateGST`). Executed audit test [scripts/test-inr-currency-math.js](file:///C:/Users/harsh/bentoco/scripts/test-inr-currency-math.js) logged to [log/test-inr-currency-math.txt](file:///C:/Users/harsh/bentoco/log/test-inr-currency-math.txt) (`✅ INR CURRENCY MATH AUDIT PASSED`).
- [x] **Western Tax Engine Gutting**: Built lightweight Indian GST Engine [packages/bentoco/src/utils/indian-gst-engine.ts](file:///C:/Users/harsh/bentoco/packages/bentoco/src/utils/indian-gst-engine.ts) with HSN code support, Intra-state CGST+SGST, and Inter-state IGST calculations in integer Paisa. Executed audit test [scripts/test-indian-gst-engine.js](file:///C:/Users/harsh/bentoco/scripts/test-indian-gst-engine.js) logged to [log/test-indian-gst-engine.txt](file:///C:/Users/harsh/bentoco/log/test-indian-gst-engine.txt) (`✅ INDIAN GST ENGINE AUDIT PASSED`).
- [x] **Western Logistics Gutting**: Built Indian Fulfillment Adapter [packages/bentoco/src/utils/indian-fulfillment-adapter.ts](file:///C:/Users/harsh/bentoco/packages/bentoco/src/utils/indian-fulfillment-adapter.ts) supporting 1-click AWB generation & Pincode serviceability for Shiprocket & Delhivery. Executed audit test [scripts/test-indian-fulfillment.js](file:///C:/Users/harsh/bentoco/scripts/test-indian-fulfillment.js) logged to [log/test-indian-fulfillment.txt](file:///C:/Users/harsh/bentoco/log/test-indian-fulfillment.txt) (`✅ INDIAN FULFILLMENT AUDIT PASSED`).

---

## Phase 2: Multi-Tenancy Engine & PostgreSQL RLS (Completed)
> **Goal:** Transform single-tenant Medusa into a single-database, high-density multi-tenant SaaS platform.

### Tasks:
- [x] **Tenant Schema Migration**: Created the `tenant` table (`id`, `store_name`, `subdomain`, `custom_domain`, `created_at`) and added `tenant_id` UUID foreign keys across core tables (`product`, `order`, `customer`, `cart`, `user`).
- [x] **PostgreSQL Row Level Security (RLS)**: Created and verified RLS policies forcing `WHERE tenant_id = current_setting('app.current_tenant', true)::UUID` bound to application role `bentoco_app` ([0000-tenant-multi-tenancy-rls.sql](file:///C:/Users/harsh/bentoco/packages/bentoco/src/migration-scripts/0000-tenant-multi-tenancy-rls.sql)).
- [x] **ORM Middleware Integration**: Built tenant middleware and transaction-scoped context wrapper [packages/bentoco/src/api/tenant-middleware.ts](file:///C:/Users/harsh/bentoco/packages/bentoco/src/api/tenant-middleware.ts) (`✅ MODULE 3 PASSED`).
- [x] **Subdomain & Domain Edge Resolver**: Built Edge Subdomain & Custom Domain Resolver [packages/bentoco/src/api/edge-tenant-resolver.ts](file:///C:/Users/harsh/bentoco/packages/bentoco/src/api/edge-tenant-resolver.ts) and Next.js Edge Middleware handler [packages/bentoco/src/api/edge-middleware-handler.ts](file:///C:/Users/harsh/bentoco/packages/bentoco/src/api/edge-middleware-handler.ts) (`✅ MODULE 4 PASSED`).
- [x] **BYOG Credentials Adapter**: Built dynamic BYOG payment loader module [packages/bentoco/src/api/byog-payment-loader.ts](file:///C:/Users/harsh/bentoco/packages/bentoco/src/api/byog-payment-loader.ts) (`loadTenantPaymentCredentials` & `saveTenantPaymentCredentials`), bypassing static `.env` keys (`✅ TASK 5.2 PASSED`).
- [x] **Multi-Tenant Security Audit**: Executed automated RLS security test [scripts/test-tenant-rls.js](file:///C:/Users/harsh/bentoco/scripts/test-tenant-rls.js) proving 100% data isolation (`✅ RLS SECURITY AUDIT PASSED`).

---

## Phase 3: Indian Order State Machine & COD OTP Engine (Completed)
> **Goal:** Refactor the order lifecycle for Indian buying patterns (high-risk COD & Prepaid conversion).

### Tasks:
- [x] **State Machine Refactoring**: Extended Order status enums (`ORDER_INITIATED`, `WHATSAPP_VERIFYING`, `COD_VERIFIED`, `PREPAID_FLIPPED`, `AWB_GENERATED`) and created audit trail table `order_state_history` ([0001-indian-order-state-machine-otp.sql](file:///C:/Users/harsh/bentoco/packages/bentoco/src/migration-scripts/0001-indian-order-state-machine-otp.sql)).
- [x] **Native WhatsApp OTP Verification**: Built 4-digit cryptographic OTP generation & verification engine [packages/bentoco/src/utils/indian-order-state-machine.ts](file:///C:/Users/harsh/bentoco/packages/bentoco/src/utils/indian-order-state-machine.ts) (`createOTPSession` & `verifyOTPSession`).
- [x] **Prepaid Flip Engine**: Built `flipOrderToPrepaid` handler converting orders from `WHATSAPP_VERIFYING` → `PREPAID_FLIPPED` upon instant UPI Intent payment.
- [x] **Integration Test Audit**: Executed automated integration test [scripts/test-order-state-machine.js](file:///C:/Users/harsh/bentoco/scripts/test-order-state-machine.js) logged to [log/test-order-state-machine.txt](file:///C:/Users/harsh/bentoco/log/test-order-state-machine.txt) (`✅ PHASE 3 AUDIT PASSED`).

---

## Phase 4: Bring Your Own Gateway (BYOG) & WhatsApp Infrastructure (Completed)
> **Goal:** Enable merchants to connect their own payment gateways and WhatsApp accounts seamlessly.

### Tasks:
- [x] **BYOG Database Module**: Built `tenant_payment_config` table for encrypted storage of merchant-owned Razorpay, Cashfree, and PhonePe API credentials with RLS policies.
- [x] **Dynamic Payment Adapter**: Built dynamic BYOG payment loader module [packages/bentoco/src/api/byog-payment-loader.ts](file:///C:/Users/harsh/bentoco/packages/bentoco/src/api/byog-payment-loader.ts) (`loadTenantPaymentCredentials` & `saveTenantPaymentCredentials`), bypassing static `.env` keys (`✅ TASK 5.2 PASSED`).
- [x] **Hybrid WhatsApp Service Adapter**: Built Evolution API client driver [packages/bentoco/src/utils/evolution-api-client.ts](file:///C:/Users/harsh/bentoco/packages/bentoco/src/utils/evolution-api-client.ts) supporting QR-code Linked Devices, instance provisioning, and automated 4-digit OTP messaging. Executed audit test [scripts/test-evolution-api-client.js](file:///C:/Users/harsh/bentoco/scripts/test-evolution-api-client.js) logged to [log/test-evolution-api-client.txt](file:///C:/Users/harsh/bentoco/log/test-evolution-api-client.txt) (`✅ EVOLUTION API CLIENT AUDIT PASSED`).
- [x] **Mobile UPI Intent Drawer**: Built native UPI Intent payload generator [packages/bentoco/src/utils/mobile-upi-intent.ts](file:///C:/Users/harsh/bentoco/packages/bentoco/src/utils/mobile-upi-intent.ts) supporting instant GPay (`tez://`), PhonePe (`phonepe://`), and Paytm (`paytmmp://`) deep-links + gateway HMAC signature verification. Executed audit test [scripts/test-mobile-upi-intent.js](file:///C:/Users/harsh/bentoco/scripts/test-mobile-upi-intent.js) logged to [log/test-mobile-upi-intent.txt](file:///C:/Users/harsh/bentoco/log/test-mobile-upi-intent.txt) (`✅ MOBILE UPI INTENT AUDIT PASSED`).
- [x] **Prepaid Communications Wallet**: Built `tenant_wallet` & `tenant_wallet_ledger` tables ([0002-communications-wallet.sql](file:///C:/Users/harsh/bentoco/packages/bentoco/src/migration-scripts/0002-communications-wallet.sql)) and credit service [packages/bentoco/src/utils/communications-wallet.ts](file:///C:/Users/harsh/bentoco/packages/bentoco/src/utils/communications-wallet.ts) (`topupWalletBalance` & `deductWalletBalance`). Executed audit test [scripts/test-communications-wallet.js](file:///C:/Users/harsh/bentoco/scripts/test-communications-wallet.js) logged to [log/test-communications-wallet.txt](file:///C:/Users/harsh/bentoco/log/test-communications-wallet.txt) (`✅ PHASE 4 AUDIT PASSED`).

---

## Phase 5: Bentoco Admin Dashboard (Agency & Merchant Dual-Mode Engine) (Active)
> **Goal:** Refactor the Medusa Admin Dashboard (`packages/admin/dashboard`) to support Agency Mode (`agency.bentoco.com`) vs. Merchant Mode (`app.bentoco.com`), client store switching, scoped RBAC, store ownership transfers, and per-active-site agency billing.

### Tasks:
- [ ] **Dual Operational Modes & Router**: Mode resolution middleware separating `agency.bentoco.com` (Agency Mode) from `app.bentoco.com` (Merchant Mode). Completely purge/hide Agency modules in Merchant Mode.
- [ ] **Agency Multi-Store Dashboard & Client Store Switcher**: Roster view of all managed client stores with 1-click header tenant switching.
- [ ] **Scoped RBAC Engine**: Dual-level RBAC (`AGENCY_OWNER` / `AGENCY_MEMBER` vs. `STORE_OWNER` / `STORE_STAFF`).
- [ ] **Centralized Per-Active-Site Billing Engine**: Single-site subscription for merchants vs. centralized per-active-site metered invoicing for agencies.
- [ ] **Exclusive Store Ownership Transfer Engine**: Enforce DB constraint that a store exists strictly in Agency Mode OR Merchant Mode (never both), supporting mutual transfer handoffs (Agency ──► Merchant or Merchant ──► Agency).

---

## Phase 6: High-Performance Next.js Storefront & Theme Engine
> **Goal:** Deliver sub-1-second mobile storefronts optimized for Indian 4G networks.

### Tasks:
- [ ] **Core Page Templates**: Build 4-5 hyper-optimized Vercel-inspired page layouts (Hero, Product Catalog, Product Detail, Cart Drawer, Checkout Sheet).
- [ ] **YAML-to-CSS `DESIGN.md` Compiler**: Build a deterministic design token compiler mapping YAML config files to CSS root variables for instant 1-click theme swaps.
- [ ] **Vibe Presets**: Implement pre-built visual presets (Cyber-Brutalist, Warm Minimalist, Editorial Luxury).
- [ ] **Custom Domain & SSL Manager**: Integrate automated Cloudflare/Vercel CNAME mapping and SSL certificate provisioning.

---

## Phase 7: Native Conversion Apps & Logistics Integrations
> **Goal:** Replace third-party Shopify apps with native, zero-bloat platform features.

### Tasks:
- [ ] **Logistics Integrations**: Build native 1-click AWB generation and shipping label printing for **Shiprocket** and **Delhivery**.
- [ ] **Pincode Serviceability & Smart Address**: Native widget validating delivery timelines and COD availability, plus automatic City/State autofill on typing 6-digit Pincode.
- [ ] **WhatsApp Photo Reviews**: Post-delivery automated WhatsApp ping requesting rating & photo, rendering directly on product pages.
- [ ] **Native RTO & Self-Serve Returns**: Customer-facing exchange/returns portal with image upload.
- [ ] **In-Cart Bumps & Upsells**: One-click order add-ons and post-checkout upsell modals.
- [ ] **Automated GST Invoicing**: Tax-compliant PDF invoice generator with HSN codes.

---

## Phase 8: Production Hardening & Launch
> **Goal:** Ensure platform reliability, load testing, and developer documentation.

### Tasks:
- [x] **Multi-Tenant Security Audit**: Ran security benchmarks verifying complete data isolation under RLS across all tables ([scripts/test-tenant-rls.js](file:///C:/Users/harsh/bentoco/scripts/test-tenant-rls.js)).
- [ ] **Load & Latency Benchmarks**: Test storefront rendering under simulated high-latency Indian 4G network profiles.
- [ ] **1-Click Shopify CSV Catalog Importer**: Test importing product catalogs, variants, images, and prices directly from Shopify CSV exports.
- [ ] **Merchant Onboarding Flow**: Build dashboard signup and store creation wizard.

---

## Timeline & Milestones Summary

```mermaid
gantt
    title Bentoco Engineering Roadmap Progress
    dateFormat  YYYY-MM-DD
    section Core Infrastructure
    Phase 1: Cleanup & Detachment      :done, a1, 2026-08-01, 7d
    Phase 2: Multi-Tenancy & RLS       :done, a2, after a1, 14d
    section Commerce Core
    Phase 3: Order State Machine & COD  :done, a3, after a2, 10d
    Phase 4: BYOG & WhatsApp Engine     :done, a4, after a3, 12d
    section Admin UI & Storefront
    Phase 5: Admin Dashboard & Dual-Mode:active, a5, after a4, 14d
    Phase 6: Next.js & Theme Compiler  :a6, after a5, 14d
    Phase 7: Logistics & Native Apps   :a7, after a6, 14d
    section Hardening
    Phase 8: Hardening & Launch         :a8, after a7, 7d
```
