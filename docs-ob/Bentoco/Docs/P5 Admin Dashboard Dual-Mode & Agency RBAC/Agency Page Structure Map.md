# Bentoco Agency Dashboard (`agency.bentoco.com`) — Page Structure Map

This document outlines the complete page routing hierarchy, layout structure, and interactive screens for **`agency.bentoco.com`**, the centralized multi-store management portal for agencies and D2C brand aggregators.

---

## Exclusive Store Ownership & Ownership Transfer Principle
> **Rule:** A store MUST be in either **Agency Mode** OR **Independent Merchant Mode** — it CANNOT be in both simultaneously.
> - **Agency Mode**: Billed under the Agency's centralized multi-site invoice; manageable by assigned agency team members.
> - **Independent Merchant Mode**: Billed directly to the merchant's credit card; managed solely by the merchant store owner.

---

## Complete Route Hierarchy & Screen Map

```
agency.bentoco.com
│
├── 📊 / (Agency Overview Dashboard)
│   ├── Metric Cards: Total Client Stores, Combined Monthly GMV, Active Live Sites, Centralized Billing
│   ├── Quick Store Switcher Grid (Filter by Active, Staging, Suspended)
│   └── Recent Activity Feed (New Client Stores Created, Staff Assigned, Billing Invoices)
│
├── 🏬 /stores (Client Store Management)
│   ├── /stores/list (Full Filterable Table of Managed Client Stores)
│   ├── /stores/new (1-Click Client Store Provisioning Wizard)
│   │   ├── Step 1: Store Name & Subdomain Assignment (`clientbrand.bentoco.com`)
│   │   ├── Step 2: Assign Agency Team Members & Store Owner Email
│   │   └── Step 3: Select Plan & Launch Staging
│   └── /stores/[store_id] (Store Details & Ownership Controls)
│       ├── Quick Jump Action: "Launch Store Admin" ──► Redirects to app.bentoco.com/[store_id]
│       ├── 🔄 /stores/[store_id]/transfer (Store Ownership Transfer Handoff)
│       │   ├── Agency ──► Independent Merchant Handoff (Transfers store ownership & billing to Client Merchant Email)
│       │   └── Independent Merchant ──► Agency Adoption (Accepts store transfer request from Merchant)
│       └── Assigned Agency Team Scopes & Access Logs
│
├── 👥 /team (Agency Staff & RBAC Management)
│   ├── /team/members (Agency Staff List & Store Assignment Scopes)
│   │   ├── Member Detail Drawer: View assigned stores & permission levels
│   │   └── Revoke Access / Transfer Ownership Actions
│   ├── /team/invite (Invite Agency Team Member Modal)
│   │   └── Assign Role (`AGENCY_OWNER` or `AGENCY_MEMBER`) + Select Allowed Client Stores
│   └── /team/roles (Agency RBAC Custom Role Builder)
│       ├── `AGENCY_OWNER`: Full billing, store creation, team management, white-label settings
│       └── `AGENCY_MEMBER`: Access assigned client store admin panels only (No billing/team access)
│
├── 💳 /billing (Centralized Multi-Site Billing & Invoicing)
│   ├── /billing/overview (Active Sites Metered Billing Breakdown)
│   │   ├── Per-Active-Site Monthly Metering ($XX / live store / month)
│   │   ├── Tiered Volume Discounts (e.g. 5+ stores = 15% discount, 20+ stores = 30% discount)
│   │   └── Next Billing Cycle Estimate & Invoice History PDF Downloads
│   ├── /billing/payment-methods (Agency Corporate Credit Card / Auto-Debit Settings)
│   └── /billing/communications-wallet (Centralized WhatsApp Communications Credit Pool)
│
├── ⚙️ /settings (Agency Settings & White-label Customization)
│   ├── /settings/profile (Agency Name, Logo, Contact Details, Domain Settings)
│   ├── /settings/white-label (Custom Agency Subdomain & Co-Branded Admin Options)
│   └── /settings/api-keys (Agency Master Developer API Keys & Webhook Subscriptions)
│
└── 🔐 /auth (Agency Authentication & Onboarding)
    ├── /auth/login (Agency Login Screen)
    ├── /auth/register (Agency Account Creation Wizard)
    └── /auth/accept-invite (Agency Staff Invitation Acceptance Page)
```
