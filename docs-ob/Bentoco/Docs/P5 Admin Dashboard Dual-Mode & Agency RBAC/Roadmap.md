# Sub-Roadmap: Phase 5 — Bentoco Admin Dashboard (Agency & Merchant Dual-Mode Engine)

This document details the architectural plan for the **Bentoco Admin Dashboard**, introducing **Agency Mode** vs. **Merchant Mode**, scoped RBAC, multi-store project switching, UID-based store transfers, and centralized per-active-site agency billing.

---

## Dual Operational Modes & Exclusive Store Ownership Architecture

```
                               ┌────────────────────────────────┐
                               │   Bentoco Platform Auth Gate   │
                               └───────────────┬────────────────┘
                                               │
                      ┌────────────────────────┴────────────────────────┐
                      ▼                                                 ▼
             [ AGENCY MODE ]                                   [ MERCHANT MODE ]
      (Subdomain: agency.bentoco.com)                    (Subdomain: app.bentoco.com)
                      │                                                 │
   ┌──────────────────┴──────────────────┐                              │
   ▼                                     ▼                              ▼
[ Agency Master Dashboard ]    [ Client Store Switcher ]   [ Single Store Admin Panel ]
- Centralized Per-Site Billing  - Jump to Store Admin       - Product & Order Mgmt
- Team Member RBAC              - Scoped Agency Roles       - Merchant Staff RBAC
- Client Project Roster                                     - (Agency Module Hidden)
                      │                                                 │
                      └─────────────► [ 1-CLICK UNIQUE UID ] ◄──────────┘
                                      STORE TRANSFER ENGINE
                                 (Handshake via Unique Agency UID:
                                  `agency_id` & `ownership_status`)
```

---

## Detailed Module Breakdown

### Module 1: Dual Operational Modes & Router
- [ ] **1.1 Mode Resolution Middleware & Domain Binding**
  - Bind `agency.bentoco.com` → **Agency Mode** UI router.
  - Bind `app.bentoco.com` or `*.bentoco.com/admin` → **Merchant Mode** UI router.
- [ ] **1.2 Mode Context Provider (`BentocoModeContext`)**
  - Inject `mode: "agency" | "merchant"` across the admin UI state.
  - In Merchant Mode, completely purge/hide the Agency navigation menu and settings modules.

---

### Module 2: Agency Multi-Store Dashboard & Client Store Switcher
- [ ] **2.1 Agency Master Roster View**
  - Multi-store card overview displaying all managed client stores, live status, monthly GMV, and order volume.
- [ ] **2.2 Fast Client Store Context Switcher**
  - 1-click header dropdown to switch active tenant context (`app.current_tenant`) from store A to store B without re-authenticating.

---

### Module 3: Scoped Role-Based Access Control (RBAC Engine)
- [ ] **3.1 Agency RBAC Hierarchy**
  - `AGENCY_OWNER`: Full control over billing, client stores, team invitations, and agency settings.
  - `AGENCY_MEMBER`: Assigned access to specific client store project admin panels; no access to agency billing.
- [ ] **3.2 Merchant RBAC Hierarchy**
  - `STORE_OWNER`: Full control over single store settings, BYOG payment keys, staff, and orders.
  - `STORE_STAFF`: Limited access (Order Fulfillment, Product Catalog editing).
  - Enforce zero visibility of Agency features in Merchant RBAC mode.

---

### Module 4: Centralized Per-Active-Site Billing Engine
- [ ] **4.1 Merchant Single-Site Subscription**
  - Individual merchants pay for 1 active site plan.
- [ ] **4.2 Agency Centralized Multi-Site Metering**
  - Aggregates all active live client stores under the Agency's primary card/billing account.
  - Itemized per-active-site invoicing with bulk tier discounts.

---

### Module 5: 1-Click Unique UID Store Transfer & Delegation Engine
- [ ] **5.1 Database Schema Extensions (`agency_id` & `ownership_status`)**
  - Add `agency_id` UUID (nullable FK) to `tenant` table.
  - Add `ownership_status` enum (`'INDEPENDENT_MERCHANT'`, `'AGENCY_MANAGED'`, `'TRANSFER_PENDING'`).
  - Add `transfer_code_hash` and `transfer_expires_at` columns.

- [ ] **5.2 Merchant ──► Agency Delegation (UID Handshake)**
  - Merchant enters Agency Unique UID (`AGENCY-UID-XXXX`) in Store Settings.
  - System generates a 6-digit confirmation code.
  - Merchant approves transfer → backend updates `agency_id = 'AGENCY-UID-XXXX'` and `ownership_status = 'AGENCY_MANAGED'`.
  - Automatically grants agency team members management privileges for the store.

- [ ] **5.3 Agency ──► Merchant Ownership Handoff**
  - Agency clicks "Transfer Ownership Back to Merchant" in `agency.bentoco.com/[store_id]`.
  - Client merchant accepts handoff and adds payment method.
  - Backend resets `agency_id = NULL` and `ownership_status = 'INDEPENDENT_MERCHANT'`.
