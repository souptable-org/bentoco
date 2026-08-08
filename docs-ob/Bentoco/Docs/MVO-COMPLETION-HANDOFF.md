# MVO Completion Handoff — For Next Agent (Gemini / Claude / etc.)

**Repo:** `C:\Users\harsh\bentoco` (Bentoco / Medusa 2 monorepo, packages namespaced `@bentoco/*`)  
**Canonical plan:** [plan.md](./plan.md)  
**Gap table:** [comparison.md](./comparison.md)  
**Razorpay notes:** [razorpay-byok.md](./razorpay-byok.md)  
**Project conventions:** root `Claude.md` / monorepo rules (no semicolons, double quotes, `@bentoco/*` imports)

**Purpose of this doc:** Tell the next AI **exactly** what is already done, what is **left** to call MVO **done**, how to implement each gap, which files to touch, and how to verify. Do **not** expand into MVP (Shiprocket, GST PDF, WhatsApp abandoned cart, DESIGN.md themes, etc.) unless explicitly asked.

---

## 1. What “MVO done” means (definition of done)

From `plan.md` — **all** of the following must pass on local/staging:

| # | Exit criterion | Current status |
|---|---|---|
| E1 | Create products + variants in admin | **DONE** (Medusa admin `/products`) |
| E2 | Guest places **prepaid** order (Razorpay; UPI preferred on mobile) | **MOSTLY DONE** — Checkout.js + BYOK works; UPI list depends on Razorpay dashboard; optional mobile Intent polish |
| E3 | Guest places **COD** order **only after OTP pass** | **NOT DONE** — COD places immediately with no OTP |
| E4 | Order appears in merchant admin with **Indian status** | **PARTIAL** — orders appear; status is generic Medusa `pending`, not Indian state machine |
| E5 | Second tenant **cannot** see first tenant’s data | **NOT VERIFIED** — RLS/engine exists; no productized smoke as exit gate |

**MVO is DONE only when E1–E5 all pass.** Do not mark complete if only E1–E2 work.

### MVO feature matrix (M1–M9)

| ID | Feature | Status | Action for Gemini |
|---|---|---|---|
| M1 | 1-Screen Catalog Manager | Partial | **Accept Medusa admin products for MVO** unless blocked; optional density polish only if free |
| M2 | Guest checkout (name, phone, address, pincode) | **Done** | Do not rewrite; fix bugs only |
| M3 | BYOG Razorpay | **Done** | Do not re-architect; fix bugs only |
| M4 | 1-Click UPI Intent (GPay/PhonePe/Paytm) | Partial | Optional polish: Intent drawer on mobile using existing util; Checkout UPI is acceptable if verified |
| M5 | COD + 4-digit OTP (WA/SMS) | **Not done** | **Primary remaining work** |
| M6 | Indian order states | Engine only | **Wire states on place + admin display** |
| M7 | Merchant ops home | **Not done** | **Primary remaining work** |
| M8 | Tenant isolation | Engine / unproven | **Smoke test + fix gaps** |
| M9 | Storefront 4 pages | **Done** | Shop, PDP, cart, checkout live |

### Explicitly OUT of MVO (do not build)

- Custom domain / SSL, DESIGN.md themes, Shiprocket/Delhivery AWB  
- GST PDF invoices, Meta CAPI, promos, abandoned cart, Evolution QR polish  
- Agency dual-mode features (frozen)  
- Cashfree / PhonePe (document multi-GW pattern only; don’t implement unless asked)

---

## 2. Environment & how to run

### Ports

| Service | URL | How |
|---|---|---|
| API | `http://localhost:9000` | `node packages/cli/bentoco-cli/cli.js start --types false -p 9000` from repo root with env |
| Admin | `http://localhost:7001` | `yarn dev` in `packages/admin/dashboard` |
| Storefront | `http://localhost:3000` | `npx next dev -p 3000` in `apps/storefront` |

### Critical env (API process)

```bash
DATABASE_URL=postgres://postgres:postgres@localhost:5432/bentoco
JWT_SECRET=supersecret_bentoco_jwt
COOKIE_SECRET=supersecret_bentoco_cookie
ADMIN_CORS=http://localhost:7001,http://127.0.0.1:7001
AUTH_CORS=http://localhost:7001,http://127.0.0.1:7001
ADMIN_URL=http://localhost:7001
# Razorpay BYOK (test defaults may also live in code when NODE_ENV !== production)
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_DEFAULT_TENANT_ID=803a80b0-c7e2-4208-aed4-958ac19c08c6
```

