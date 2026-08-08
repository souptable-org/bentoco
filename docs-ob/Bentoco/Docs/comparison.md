# Bentoco vs Medusa — Where We Need to Be vs Where We Are

**Feature inventory:** [Bentoco Feature Lists.md](./Bentoco%20Feature%20Lists.md)  
**Ship plan:** [plan.md](./plan.md)

---

## How to read this

| Column | Meaning |
| :--- | :--- |
| **Target (Bentoco)** | What the feature list / product requires |
| **Medusa 2 (upstream / fork base)** | What generic Medusa gives out of the box |
| **Bentoco now** | What exists in *this* monorepo today (honest) |
| **Gap** | What still has to be built or productized |
| **Stage** | MVO / MVP / V1 / Parked |

### Status keys (Bentoco now)

| Key | Meaning |
| :--- | :--- |
| **None** | Not present as a product feature |
| **Engine** | Utils / migrations / scripts / unit-style audits — not a full merchant path |
| **Partial** | Some UI or API, incomplete path |
| **Ready** | Smokeable end-to-end for intended use |
| **Parked** | Agency dual-mode: freeze after smoke |

---

## Summary scoreboard

| Area | Medusa base | Bentoco need | Bentoco now (rough) |
| :--- | :---: | :---: | :---: |
| Generic commerce (catalog, cart, order, promo, payment plugins) | Strong | Required | Strong (fork) |
| Multi-tenant SaaS (single DB + RLS) | Weak / DIY | Required | Engine–Partial |
| Indian payments (UPI intent, BYOG Razorpay/Cashfree/PhonePe) | Weak (plugins DIY) | Required | Engine |
| COD + WhatsApp OTP order flow | None | Required | Engine |
| India logistics (Shiprocket / Delhivery) | None | Required | Engine |
| GST invoices | None (Western tax) | Required | Engine (math) |
| WhatsApp commerce (Evolution, wallet, abandoned) | None | Required | Engine |
| Fast themed storefront (SSG + DESIGN.md) | Not core (Next starter separate) | Required | None–Partial |
| Conversion “apps” (reviews, bumps, affiliates…) | App ecosystem DIY | V1 | None |
| Agency multi-store admin | None | Soft GTM | Parked / Ready enough |

**Bottom line:** Medusa is a **strong commerce kernel**. Bentoco’s differentiator is **India + density + native apps**. Most differentiators are still **engine-level**, not **merchant-complete**. That is why MVO = wire the kernel + India money path first.

---

## A. Platform foundation

| Feature | Target (Bentoco) | Medusa 2 now | Bentoco now | Gap | Stage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Product / variant catalog APIs | Full | **Strong** | **Strong** (modules) | Productize “1-screen” admin UX | MVO |
| Cart + checkout APIs | Full | **Strong** | **Strong** | Guest India fields, pincode | MVO |
| Orders + fulfillments framework | Full | **Strong** | **Strong** | Indian states + COD gates | MVO |
| Promotions / discounts | % flat free-ship | **Strong** | **Strong** | Wire to India storefront | MVP |
| Multi-currency / Western tax / FedEx-style carriers | Strip / replace | Present (generic) | Partially gutted + GST utils | Finish INR-only product stance | MVP |
| Multi-tenancy (tenant_id + RLS) | Single DB SaaS | Not built-in | **Engine** (migrations, middleware, tests) | Enforce on all live routes + admin | MVO |
| Subdomain / custom domain resolver | Edge map + SSL | DIY | **Engine** (edge resolver) | Cloudflare/Vercel SSL automation | MVP |
| Dual-mode Agency vs Merchant admin | Required for agency GTM | None | **Parked / Ready** (smoke) | Freeze; v1 later | Parked |

---

## B. Feature list — core MVP lines

| Feature | Target (Bentoco) | Medusa 2 now | Bentoco now | Gap | Stage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 4–5 storefront pages (Hero, Catalog, PDP, Cart, Checkout) | Ship | Starter storefronts exist **outside** core | **None–Partial** (no Bentoco SSG product yet) | Build Next storefront against APIs | MVO |
| DESIGN.md YAML → CSS token compiler | 1-click themes | None | **None** | Compiler + admin apply | MVP |
| Vibe presets (3) | Instant skins | None | **None** | Preset packs | MVP |
| Sub-1s SSG / edge for Indian 4G | Performance bar | Possible with Next, not default product | **None** | SSG pipeline + CDN | MVP |
| Custom domain + SSL | 1-click brand | DIY | **None–Engine** | Provisioning integration | MVP |
| BYOG Razorpay / Cashfree / PhonePe | Tenant-owned keys | Payment module + community plugins | **Engine** (BYOG loader) | Full admin connect UI + live charge path | MVO (Razorpay first) |
| UPI Intent (GPay / PhonePe / Paytm) | No redirect hell | None native | **Engine** (intent utils) | Checkout UI + verify webhook | MVO |
| COD + 4-digit OTP (WA/SMS) | Mandatory before confirm | None | **Engine** (order state + OTP) | Checkout gate + admin COD queue | MVO |
| Guest checkout (name, phone, address, pincode) | Default | Email-first culture | **Partial** (can model) | Phone-first UX | MVO |
| Shiprocket + Delhivery AWB / labels | 1-click | None | **Engine** (fulfillment adapter) | Live API + admin button | MVP |
| GST PDF invoice + HSN | Automated | None | **Engine** (GST math) | PDF template + order hook | MVP |
| Evolution WhatsApp + QR Linked Devices | Bypass Meta fees default | None | **Engine** (client) | Onboarding UI + instance ops | MVP |
| Communications prepaid wallet | UPI top-up | None | **Engine** (wallet tables/service) | Top-up UI + deduct on send | MVP |
| WA order / dispatch / OFD messages | Automated | None | **None–Engine** | Event subscribers | MVP |
| WA abandoned cart (30 min) | Automated | None | **None** | Job + message template | MVP |
| 1-Screen Catalog Manager | Dense admin | Full admin (heavier) | **Partial** (Medusa admin) | Density / WebP pipeline | MVO–MVP |
| Shopify CSV import | 1-click port | Import patterns exist / DIY | **None–Partial** | Importer job + mapping | MVP |
| Merchant ops dashboard (sales, COD, dispatch, returns) | Minimalist home | Generic analytics-ish | **Partial** (agency KPIs; merchant ops thin) | Real order widgets | MVO |
| Meta CAPI + Pixel | Server-side | DIY | **None** | Events + settings | MVP |
| Promo engine | % / flat / free ship + MOT | **Strong** | **Strong** | Storefront apply + India copy | MVP |

