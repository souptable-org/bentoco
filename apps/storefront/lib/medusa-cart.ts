import type { CartItem } from "./types"
import { medusaFetch } from "./medusa"

const CART_ID_KEY = "bentoco_medusa_cart_id"

/** India region (INR) — matches seeded Bentoco Demo Store */
export const INDIA_REGION_ID =
  process.env.NEXT_PUBLIC_MEDUSA_REGION_ID ||
  "reg_01KZ5T3298V6210QBXTVWG3TXW"

/**
 * System default payment provider — used for Cash on Delivery (manual capture).
 * No external gateway; cart complete creates a pending order.
 */
export const COD_PROVIDER_ID = "pp_system_default"

export type MedusaCartLine = {
  id: string
  variant_id?: string
  product_id?: string
  product_title?: string
  title?: string
  thumbnail?: string | null
  quantity: number
  unit_price: number
  variant_title?: string | null
  product_handle?: string | null
}

export type MedusaAddress = {
  first_name?: string
  last_name?: string
  phone?: string
  address_1?: string
  address_2?: string
  city?: string
  province?: string
  postal_code?: string
  country_code?: string
}

export type MedusaCart = {
  id: string
  email?: string | null
  region_id?: string | null
  items?: MedusaCartLine[]
  /** Grand total including tax + shipping (major units). */
  total?: number
  /** Line items before tax (major units). */
  subtotal?: number
  item_subtotal?: number
  tax_total?: number
  shipping_total?: number
  shipping_subtotal?: number
  currency_code?: string
  shipping_address?: MedusaAddress | null
  billing_address?: MedusaAddress | null
  shipping_methods?: { id?: string; shipping_option_id?: string; name?: string }[]
  completed_at?: string | null
}

export type UpdateCartPayload = {
  email?: string
  region_id?: string
  shipping_address?: MedusaAddress
  billing_address?: MedusaAddress
}

export type MedusaShippingOption = {
  id: string
  name?: string
  amount?: number
  price_type?: string
}

export type MedusaOrder = {
  id: string
  display_id?: number
  email?: string | null
  status?: string
  total?: number
  currency_code?: string
}

export type CompleteCartResult =
  | { type: "order"; order: MedusaOrder }
  | { type: "cart"; cart: MedusaCart; error?: { message?: string } }

/**
 * Medusa v2 amounts are major currency units (INR rupees, not paisa).
 * Keep paise as 2 decimal places.
 */
function toRupees(amount: number | undefined | null): number {
  if (amount == null || Number.isNaN(Number(amount))) return 0
  return Math.round(Number(amount) * 100) / 100
}

export function mapCartItems(cart: MedusaCart | null | undefined): CartItem[] {
  if (!cart?.items?.length) return []
  return cart.items.map((item) => {
    const variantBits = (item.variant_title || "")
      .split("/")
      .map((s) => s.trim())
      .filter(Boolean)
    return {
      id: item.id,
      productId: item.product_id || "",
      variantId: item.variant_id,
      name: item.product_title || item.title || "Item",
      price: toRupees(item.unit_price),
      image:
        item.thumbnail ||
        `https://picsum.photos/seed/${item.product_id || item.id}/200/260`,
      quantity: item.quantity,
      size: variantBits[0],
      color: variantBits[1],
    }
  })
}

/** Line-item subtotal (before tax). Prefer item_subtotal / subtotal over grand total. */
export function cartSubtotalRupees(cart: MedusaCart | null | undefined): number {
  if (!cart) return 0
  if (cart.item_subtotal != null) return toRupees(cart.item_subtotal)
  if (cart.subtotal != null) return toRupees(cart.subtotal)
  return mapCartItems(cart).reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  )
}

export function cartTaxRupees(cart: MedusaCart | null | undefined): number {
  if (!cart || cart.tax_total == null) return 0
  return toRupees(cart.tax_total)
}

export function cartShippingRupees(cart: MedusaCart | null | undefined): number {
  if (!cart) return 0
  if (cart.shipping_total != null) return toRupees(cart.shipping_total)
  if (cart.shipping_subtotal != null) return toRupees(cart.shipping_subtotal)
  return 0
}

/** Grand total (items + tax + shipping). */
export function cartTotalRupees(cart: MedusaCart | null | undefined): number {
  if (!cart) return 0
  if (cart.total != null) return toRupees(cart.total)
  return cartSubtotalRupees(cart) + cartTaxRupees(cart) + cartShippingRupees(cart)
}

export function getStoredCartId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(CART_ID_KEY)
}