Storefront `.env.local`:

```bash
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...   # must match store publishable key
```

### Logins (local)

| Role | Email | Password |
|---|---|---|
| Merchant | `merchant@bentoco.com` | `supersecret` |
| Agency | `agcy@bentoco.com` | (agency flows; avoid for MVO) |
| Avoid | `admin@bentoco.com` | Often blocked by agency assume gate |

### Build note

- API routes load from `packages/bentoco/dist/api/**` (not raw `src` only).  
- After editing `packages/bentoco/src/api/**` or `utils/**`, compile into `dist` (e.g. `esbuild` single files or package build). **Restart API** after dist changes.  
- Storefront is Next.js — HMR usually enough for `apps/storefront`.

### Code style

- No semicolons, double quotes, 2-space indent (backend TS).  
- Storefront Aura app often uses semicolons (existing style) — match file.  
- Packages: `@bentoco/framework/*`, `@bentoco/core-flows`, `@bentoco/utils`.

---

## 3. What is ALREADY built (do not rebuild)

### 3.1 Storefront (Aura under `apps/storefront`)

| Path | Role |
|---|---|
| `app/shop`, `app/product/[slug]`, `app/cart`, `app/checkout` | M9 pages |
| `lib/medusa.ts` | Store API fetch + product map (amounts = **major INR units**, not paisa) |
| `lib/medusa-cart.ts` | Cart CRUD, `placeCodOrder`, `placeRazorpayOrder`, GST helpers usage |
| `lib/store.tsx` | Cart context: `cartId`, `cartSource`, `cartSubtotal` / `cartTax` / `cartTotal`, `clearCart` |
| `lib/pricing.ts` + `components/product/PriceLabel.tsx` | Catalog prices shown GST-inclusive with micro label |
| `app/checkout/page.tsx` | Guest shipping → COD **or** UPI/Razorpay branches (must not mix) |

**Checkout payment rules (important):**

- `paymentMethod === 'upi'` → **only** `placeRazorpayOrder` (opens Checkout.js).  
- `paymentMethod === 'cod'` → **only** `placeCodOrder`.  
- Never fall through UPI failure into COD.

### 3.2 Razorpay BYOK

| Path | Role |
|---|---|
| `packages/bentoco/src/utils/razorpay-byok.ts` | Load/save keys, create order, verify signature, fetch payment |
| `packages/bentoco/src/api/admin/byog/razorpay/route.ts` | GET/POST merchant keys → `tenant_payment_config` |
| `packages/bentoco/src/api/store/razorpay/create-order/route.ts` | `POST` cart_id → Razorpay Order + public `key_id` |
| `packages/bentoco/src/api/store/razorpay/confirm/route.ts` | Verify HMAC + Razorpay status → complete cart → order metadata prepaid |
| DB table | `tenant_payment_config` (`tenant_id`, `provider_id='razorpay'`, `encrypted_payload` JSON) |

**Payment tracking model:**

1. `create-order` → Razorpay Order  
2. Checkout.js success → `confirm` with `order_id|payment_id` HMAC  
3. `GET /v1/payments/:id` must be `captured` or `authorized`  
4. Then Medusa `completeCart` + order.metadata: `prepaid`, `razorpay_payment_id`, `payment_provider: razorpay`

**Production multi-tenant:** each merchant saves **their** keys via admin BYOG; no platform GMV fee. Do not put all merchants on one platform Razorpay MID.

### 3.3 COD (without OTP)

- `placeCodOrder` → shipping method + `pp_system_default` session + complete cart.  
- India free shipping option + GST 18% tax region were configured in DB for local demo.

### 3.4 Engines already in repo (wire, don’t rewrite)

| File | Use for |
|---|---|
| `packages/bentoco/src/utils/indian-order-state-machine.ts` | M6 states |
| `packages/bentoco/src/utils/mobile-upi-intent.ts` | M4 Intent URLs + webhook HMAC helper |
| `packages/bentoco/src/utils/indian-gst-engine.ts` | GST math (tax region already live for simple 18%) |
| `packages/bentoco/src/api/byog-payment-loader.ts` | Older BYOG loader (prefer `razorpay-byok.ts` for Razorpay) |
| Migrations under `packages/bentoco/src/migration-scripts/` | tenant, OTP sessions, wallet, agency — read before inventing tables |