---

## C. Feature list — “apps we need” (V1)

| Feature | Target (Bentoco) | Medusa 2 now | Bentoco now | Gap | Stage |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Pincode serviceability + COD check | PDP widget | None | **Engine** (adapter hooks) | Widget + live carrier API | V1 (start post-MVO) |
| Smart address autocomplete (pincode) | Checkout | None | **None–Engine** | API + form | V1 |
| WhatsApp photo reviews | Post-delivery | None | **None** | Flow + PDP render | V1 |
| Floating WhatsApp support widget | Native | None | **None** | Widget + merchant number | V1 |
| Post-purchase upsell | Modal | DIY | **None** | Order edit + UI | V1 |
| In-cart order bumps | Checkbox | DIY | **None** | Cart line rules | V1 |
| RTO & returns portal | Self-serve | Partial returns concepts | **Partial** (order module) | Buyer portal + policy | V1 |
| Dynamic size charts | Category-linked | None | **None** | Config + modal | V1 |
| Sticky mobile ATC bar | PDP | Theme-level | **None** | Storefront component | V1 |
| Meta / Google catalog feeds | XML auto-sync | DIY | **None** | Feed generator | V1 |
| Micro-affiliate links | Dashboard | DIY / none | **None** | Links + attribution | V1 |
| Scarcity badges (real stock) | Inventory-linked | Possible via inventory | **None** as product UI | PDP rules | V1 |

---

## D. Difference table — “what Medusa is” vs “what Bentoco must be”

| Dimension | Medusa right now (base) | Bentoco target | Difference (work type) |
| :--- | :--- | :--- | :--- |
| **Market default** | Global / modular headless | India D2C / Bharat operators | Product opinion + defaults |
| **Checkout** | Email, cards, plugins | Phone, UPI intent, COD OTP | Replace UX + gateways |
| **Tax** | Configurable / Western-friendly | GST + HSN + invoice PDF | Replace tax path |
| **Messaging** | Email-centric | WhatsApp-first (Evolution + wallet) | New subsystem |
| **Logistics** | Provider-agnostic framework | Shiprocket / Delhivery first-class | Native integrations |
| **Storefront** | Bring your own | Opinionated fast templates + DESIGN.md | New app |
| **Apps** | Ecosystem / custom | Built-in conversion pack | Feature density |
| **Tenancy** | Often 1 store / project | Multi-tenant SaaS RLS | Platform |
| **Agency** | Not a product | Dual-mode admin (parked) | Side product |

---

## E. Priority matrix (for planning)

| Priority | Features | Why |
| :---: | :--- | :--- |
| **P0 MVO** | Catalog, guest checkout, Razorpay+UPI, COD OTP, order admin, 4 storefront pages, tenant isolation | Money path |
| **P1 MVP** | Themes/DESIGN.md, domain SSL, Cashfree/PhonePe, Shiprocket/Delhivery, GST PDF, WhatsApp+wallet+abandoned, Shopify import, promos, Meta CAPI | Differentiation |
| **P2 V1** | All twelve “apps we need” | App replacement story |
| **P3 Parked** | Agency expansion beyond smoke | Not main product |

---

## F. Honest “% built” (planning aid, not accounting)

| Layer | Approx completeness toward **MVP feature list** |
| :--- | :---: |
| Medusa commerce kernel | ~70–85% usable as kernel |
| Bentoco India engines (code/tests) | ~40–55% of engine surface |
| Productized merchant path (admin + storefront + live integrations) | **~10–20%** |
| V1 apps | ~0–5% |
| Agency dual-mode | ~smoke-ready (parked) |

This matches the concern: **kernel + side product ≠ sellable main product**. Plan = productize P0 first.

---

## G. Next actions (link to plan.md)

1. Execute **MVO exit criteria** only — see [plan.md](./plan.md).  
2. Update this file’s **Bentoco now** column as slices ship (Partial → Ready).  
3. Do not add rows outside Feature Lists without changing plan stages.

---

## Changelog

| Date | Note |
| :--- | :--- |
| 2026-08-05 | Initial comparison from Feature Lists + roadmap + monorepo reality check |