export function setStoredCartId(id: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(CART_ID_KEY, id)
}

export function clearStoredCartId() {
  if (typeof window === "undefined") return
  localStorage.removeItem(CART_ID_KEY)
}

export async function createCart(): Promise<MedusaCart> {
  const data = await medusaFetch<{ cart: MedusaCart }>("/store/carts", {
    method: "POST",
    body: JSON.stringify({ region_id: INDIA_REGION_ID }),
  })
  return data.cart
}

export async function retrieveCart(cartId: string): Promise<MedusaCart> {
  const data = await medusaFetch<{ cart: MedusaCart }>(
    `/store/carts/${cartId}`
  )
  return data.cart
}

/** Get existing cart from storage or create a new one. */
export async function ensureCart(): Promise<MedusaCart> {
  const existing = getStoredCartId()
  if (existing) {
    try {
      return await retrieveCart(existing)
    } catch {
      clearStoredCartId()
    }
  }
  const cart = await createCart()
  setStoredCartId(cart.id)
  return cart
}

export async function addLineItem(
  cartId: string,
  variantId: string,
  quantity: number
): Promise<MedusaCart> {
  const data = await medusaFetch<{ cart: MedusaCart }>(
    `/store/carts/${cartId}/line-items`,
    {
      method: "POST",
      body: JSON.stringify({ variant_id: variantId, quantity }),
    }
  )
  return data.cart
}

export async function updateLineItem(
  cartId: string,
  lineId: string,
  quantity: number
): Promise<MedusaCart> {
  const data = await medusaFetch<{ cart: MedusaCart }>(
    `/store/carts/${cartId}/line-items/${lineId}`,
    {
      method: "POST",
      body: JSON.stringify({ quantity }),
    }
  )
  return data.cart
}

export async function removeLineItem(
  cartId: string,
  lineId: string
): Promise<MedusaCart> {
  const data = await medusaFetch<{ cart: MedusaCart }>(
    `/store/carts/${cartId}/line-items/${lineId}`,
    { method: "DELETE" }
  )
  return data.cart
}

/** Guest shipping: email + address on the cart (Store API POST /store/carts/:id). */
export async function updateCart(
  cartId: string,
  payload: UpdateCartPayload
): Promise<MedusaCart> {
  const data = await medusaFetch<{ cart: MedusaCart }>(
    `/store/carts/${cartId}`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    }
  )
  return data.cart
}

export async function listShippingOptions(
  cartId: string
): Promise<MedusaShippingOption[]> {
  const data = await medusaFetch<{ shipping_options: MedusaShippingOption[] }>(
    `/store/shipping-options?cart_id=${encodeURIComponent(cartId)}`
  )
  return data.shipping_options || []
}

export async function addShippingMethod(
  cartId: string,
  optionId: string
): Promise<MedusaCart> {
  const data = await medusaFetch<{ cart: MedusaCart }>(
    `/store/carts/${cartId}/shipping-methods`,
    {
      method: "POST",
      body: JSON.stringify({ option_id: optionId }),
    }
  )
  return data.cart
}

/**
 * Pick first available shipping option (Standard Delivery free for India).
 * No-ops if cart already has a shipping method.
 */
export async function ensureShippingMethod(
  cartId: string
): Promise<MedusaCart> {
  const cart = await retrieveCart(cartId)
  if (cart.shipping_methods?.length) return cart
  const options = await listShippingOptions(cartId)
  const option = options[0]
  if (!option) {
    throw new Error(
      "No shipping options available for this address. Check pincode / region."
    )
  }
  return addShippingMethod(cartId, option.id)
}

export async function createPaymentCollection(
  cartId: string
): Promise<{ id: string }> {
  const data = await medusaFetch<{ payment_collection: { id: string } }>(
    "/store/payment-collections",
    {
      method: "POST",
      body: JSON.stringify({ cart_id: cartId }),
    }
  )
  return data.payment_collection
}

export async function createPaymentSession(
  paymentCollectionId: string,
  providerId: string = COD_PROVIDER_ID
): Promise<void> {
  await medusaFetch(
    `/store/payment-collections/${paymentCollectionId}/payment-sessions`,
    {
      method: "POST",
      body: JSON.stringify({ provider_id: providerId }),
    }
  )
}

export async function completeCart(
  cartId: string
): Promise<CompleteCartResult> {
  return medusaFetch<CompleteCartResult>(`/store/carts/${cartId}/complete`, {
    method: "POST",
    body: JSON.stringify({}),
  })
}