### 3.5 Agency

**Parked / freeze.** Do not expand. Fix only if production fire.

---

## 4. Remaining work — detailed work packages

Implement in this order. Each package has scope, files, steps, acceptance tests.

---

### WP-A — COD OTP gate (M5) — **required for MVO**

**Goal:** COD order is created **only after** buyer verifies a 4-digit OTP (WhatsApp or SMS). Without OTP, no complete cart.

#### A.1 Backend

1. **Read** existing OTP/session schema:
   - `migration-scripts/0001-indian-order-state-machine-otp.sql`
   - table names like `tenant_otp_session` (confirm in DB)
   - `indian-order-state-machine.ts` for intended states

2. **APIs** (suggest under store, publishable-key auth like other store routes):

| Method | Path | Behavior |
|---|---|---|
| `POST` | `/store/cod/request-otp` | Body: `{ cart_id, phone }`. Validate cart has shipping + phone. Generate 4-digit OTP. Store hash + expiry (e.g. 5–10 min) + cart_id. **Dev:** log OTP or return in response if `NODE_ENV=development`. Prod: send via WhatsApp Evolution util or SMS stub. |
| `POST` | `/store/cod/verify-otp` | Body: `{ cart_id, phone, otp }`. Verify. On success: set cart.metadata `cod_otp_verified_at`, `cod_otp_phone`, then run same complete flow as COD (shipping method + system payment session + complete cart). Return order. |
| Reject | complete COD without verified flag | If someone calls complete with COD intent without verification, 403 |

3. **Do not** allow `placeCodOrder` on storefront without calling verify-otp first.  
   - Preferred: move complete into `verify-otp` only.  
   - Storefront `placeCodOrder` becomes: request OTP → UI for code → verify-otp.

4. **Rate limit** loosely (e.g. 1 OTP / 60s per phone+cart) to avoid abuse.

5. **State (M6 overlap):** On COD verify success set Indian status e.g. `COD_VERIFIED` or `WHATSAPP_VERIFIED` on order.metadata and/or dedicated column if migration defines it.

#### A.2 Storefront

**File:** `apps/storefront/app/checkout/page.tsx` (+ maybe `lib/medusa-cart.ts`)

1. When payment = COD → button “Send OTP” / “Place COD (verify phone)”.  
2. Step: show 4-digit input + resend.  
3. On verify success → success screen with order id (same as today).  
4. Do **not** call old `placeCodOrder` without OTP.

#### A.3 Acceptance

- [ ] COD without OTP → no order in admin  
- [ ] Correct OTP → order created; metadata shows COD + verified  
- [ ] Wrong OTP → error, no order  
- [ ] Expired OTP → error  
- [ ] UPI/Razorpay path still works without OTP  

#### A.4 SMS/WhatsApp for MVO

- **Minimum for MVO:** OTP stored + verified; in development return/log OTP.  
- **Better:** wire `evolution-api-client.ts` if env configured; else console.log.  
- Do not block MVO on full Evolution QR onboarding.

---

### WP-B — Indian order states on the core path (M6) — **required**

**Goal:** Orders show a Bentoco Indian status, not only Medusa `pending`.

#### B.1 States (align with engine)

Typical path from product docs:

```text
ORDER_INITIATED
  → WHATSAPP_VERIFYING (COD OTP pending)  [optional intermediate]
  → COD_VERIFIED | PREPAID_FLIPPED (or PREPAID_CAPTURED)
  → READY_TO_SHIP / AWB_GENERATED (AWB can stay stub)
```

#### B.2 Implementation

1. On **Razorpay confirm** success: set metadata (already partially done):

```json
{
  "payment_provider": "razorpay",
  "prepaid": true,
  "indian_status": "PREPAID_CAPTURED",
  "razorpay_payment_id": "pay_..."
}
```

2. On **COD OTP verify** success:

```json
{
  "payment_provider": "cod",
  "prepaid": false,
  "indian_status": "COD_VERIFIED",
  "cod_phone": "98..."
}
```

3. Prefer a **single helper** e.g. `setIndianOrderStatus(orderId, status, extra)` used by both confirm routes.  
4. If DB column exists for state machine, write both column + metadata.  
5. **Admin UI:** show `indian_status` (or metadata) on order list/detail — minimal badge is enough for MVO.

#### B.3 Acceptance

