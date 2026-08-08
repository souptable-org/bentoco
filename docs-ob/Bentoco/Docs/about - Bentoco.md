

> **The High-Density, Multi-Tenant E-Commerce Engine for Bharat.**
> 
> Engineered for extreme velocity, sub-second edge performance, zero transaction fees, and native Indian payment & logistics pipelines.

## 🍱 Overview

**bentoco** is a multi-tenant e-commerce platform built as a performance-hard-fork of the Medusa 2.0 core engine.

While legacy Western e-commerce platforms assume single-tenant databases, credit-card-first checkouts, and heavy tax infrastructure, **bentoco** is purpose-built for the realities of modern commerce in India: high Cash-on-Delivery (COD) volume, steep Return-to-Origin (RTO) costs, WhatsApp-first customer engagement, and low-margin merchant operations.

By stripping out Western bloat and embedding **PostgreSQL Row Level Security (RLS)** directly into the schema layer, **bentoco** delivers single-database high-density multi-tenancy—allowing thousands of distinct storefronts to run safely on a single ultra-lean engine.

## ⚡ Core Pillars

### 1. High-Density Multi-Tenancy (Row Level Security)

- **Single Database, Isolated Tenants:** Every core database table (`products`, `orders`, `customers`, `carts`) is bound to a `tenant_id`.
    
- **Database-Level Protection:** Multi-tenancy is enforced at the PostgreSQL layer using native Row Level Security (RLS). Even if an API route fails to filter by tenant, the database kernel refuses cross-tenant data leaks.
    
- **Edge Tenant Resolution:** Next.js Edge Middleware resolves subdomains or custom domains directly to tenant contexts in milliseconds.
    

### 2. Native "Pre-Paid Flip" & COD State Machine

- **WhatsApp OTP Verification:** Integrates directly with the WhatsApp Evolution API / Baileys pipeline to verify COD orders before inventory is locked.
    
- **Automated RTO Defense:** Pauses unverified orders in a `PENDING_WHATSAPP_OTP` state to eliminate ghost orders and dramatically decrease shipping losses.
    
- **Pre-Paid Incentive Engine:** Automatically offers buyers dynamic UPI discount triggers during WhatsApp confirmation to flip high-risk COD orders into non-refundable prepaid transactions.
    

### 3. Bring Your Own Gateway (0% Platform Fee)

- **Dynamic Provider Credentials:** Replaces hardcoded single-store payment keys with tenant-level encrypted payment configurations.
    
- **UPI-First Native Flows:** Native integrations for **Razorpay**, **PhonePe**, and **BillDesk** with UPI Intent support, bypassing standard multi-currency credit card overhead.
    

### 4. Brutalist, Sub-Second Storefronts

- **Vercel-Inspired Design System:** Frontend presets built on recursive 1px border grids, high-contrast monochrome tones, and monospaced typography accents.
    
- **Edge-Rendered Next.js App Router:** Incremental Static Regeneration (ISR) and Partial Prerendering (PPR) deliver storefront page loads in under 300ms.
    

## 🏗️ Architecture Stack

Plaintext

```
                       [ Merchant Custom Domains / Subdomains ]
                                          │
                                          ▼
                             [ Next.js Edge Middleware ]
                             (Tenant Context Resolution)
                                          │
                  ┌───────────────────────┴───────────────────────┐
                  ▼                                               ▼
     [ Merchant Dashboard ]                            [ Consumer Storefront ]
        (React / Vite UI)                                (Next.js App Router)
                  │                                               │
                  └───────────────────────┬───────────────────────┘
                                          ▼
                               [ bentoco Core Engine ]
                           (Node.js / Hard-Forked API)
                                          │
                  ┌───────────────────────┼───────────────────────┐
                  ▼                       ▼                       ▼
          [ PostgreSQL + RLS ]     [ Evolution API ]      [ Razorpay / PhonePe ]
           (Isolated Tenants)     (WhatsApp Engine)         (Native UPI SDKs)
```

|**Layer**|**Technology**|**Role**|
|---|---|---|
|**Engine Core**|Node.js / TypeScript|Modified Medusa 2.0 workspace monorepo|
|**Database**|PostgreSQL + RLS|Isolated multi-tenant storage with row-level policies|
|**Merchant Admin**|React / Vite|High-density operational dashboard served at `/app`|
|**Consumer Frontend**|Next.js (App Router)|Edge-rendered, brutalist-styled storefronts|
|**Communication**|Evolution API|Native WhatsApp OTP verification and notification pipeline|
|**Logistics**|Shiprocket / Delhivery API|Direct shipping carrier integrations|

## 🔄 The bentoco Order State Machine

Standard e-commerce engines enforce a linear `Cart ➔ Payment ➔ Order Placed` pipeline. **bentoco** rewrites the order lifecycle to protect Indian merchants from RTO friction:

Plaintext

```
[ Cart Submitted ]
       │
       ▼
[ ORDER_INITIATED ] ────► (Trigger Evolution API) ────► [ WHATSAPP_VERIFYING ]
                                                                │
                      ┌─────────────────────────────────────────┴─────────────────────────────────────────┐
                      ▼                                                                                   ▼
           (Customer Chooses UPI)                                                             (Customer Confirms COD)
                      │                                                                                   │
                      ▼                                                                                   ▼
             [ PREPAID_FLIPPED ]                                                                  [ COD_VERIFIED ]
                      │                                                                                   │
                      └─────────────────────────────────────────┬─────────────────────────────────────────┘
                                                                ▼
                                                       [ AWB_GENERATED ]
```

## 📁 Repository Structure

Plaintext

```
bentoco/
├── apps/
│   └── backend/             # Bootable API server (Port 9000)
├── packages/
│   ├── core/                # Hard-forked core engine & Drizzle models
│   │   ├── core-flows/      # Order, Cart, and Fulfillment state machines
│   │   └── types/           # Multi-tenant TypeScript interfaces
│   └── modules/             # Stripped providers (Payment, Auth, Storage)
├── about.md                 # System architecture overview
└── package.json             # Root Turborepo workspace configuration
```

## 🛡️ License & Ownership

Developed and maintained by **Klover Studios**. Proprietary multi-tenant architecture build. All rights reserved.