/**
 * Cash on Delivery: shipping method → system payment session → complete cart.
 * Returns the Medusa order (shows up in Admin → Orders).
 */
export async function placeCodOrder(cartId: string): Promise<MedusaOrder> {
  await ensureShippingMethod(cartId)
  const collection = await createPaymentCollection(cartId)
  await createPaymentSession(collection.id, COD_PROVIDER_ID)
  const result = await completeCart(cartId)
  if (result.type === "order" && result.order?.id) {
    return result.order
  }
  const msg =
    (result as { error?: { message?: string } }).error?.message ||
    "Cart could not be completed. Check shipping and payment."
  throw new Error(msg)
}

export type RazorpayCreateOrderResponse = {
  key_id: string
  order_id: string
  amount: number
  currency: string
  name?: string
  cart_id: string
  tracking?: { payment_status: string; razorpay_order_id: string }
}

export type RazorpayConfirmResponse = {
  type: "order"
  order: MedusaOrder & {
    metadata?: Record<string, unknown>
    display_id?: number
  }
  payment: {
    provider: string
    status: string
    razorpay_payment_id: string
    razorpay_order_id: string
    method?: string
    amount_paise?: number
    verified: boolean
  }
}

/** Create Razorpay Order (server uses merchant BYOK keys). */
export async function createRazorpayOrder(
  cartId: string
): Promise<RazorpayCreateOrderResponse> {
  return medusaFetch<RazorpayCreateOrderResponse>(
    "/store/razorpay/create-order",
    {
      method: "POST",
      body: JSON.stringify({ cart_id: cartId }),
    }
  )
}

/**
 * After Checkout.js success: verify signature + Razorpay status, then complete cart.
 * This is how we know payment was made (not just client “success” click).
 */
export async function confirmRazorpayPayment(input: {
  cartId: string
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}): Promise<RazorpayConfirmResponse> {
  return medusaFetch<RazorpayConfirmResponse>("/store/razorpay/confirm", {
    method: "POST",
    body: JSON.stringify({
      cart_id: input.cartId,
      razorpay_order_id: input.razorpay_order_id,
      razorpay_payment_id: input.razorpay_payment_id,
      razorpay_signature: input.razorpay_signature,
    }),
  })
}

/** Load Razorpay Checkout.js once in the browser. */
export function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay only runs in the browser"))
  }
  const w = window as Window & { Razorpay?: unknown }
  if (w.Razorpay) return Promise.resolve()

  return new Promise((resolve, reject) => {
    const src = "https://checkout.razorpay.com/v1/checkout.js"
    const existing = document.querySelector(
      `script[src="${src}"]`
    ) as HTMLScriptElement | null

    const done = () => {
      if ((window as Window & { Razorpay?: unknown }).Razorpay) resolve()
      else reject(new Error("Razorpay Checkout.js loaded but Razorpay is missing"))
    }

    if (existing) {
      // Script tag already there — may already be loaded (listeners never fire)
      if ((window as Window & { Razorpay?: unknown }).Razorpay) {
        resolve()
        return
      }
      existing.addEventListener("load", done)
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load Razorpay Checkout.js"))
      )
      // Poll briefly in case load already fired
      let n = 0
      const t = setInterval(() => {
        n++
        if ((window as Window & { Razorpay?: unknown }).Razorpay) {
          clearInterval(t)
          resolve()
        } else if (n > 50) {
          clearInterval(t)
          reject(new Error("Timed out waiting for Razorpay Checkout.js"))
        }
      }, 100)
      return
    }

    const s = document.createElement("script")
    s.src = src
    s.async = true
    s.onload = done
    s.onerror = () => reject(new Error("Failed to load Razorpay Checkout.js"))
    document.body.appendChild(s)
  })
}

/**
 * Full prepaid path: create order → open Checkout → confirm → Medusa order.
 * Never completes cart without a verified Razorpay payment.
 */
