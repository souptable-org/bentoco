# Bentoco MVP Execution Plan & Architecture Spec

**Date:** 2026-08-05  
**Stage:** Minimum Viable Product (MVP)  
**Status:** PLAN DEFINITION & ARCHITECTURE UPDATE  

---

## 1. Architectural Core Shift: Multi-Tenant Storefront Engine

### The Problem with Single-Store Deployments
Deploying a separate Next.js container/instance for each merchant is cost-prohibitive ($15–$25/mo per merchant) and creates deployment bottlenecks when rolling out platform-wide updates.

### The Shopify / SupaStatic Solution: Unified Edge Storefront
Bentoco uses a **single unified Storefront Engine** running on a shared cluster that serves all merchant subdomains (`tenant-a.bentoco.com`, `tenant-b.bentoco.com`) and custom domains (`store.com`).

```
                    ┌────────────────────────┐
                    │  Incoming Web Traffic  │
                    └───────────┬────────────┘
                                │
          ┌─────────────────────┴─────────────────────┐
          ▼                                           ▼
http://alpha.bentoco.com                    http://beta.bentoco.com
          │                                           │
          └─────────────────────┬─────────────────────┘
                                │
                                ▼
              ┌───────────────────────────────────┐
              │  Unified Storefront Middleware    │
              │  (Extracts Host -> Tenant Context)│
              └─────────────────┬─────────────────┘
                                │
              ┌─────────────────┴─────────────────┐
              ▼                                   ▼
    Tenant: "alpha-id"                   Tenant: "beta-id"
    Fetch Theme & Products               Fetch Theme & Products
    from Medusa API (:9000)              from Medusa API (:9000)
              │                                   │
              ▼                                   ▼
    Render Alpha Storefront              Render Beta Storefront
```

---

## 2. MVP Work Packages (WP-1 through WP-6)

### WP-1: Multi-Tenant Wildcard Domain Middleware & Tenant Context
- **Goal:** Implement Next.js middleware (`apps/storefront/middleware.ts`) to intercept incoming domain/subdomain headers (`Host`).
- **Functionality:**
  - Extract tenant identifier or custom domain mapping.
  - Automatically append `x-tenant-id` header to all Medusa Store API calls (`medusaFetch`).
  - Cache tenant domain mappings in-memory / Redis for sub-millisecond lookups.

### WP-2: Dynamic Multi-Tenant Theme & Layout Engine
- **Goal:** Allow merchants to control their storefront layout and visual appearance directly from the Merchant Admin Dashboard without touching code.
- **Functionality:**
  - Define `theme_config` JSON schema (Color palettes, Google Fonts typography, Hero banners, Announcement bars, Product Grid layouts).
  - Add **Theme Customizer UI** under Admin Settings (`/settings/theme`).
  - Render storefront sections dynamically using modular theme components.

### WP-3: Shiprocket & Delhivery Logistics AWB Integration
- **Goal:** Automated Air Waybill (AWB) generation and automated fulfillment dispatch.
- **Functionality:**
  - Sync order weight/pincode with Shiprocket & Delhivery APIs.
  - Auto-generate AWB tracking numbers and printable shipping labels from the Admin Orders page.
  - Update Indian order status state machine to `AWB_GENERATED` & `DISPATCHED`.

### WP-4: Automated WhatsApp Gateway (OTP & Abandoned Cart)
- **Goal:** Production-ready WhatsApp integration for verification and cart recovery.
- **Functionality:**
  - Connect `evolution-api-client` to live WhatsApp Business API instance.
  - Dispatch 4-digit COD verification OTPs directly to customer WhatsApp numbers.
  - Trigger automated WhatsApp reminders for carts left uncompleted after 30 minutes.

### WP-5: GST-Compliant PDF Invoice Generator
- **Goal:** One-click GST tax invoice generation.
- **Functionality:**
  - Generate GST invoices with CGST, SGST, IGST breakdown, HSN/SAC codes, and seller GSTIN.
  - Provide PDF download links on the merchant order detail page and customer confirmation screen.

### WP-6: Cashfree Payment Gateway Integration
- **Goal:** Secondary Indian online payment gateway provider.
- **Functionality:**
  - Implement Cashfree BYOK handler in `tenant_payment_config`.
  - Add Cashfree checkout option to storefront checkout page.

---

## 3. Execution Roadmap Order

1. **Phase 1 (Foundation):** WP-1 (Wildcard Tenant Middleware) + WP-2 (Dynamic Theme Engine)
2. **Phase 2 (Logistics & Invoicing):** WP-3 (Shiprocket AWB) + WP-5 (GST PDF Invoices)
3. **Phase 3 (Growth & Recovery):** WP-4 (WhatsApp Production Gateway) + WP-6 (Cashfree Payment Provider)
