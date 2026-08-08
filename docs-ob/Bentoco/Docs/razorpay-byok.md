# Razorpay BYOK (Bring Your Own Keys)

Bentoco does **not** process money through a platform Razorpay account.  
Each merchant connects **their** Key ID + Secret; settlements go to **their** bank.

## Do you need a Razorpay account?

| Who | Account? |
|-----|----------|
| **Merchant (brand)** | **Yes** — create free account at [razorpay.com](https://razorpay.com), complete KYC for live |
| **You (local dev)** | **Yes, test mode** — generate Test Key ID + Secret to try Checkout |
| **Bentoco platform** | **No** live MID required for BYOK charges |

## How we know payment was made

```
1. create-order  → Razorpay Order (status: created)
2. Checkout.js   → buyer pays (UPI/card/…)
3. confirm       → A) HMAC signature  B) GET /payments/:id status
4. Only if captured|authorized → complete Medusa cart
5. order.metadata stores razorpay_payment_id + status
```

| Signal | Meaning |
|--------|---------|
| Invalid signature | **Not paid** — reject |
| Razorpay status `failed` / `created` | **Not paid** — reject |
| Status `captured` or `authorized` | **Paid** — create order |
| Order metadata `payment_status` | Audit trail in Admin |

Optional later: webhook `payment.captured` if the browser tab closes early.

## Configure keys

### Option A — env (fast local)

Restart API with:

```bash
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...   # optional
RAZORPAY_BUSINESS_NAME=My Store
RAZORPAY_DEFAULT_TENANT_ID=803a80b0-c7e2-4208-aed4-958ac19c08c6
```

### Option B — admin API (true BYOK)

```http
POST /admin/byog/razorpay
Authorization: Bearer <merchant token>
{
  "key_id": "rzp_test_...",
  "key_secret": "...",
  "webhook_secret": "...",
  "business_name": "Alpha Textiles",
  "tenant_id": "803a80b0-c7e2-4208-aed4-958ac19c08c6",
  "test_connection": true
}
```

Stores in `tenant_payment_config` (`provider_id = razorpay`).

```http
GET /admin/byog/razorpay
```

Returns whether keys are configured (secret never returned).

## Store APIs

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/store/razorpay/create-order` | `{ cart_id }` → `key_id`, `order_id`, amount |
| POST | `/store/razorpay/confirm` | signature + payment ids → Medusa order |

## Storefront

Checkout → **UPI / Razorpay** → Checkout modal → on success confirm → Admin Orders  
with metadata `prepaid: true`, `razorpay_payment_id`, …

**COD** remains available without Razorpay.

## UPI not showing in Checkout?

1. **Dashboard (most common):** Razorpay Dashboard → **Account & Settings** → **Payment methods** → enable **UPI** (and save). Test mode still respects method toggles.
2. **Checkout config:** Storefront opens Checkout with `method.upi: true` and UPI block first.
3. **Test UPI IDs** (after selecting UPI in the modal):
   - Success: `success@razorpay`
   - Failure: `failure@razorpay`
4. **Desktop** usually shows UPI Collect (enter VPA). **Mobile** may show Intent (GPay/PhonePe apps).
5. If only Card appears, re-check step 1 — account-level disable overrides Checkout options.

## Official docs

- [API Keys](https://razorpay.com/docs/payments/dashboard/account-settings/api-keys/)
- [Authentication](https://razorpay.com/docs/api/authentication/)
- [Orders](https://razorpay.com/docs/api/orders/)
- [Checkout / verify signature](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/)