- [ ] Prepaid order → `PREPAID_CAPTURED` (or agreed enum) visible in admin  
- [ ] COD verified order → `COD_VERIFIED` visible  
- [ ] No COD order without `COD_VERIFIED`  

---

### WP-C — Merchant ops home (M7) — **required**

**Goal:** After login, merchant lands on a simple ops dashboard (not empty shell).

#### C.1 Location

Admin dashboard: `packages/admin/dashboard` (Vite React).  
Likely routes under `src/routes/` — find existing home `/orders` or dashboard route and either enhance or add `/` redirect.

Credentials doc redirects merchant to `/orders` — either:

- Make **Orders list** the ops home with summary widgets on top, **or**  
- New route `/ops` or enhance existing home.

#### C.2 Widgets (minimum)

| Widget | Data source |
|---|---|
| Today’s order count / GMV | `GET /admin/orders` filter by created_at today; sum totals |
| Pending COD | Orders where metadata `indian_status=COD_VERIFIED` or payment COD and not fulfilled |
| Prepaid today | metadata prepaid true |
| Needs dispatch | status not fulfilled / not canceled (simple) |
| Returns | stub count 0 or returns API if easy |

#### C.3 UX

- Dense, mobile-ish ok  
- Links: “View orders”, filter chips  
- No vanity charts required  

#### C.4 Acceptance

- [ ] Merchant login → sees widgets with **live** numbers from API  
- [ ] Click-through to order list works  
- [ ] Empty state when zero orders  

---

### WP-D — Tenant isolation smoke (M8) — **required to check off E5**

**Goal:** Prove Store A data is not visible to Store B (or document residual gap).

#### D.1 Steps

1. Identify two tenants/stores in DB (`tenant`, `tenant_store`, sales channels).  
2. Create product/order under tenant A (or use Alpha vs Beta seeds if present).  
3. Authenticate as merchant of B; call `GET /admin/products` and `GET /admin/orders`.  
4. Assert B cannot see A’s IDs.  
5. If leak: fix middleware / RLS context (`app.current_tenant`) on admin routes — see `tenant-middleware.ts`, `tenant-rls-context.ts`, stage-6 RLS scripts.

#### D.2 Deliverable

- Script `scripts/smoke-tenant-isolation.js` that exits 0/1  
- Or documented manual steps + result in this folder  
- Fix any P0 leak before calling MVO done  

#### D.3 Acceptance

- [ ] Automated or written smoke passes  
- [ ] No cross-tenant product/order IDs in API responses  

---

### WP-E — Prepaid UPI polish (M4) — **optional for MVO if E2 already demos prepaid**

**Already acceptable for E2:** Razorpay Checkout with UPI enabled on merchant dashboard.

**Optional upgrade:**

1. Use `packages/bentoco/src/utils/mobile-upi-intent.ts` to build GPay/PhonePe/Paytm links from Razorpay order/VPA if available.  
2. Mobile storefront: show “Pay in GPay” buttons that open Intent; still **must** confirm payment via Razorpay payment id / webhook before complete cart.  
3. Do **not** complete cart on Intent open alone.

**UPI not showing in Checkout:** merchant enables UPI under Razorpay Dashboard → Payment methods. Not a Bentoco bug if Card works.

---

### WP-F — Multi-gateway future (edge case — **document only**, do not implement for MVO)

**Architecture (for later):**

```text
tenant_payment_config
  UNIQUE(tenant_id, provider_id)
  provider_id ∈ { razorpay, cashfree, phonepe }
  encrypted_payload = { key_id, key_secret, webhook_secret, ... }
```

| Layer | Pattern |
|---|---|
| Admin | One connect form per provider → save row |
| Store checkout | List active providers for tenant; user picks one |
| API | `/store/payments/:provider/create` + `/confirm` or shared router |
| Webhooks | `/hooks/payment/:provider` |
| Order metadata | `payment_provider`, external ids |

Razorpay is the first implementation of this pattern. Cashfree/PhonePe copy the same shape; never force one platform MID for all merchants (stay BYOK).

---

## 5. Suggested implementation order for Gemini

```text
1. WP-A  COD OTP (blocks E3)
2. WP-B  Indian statuses on COD + prepaid paths (blocks E4)
3. WP-C  Ops home widgets (blocks M7)
4. WP-D  Tenant isolation smoke (blocks E5)
5. WP-E  UPI Intent polish only if time
6. Final regression checklist (§6)
```

