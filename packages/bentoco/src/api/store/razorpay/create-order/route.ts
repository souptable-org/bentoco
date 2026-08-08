import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@bentoco/framework/utils"
import {
  createRazorpayOrder,
  resolveRazorpayCredentials,
  toPaise,
} from "../../../../utils/razorpay-byok"

type Body = {
  cart_id: string
  tenant_id?: string
}

/**
 * POST /store/razorpay/create-order
 *
 * Creates a Razorpay Order using the merchant’s BYOK keys.
 * Returns public fields only (key_id + order_id) for Checkout.js.
 * Secret never leaves the server.
 */
export const POST = async (
  req: MedusaRequest<Body>,
  res: MedusaResponse
) => {
  const body = (req.body || {}) as Body
  const cartId = body.cart_id
  if (!cartId) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "cart_id is required"
    )
  }

  const tenantId =
    body.tenant_id || process.env.RAZORPAY_DEFAULT_TENANT_ID || null

  const creds = await resolveRazorpayCredentials(tenantId)
  if (!creds) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Razorpay is not configured. Merchant must save BYOK keys (Admin → BYOG Razorpay) or set RAZORPAY_KEY_ID/SECRET."
    )
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: carts } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "email",
      "currency_code",
      "total",
      "subtotal",
      "tax_total",
      "shipping_total",
      "metadata",
    ],
    filters: { id: cartId },
  })
  const cart = carts?.[0]
  if (!cart) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Cart ${cartId} not found`)
  }

  const totalMajor = Number(cart.total ?? 0)
  if (!totalMajor || totalMajor <= 0) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Cart total must be greater than zero before payment"
    )
  }

  const amountPaise = toPaise(totalMajor)
  const currency = (cart.currency_code || "inr").toUpperCase()

  const order = await createRazorpayOrder(creds, {
    amountPaise,
    currency,
    receipt: cartId,
    notes: {
      cart_id: cartId,
      email: cart.email || "",
    },
  })

  // Persist razorpay order id on cart metadata for verify step
  const cartModule = req.scope.resolve(Modules.CART)
  await cartModule.updateCarts(cartId, {
    metadata: {
      ...(cart.metadata || {}),
      razorpay_order_id: order.id,
      razorpay_amount_paise: amountPaise,
      payment_provider: "razorpay",
      payment_status: "created",
    },
  })

  res.status(200).json({
    key_id: creds.key_id,
    order_id: order.id,
    amount: amountPaise,
    currency,
    name: creds.business_name || "Store",
    cart_id: cartId,
    /**
     * How we track payment later:
     * - payment_status starts as "created"
     * - after Checkout success → verify endpoint checks Razorpay + signature
     * - then "captured" / "failed"
     */
    tracking: {
      payment_status: "created",
      razorpay_order_id: order.id,
    },
  })
}