export async function placeRazorpayOrder(
  cartId: string,
  customer?: { name?: string; email?: string; phone?: string }
): Promise<RazorpayConfirmResponse> {
  await ensureShippingMethod(cartId)

  let session: RazorpayCreateOrderResponse
  try {
    session = await createRazorpayOrder(cartId)
  } catch (e: any) {
    throw new Error(
      e?.message ||
        "Could not create Razorpay order. Is BYOK configured? (Not placing COD.)"
    )
  }

  if (!session?.order_id || !session?.key_id) {
    throw new Error("Invalid Razorpay session from server — not placing COD.")
  }

  await loadRazorpayScript()

  type RzpInstance = {
    open: () => void
    on: (event: string, cb: (r: unknown) => void) => void
  }
  type RzpCtor = new (opts: Record<string, unknown>) => RzpInstance

  const RazorpayCtor = (window as Window & { Razorpay?: RzpCtor }).Razorpay
  if (!RazorpayCtor) {
    throw new Error(
      "Razorpay Checkout did not load. Check ad-blockers / network. (Not placing COD.)"
    )
  }

  return new Promise((resolve, reject) => {
    let settled = false
    const fail = (err: Error) => {
      if (settled) return
      settled = true
      reject(err)
    }
    const ok = (r: RazorpayConfirmResponse) => {
      if (settled) return
      settled = true
      resolve(r)
    }

    // Phone for Checkout: 10-digit India mobile (required for UPI prefill)
    const contact = (customer?.phone || "").replace(/\D/g, "").slice(-10)
    const email = customer?.email || "guest@example.com"

    const rzp = new RazorpayCtor({
      key: session.key_id,
      amount: session.amount,
      currency: session.currency || "INR",
      name: session.name || "Store",
      description: "Prepaid order",
      order_id: session.order_id,
      // Explicitly allow methods — UPI must be true or it may not appear
      method: {
        upi: true,
        card: true,
        netbanking: true,
        wallet: true,
      },
      // Prefer UPI first in the Checkout UI
      config: {
        display: {
          blocks: {
            upi_block: {
              name: "Pay with UPI",
              instruments: [{ method: "upi" }],
            },
            other: {
              name: "Other methods",
              instruments: [
                { method: "card" },
                { method: "netbanking" },
                { method: "wallet" },
              ],
            },
          },
          sequence: ["block.upi_block", "block.other"],
          preferences: {
            show_default_blocks: false,
          },
        },
      },
      prefill: {
        name: customer?.name || "Guest",
        email,
        // Must be 10 digits for India — helps UPI show / preselect
        contact: contact.length === 10 ? contact : "9999999999",
        method: "upi",
      },
      theme: { color: "#111111" },
      // Desktop test: UPI Collect with success@razorpay / failure@razorpay
      // Mobile: Intent apps (GPay/PhonePe) if installed
      handler: async (response: {
        razorpay_payment_id: string
        razorpay_order_id: string
        razorpay_signature: string
      }) => {
        try {
          if (
            !response?.razorpay_payment_id ||
            !response?.razorpay_signature
          ) {
            fail(new Error("Razorpay returned incomplete payment data"))
            return
          }
          const confirmed = await confirmRazorpayPayment({
            cartId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          })
          ok(confirmed)
        } catch (e: any) {
          fail(
            new Error(
              e?.message ||
                "Payment may have succeeded on Razorpay but order confirm failed"
            )
          )
        }
      },
      modal: {
        ondismiss: () => {
          fail(new Error("Payment cancelled — no order placed (not COD)"))
        },
      },
    })
    rzp.on("payment.failed", (resp: unknown) => {
      fail(
        new Error(
          (resp as { error?: { description?: string } })?.error?.description ||
            "Razorpay payment failed — no order placed"
        )
      )
    })
    try {
      rzp.open()
    } catch (e: any) {
      fail(new Error(e?.message || "Could not open Razorpay Checkout"))
    }
  })
}

/** Normalize Indian mobile to 10 digits (strips +91 / leading 0). */
export function normalizeIndianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2)
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1)
  return digits
}

export function isValidIndianPhone(raw: string): boolean {
  return /^[6-9]\d{9}$/.test(normalizeIndianPhone(raw))
}

export function isValidIndianPincode(raw: string): boolean {
  return /^[1-9]\d{5}$/.test(raw.trim())
}

/**
 * Optional pincode → city/state via India Post public API.
 * Fails soft (returns null) on network/CORS/unknown pin.
 */
export async function lookupPincode(pincode: string): Promise<{
  city: string
  province: string
} | null> {
  if (!isValidIndianPincode(pincode)) return null
  try {
    const res = await fetch(
      `https://api.postalpincode.in/pincode/${encodeURIComponent(pincode.trim())}`,
      { signal: AbortSignal.timeout(5000) }
    )
    if (!res.ok) return null
    const data = (await res.json()) as Array<{
      Status?: string
      PostOffice?: Array<{
        District?: string
        State?: string
        Block?: string
        Name?: string
      }>
    }>
    const office = data?.[0]?.PostOffice?.[0]
    if (!office || data[0]?.Status !== "Success") return null
    return {
      city: office.District || office.Block || office.Name || "",
      province: office.State || "",
    }
  } catch {
    return null
  }
}