Estimate: **2–5 focused days** if engines are reused; longer if OTP SMS and RLS fixes are deep.

---

## 6. Final regression checklist (run before “MVO done”)

### Storefront

- [ ] Shop lists Medusa products with sensible prices (GST inclusive label ok)  
- [ ] Add to cart → Medusa cart id in drawer  
- [ ] Checkout shipping saves address; GST appears after India address  
- [ ] **Razorpay:** Pay → Checkout opens → test pay → order with `prepaid` / razorpay ids  
- [ ] **COD:** OTP required → verify → order with `COD_VERIFIED`  
- [ ] COD without OTP → no order  
- [ ] Cancel Razorpay modal → no order  

### Admin (merchant@bentoco.com)

- [ ] Orders list shows new COD + prepaid orders  
- [ ] Indian status badge / metadata readable  
- [ ] Ops home widgets non-zero when orders exist  
- [ ] Products create/edit still works  

### Isolation

- [ ] Tenant smoke script or manual E5 pass  

### Do not regress

- [ ] Agency freeze: no new agency features  
- [ ] Prices still major INR units (not ×100 paisa bug)  
- [ ] `placeRazorpayOrder` never calls `placeCodOrder`  

---

## 7. Key file map (quick reference)

```text
apps/storefront/
  app/checkout/page.tsx          # guest + COD/UPI UI
  lib/medusa-cart.ts             # cart + placeCodOrder + placeRazorpayOrder
  lib/store.tsx                  # cart context
  lib/medusa.ts                  # products fetch
  lib/pricing.ts                 # GST inclusive display

packages/bentoco/src/
  utils/razorpay-byok.ts
  utils/indian-order-state-machine.ts
  utils/mobile-upi-intent.ts
  utils/evolution-api-client.ts  # optional OTP send
  api/store/razorpay/create-order/route.ts
  api/store/razorpay/confirm/route.ts
  api/admin/byog/razorpay/route.ts
  api/byog-payment-loader.ts
  migration-scripts/0001-*.sql   # OTP / states
  migration-scripts/stage-6-*.sql # RLS

packages/admin/dashboard/src/    # ops home UI
docs-ob/Bentoco/Docs/plan.md
docs-ob/Bentoco/Docs/MVO-COMPLETION-HANDOFF.md  # this file
```

---

## 8. Prompt you can paste into Gemini

```text
You are working in the Bentoco monorepo at C:\Users\harsh\bentoco (Medusa 2 fork, @bentoco/*).

Read and follow EXACTLY:
docs-ob/Bentoco/Docs/MVO-COMPLETION-HANDOFF.md

Goal: Finish MVO only (WP-A through WP-D). Do not build MVP features (Shiprocket, GST PDF, themes, agency, Cashfree).

Constraints:
- Reuse existing engines (indian-order-state-machine, razorpay-byok, medusa-cart).
- After packages/bentoco/src API changes, compile to dist and restart API :9000.
- Merchant login: merchant@bentoco.com / supersecret
- COD must require OTP; Razorpay must not fall back to COD.
- Match repo code style (Claude.md).

Deliver: working COD OTP + indian_status on orders + merchant ops widgets + tenant isolation smoke. End with the regression checklist from the handoff all checked or with residual risks listed.
```

---

## 9. Residual risks / known quirks

| Risk | Note |
|---|---|
| API routes in `dist` | Easy to edit `src` and forget rebuild |
| Agency gate | `admin@bentoco.com` may 403; use merchant |
| Razorpay UPI list | Dashboard payment method toggle |
| System payment provider | Prepaid may still use `pp_system_default` for Medusa bookkeeping after external pay; metadata marks prepaid — improve mark-as-paid if balance still shows unpaid |
| Multi-tenant storefront | Publishable key / sales channel binding may still be single-demo; isolation is admin/API first for MVO |
| Test Razorpay keys in code | Dev fallback only; production must use per-tenant BYOK |

---

## 10. Definition of “stop and call MVO done”

Stop when:

1. All exit criteria E1–E5 pass on local.  
2. Regression checklist §6 is green.  
3. No new MVP scope was opened.  
4. Short note written: `docs-ob/Bentoco/Docs/MVO-DONE.md` with date, who tested, and any deferred items (Intent polish, real SMS provider).

**That is the only bar.** Razorpay working alone is **not** full MVO; COD OTP + Indian status + ops home + isolation are the rest.
