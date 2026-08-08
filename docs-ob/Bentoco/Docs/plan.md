# Bentoco Shipping Plan — MVO → MVP → V1

**Source of truth for scope:** [Bentoco Feature Lists.md](./Bentoco%20Feature%20Lists.md)  
**Architecture context:** [Bentoco product spec.md](./Bentoco%20product%20spec.md), [Bentoco roadmap.md](./Bentoco%20roadmap.md)  
**Gap detail:** [comparison.md](./comparison.md)

---

## Purpose

This plan defines **what we ship when**, so agency/admin side-quests do not keep expanding while the **main product** (sell → pay → fulfill in India) stays unfinished.

| Stage | Meaning | Merchant outcome |
| :--- | :--- | :--- |
| **MVO** | Minimum Viable **Offer** — thinnest thing you can charge for | A brand can run a **real Indian store**: catalog → cart → UPI/COD → order visible in admin |
| **MVP** | Minimum Viable **Product** — feature list “core lines” | Full Bharat loop: theme, domain, GST invoice, WhatsApp, Shiprocket/Delhivery, guest checkout, promos, Meta CAPI |
| **V1** | First **growth** release — “apps we need” | Native conversion/logistics widgets that replace Shopify app bloat |

**Agency dual-mode** is **parked (done-for-now)** after smoke. Not in MVO. Soft dependency for MVP only if multi-store agencies are the first GTM wedge.

---

## North star (one sentence)

**A solo Indian D2C operator can go live on a fast mobile storefront, take UPI + verified COD, message buyers on WhatsApp, and ship via Shiprocket/Delhivery — without stacking apps.**

---

## Stage 0 — Freeze & focus (now)

| Action | Status |
| :--- | :--- |
| Agency smoke (invite, NEW→Active, Open store, revoke) | Done — freeze |
| No new agency features unless production fire | Rule |
| Main product work only on Medusa commerce path | Rule |

---

## MVO — Ship first (main product)

**Goal:** One tenant can sell end-to-end on Bentoco admin + a usable storefront shell.

### In scope (must work in production-like local/staging)

| # | Feature (from list / product need) | Notes |
| :---: | :--- | :--- |
| M1 | **1-Screen Catalog Manager** | Variants, stock, images (WebP later if needed) |
| M2 | **Guest checkout** | Name, phone, address, pincode |
| M3 | **BYOG payment (at least Razorpay)** | Tenant credentials → take prepaid |
| M4 | **1-Click UPI Intent** | GPay / PhonePe / Paytm deep links on mobile |
| M5 | **COD + WhatsApp/SMS 4-digit OTP** | No COD without verify |
| M6 | **Indian order states (core path)** | Initiated → verifying → COD verified / prepaid → ready to ship |
| M7 | **Merchant admin ops home** | Sales, pending COD, dispatched, returns (even if simple lists) |
| M8 | **Tenant isolation** | RLS / tenant context already started — must hold for live data |
| M9 | **Storefront: Catalog + PDP + Cart + Checkout** | 4 pages minimum; can be one “vibe”, not 3 presets yet |

### Explicitly out of MVO

- Custom domain / Cloudflare SSL  
- Full Evolution QR onboarding polish  
- Abandoned cart automation  
- Shiprocket/Delhivery 1-click AWB (can stub status)  
- GST PDF invoices  
- Meta CAPI  
- Promo engine (use simple manual discounts if needed)  
- All V1 “apps”  
- Agency expansion  

### MVO exit criteria

- [ ] Create products + variants in admin  
- [ ] Guest places **prepaid UPI** order on mobile  
- [ ] Guest places **COD** order only after OTP pass  
- [ ] Order appears correctly in merchant admin with Indian status  
- [ ] Second tenant cannot see first tenant’s data  

**Rough effort after agency freeze:** 3–6 weeks focused engineering (depends on how much of Phases 3–4 is only unit-tested vs wired to UI).

---

## MVP — Full feature-list core

**Goal:** Everything in the **first block** of [Bentoco Feature Lists.md](./Bentoco%20Feature%20Lists.md) is shippable.

| Theme | Features |
| :--- | :--- |
| **Storefront & theme** | 4–5 page structures; DESIGN.md YAML→CSS; Vibe Presets (3); sub-1s SSG/edge story |
| **Identity** | Custom domain + SSL automation |
| **Payments** | BYOG Razorpay + Cashfree + PhonePe; UPI Intent |
| **Checkout** | Guest checkout; COD OTP |
| **Logistics** | Shiprocket + Delhivery AWB + labels |
| **Tax** | GST-compliant PDF invoice + HSN |
| **WhatsApp** | Evolution + QR Linked Devices; wallet; order/dispatch/OFD; abandoned cart 30m |
| **Admin** | 1-screen catalog; Shopify CSV import; ops dashboard |
| **Growth** | Meta CAPI + Pixel; promo engine (% / flat / free shipping) |

### MVP exit criteria

- [ ] Merchant onboards, themes, domain (or subdomain go-live)  
- [ ] Full money path + COD OTP + GST invoice  
- [ ] WhatsApp messages fire on real order events (wallet deducts)  
- [ ] AWB generated for a test Shiprocket/Delhivery sandbox  
- [ ] Promo code applies at checkout  
- [ ] Shopify CSV import lands a usable catalog  

**Rough effort:** 2–3 months after MVO (parallel storefront + integrations).

---

## V1 — Native “apps” (second block of feature list)

**Goal:** Kill the Shopify app tax with built-ins.

| # | Feature |
| :---: | :--- |
| V1 | Pincode serviceability + COD availability widget |
| V2 | Smart address auto-complete (pincode → city/state) |
| V3 | WhatsApp photo reviews |
| V4 | Floating WhatsApp support widget |
| V5 | Post-purchase upsell modal |
| V6 | In-cart order bumps |
| V7 | RTO & returns portal (self-serve) |
| V8 | Dynamic size charts |
| V9 | Sticky mobile Add to Cart bar |
| V10 | Meta/Google catalog XML feeds |
| V11 | Micro-affiliate link generator |
| V12 | Real-time scarcity badges (inventory-linked) |

### V1 exit criteria

- [ ] Each item works on the live storefront + admin config  
- [ ] No dependency on third-party “app store” for these twelve  

**Rough effort:** 1.5–2.5 months after MVP (can start high-ROI items earlier: pincode, sticky ATC, bumps).

---

## Suggested execution order (main product only)

```text
NOW
  └─ MVO: Catalog + Checkout + UPI + COD OTP + Order admin + Storefront 4 pages
THEN
  └─ MVP: Theme/DESIGN.md + Domain + Shiprocket/Delhivery + GST PDF
           + WhatsApp (tx + abandoned) + Wallet + Shopify import + Promos + Meta CAPI
THEN
  └─ V1: Conversion widgets (pincode, sticky ATC, bumps, upsell, returns, reviews…)
LATER / PARALLEL (light)
  └─ Agency v1 only if GTM requires multi-store agencies
```

### Recommended sprint themes (example)

| Sprint focus | Stage |
| :--- | :--- |
| Wire storefront cart/checkout to Medusa APIs + tenant | MVO |
| Razorpay BYOG + UPI intent drawer | MVO |
| COD OTP + order state transitions in admin | MVO |
| Merchant ops dashboard (real order lists) | MVO |
| DESIGN.md + one vibe + SSG baseline | MVP |
| Shiprocket AWB + pincode serviceability | MVP → V1 overlap |
| Evolution WhatsApp + wallet deduct on events | MVP |
| GST invoice PDF | MVP |
| Conversion pack (bumps, sticky ATC, upsell) | V1 |

---

## What we already have (do not rebuild)

From roadmap + monorepo (treat as **foundation**, not finished product UI):

| Layer | State |
| :--- | :--- |
| Medusa 2 commerce core (product, cart, order, payment, promo modules) | Present (upstream fork) |
| INR/paisa math, GST engine utils | Present (audited scripts) |
| Multi-tenant schema + RLS scripts | Present |
| Order state machine + OTP utils | Present |
| BYOG loader, UPI intent utils, Evolution client, wallet | Present |
| Admin dual-mode + agency invite/Open store | **Parked / smoke-passed** |

**Gap:** most of the above is **engine + tests**, not a polished **merchant-facing path** (storefront + admin workflows). MVO is about **wiring and productizing** that engine.

---

## Rules of engagement

1. **Main product tickets only** until MVO exit criteria pass.  
2. Agency: fix fire only; no new features.  
3. Prefer **vertical slice** (one order end-to-end) over horizontal polish.  
4. Every feature maps to a row in [comparison.md](./comparison.md).  
5. If a ticket is not in MVO/MVP/V1 tables, it is **out of scope**.

---

## Success metrics (lightweight)

| Stage | Metric |
| :--- | :--- |
| MVO | 1 internal brand takes a real sandbox UPI + COD order |
| MVP | 3 pilot merchants go live on subdomain (or domain) |
| V1 | App replacement list: 5 of 12 live on production |

---

## Document owners

| Doc | Use |
| :--- | :--- |
| **plan.md** (this file) | What we ship when |
| **comparison.md** | Medusa today vs Bentoco target |
| **Bentoco Feature Lists.md** | Feature inventory |
| **Bentoco roadmap.md** | Historical phase checklist (infra) |
