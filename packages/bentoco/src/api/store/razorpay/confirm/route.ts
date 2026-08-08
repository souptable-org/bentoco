import {
  completeCartWorkflowId,
  createPaymentCollectionForCartWorkflowId,
  markPaymentCollectionAsPaid,
} from "@bentoco/core-flows"
import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  remoteQueryObjectFromString,
} from "@bentoco/framework/utils"
import {
  fetchRazorpayPayment,
  isPaymentSuccessful,
  resolveRazorpayCredentials,
  verifyPaymentSignature,
} from "../../../../utils/razorpay-byok"

type Body = {
  cart_id: string
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
  tenant_id?: string
}

/**
 * POST /store/razorpay/confirm
 *
 * Tracks “paid or not” by:
 * 1) HMAC signature (Checkout success)
 * 2) Razorpay GET payment status (captured|authorized)
 * Then completes the Medusa cart and stamps order.metadata.
 */
export const POST = async (
  req: MedusaRequest<Body>,
  res: MedusaResponse
) => {
  const body = (req.body || {}) as Body
  const {
    cart_id,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  } = body

  if (
    !cart_id ||
    !razorpay_order_id ||
    !razorpay_payment_id ||
    !razorpay_signature
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "cart_id, razorpay_order_id, razorpay_payment_id, and razorpay_signature are required"
    )
  }

  const tenantId =
    body.tenant_id || process.env.RAZORPAY_DEFAULT_TENANT_ID || null
  const creds = await resolveRazorpayCredentials(tenantId)
  if (!creds) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Razorpay is not configured for this store"
    )
  }

  const sigOk = verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    creds.key_secret
  )
  if (!sigOk) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Invalid Razorpay payment signature — payment not accepted"
    )
  }

  const payment = await fetchRazorpayPayment(creds, razorpay_payment_id)
  if (payment.order_id && payment.order_id !== razorpay_order_id) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Payment does not belong to this Razorpay order"
    )
  }
  if (!isPaymentSuccessful(payment)) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      `Razorpay payment status is "${payment.status}" — not paid yet`
    )
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  const { data: carts } = await query.graph({
    entity: "cart",
    fields: ["id", "metadata", "email", "currency_code", "total"],
    filters: { id: cart_id },
  })
  const cart = carts?.[0]
  if (!cart) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Cart ${cart_id} not found`
    )
  }

  const cartModule = req.scope.resolve(Modules.CART)
  await cartModule.updateCarts(cart_id, {
    metadata: {
      ...(cart.metadata || {}),
      payment_provider: "razorpay",
      payment_status: payment.status,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_method: payment.method || null,
      razorpay_amount_paise: payment.amount,
      razorpay_verified_at: new Date().toISOString(),
    },
  })

  // Payment collection + system session (authorization after external pay)
  try {
    const wePay = req.scope.resolve(Modules.WORKFLOW_ENGINE)
    let [cartCollectionRelation] = await remoteQuery(
      remoteQueryObjectFromString({
        entryPoint: "cart_payment_collection",
        variables: { filters: { cart_id } },
        fields: ["payment_collection.id", "payment_collection.amount"],
      })
    )
    if (!cartCollectionRelation?.payment_collection?.id) {
      await wePay.run(createPaymentCollectionForCartWorkflowId, {
        input: { cart_id },
      })
      ;[cartCollectionRelation] = await remoteQuery(
        remoteQueryObjectFromString({
          entryPoint: "cart_payment_collection",
          variables: { filters: { cart_id } },
          fields: ["payment_collection.id"],
        })
      )
    }
    const collectionId = cartCollectionRelation?.payment_collection?.id
    if (collectionId) {
      const paymentModule = req.scope.resolve(Modules.PAYMENT)
      await paymentModule.createPaymentSession(collectionId, {
        provider_id: "pp_system_default",
        currency_code: (cart.currency_code || "inr").toLowerCase(),
        amount: Number(cart.total ?? payment.amount / 100),
        data: {
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_status: payment.status,
          externally_paid: true,
        },
      })
    }
  } catch (e: any) {
    console.warn("[razorpay/confirm] payment session:", e?.message || e)
  }

  const we = req.scope.resolve(Modules.WORKFLOW_ENGINE)
  const { errors, result } = await we.run(completeCartWorkflowId, {
    input: { id: cart_id },
    throwOnError: false,
  })

  if (errors?.[0]) {
    const err = errors[0].error || errors[0]
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      err?.message ||
        "Cart completion failed after successful Razorpay payment. Payment is captured on Razorpay — check cart state."
    )
  }

  const orderId = result?.id
  if (orderId) {
    try {
      const orderModule = req.scope.resolve(Modules.ORDER)
      await orderModule.updateOrders(orderId, {
        metadata: {
          payment_provider: "razorpay",
          payment_method: "razorpay_prepaid",
          payment_status: payment.status,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_method: payment.method || null,
          razorpay_amount_paise: payment.amount,
          prepaid: true,
          // Distinguish from COD in admin lists
          fulfillment_payment: "PREPAID",
        },
      })
    } catch (e: any) {
      console.warn("[razorpay/confirm] order metadata:", e?.message || e)
    }

    // Mark payment collection paid so order does not look like unpaid COD
    try {
      const [rel] = await remoteQuery(
        remoteQueryObjectFromString({
          entryPoint: "order_payment_collection",
          variables: { filters: { order_id: orderId } },
          fields: ["payment_collection.id", "payment_collection.status"],
        })
      )
      const pcId = rel?.payment_collection?.id
      if (pcId && rel?.payment_collection?.status !== "completed") {
        await markPaymentCollectionAsPaid(req.scope).run({
          input: {
            payment_collection_id: pcId,
            order_id: orderId,
          },
        })
      }
    } catch (e: any) {
      console.warn("[razorpay/confirm] mark as paid:", e?.message || e)
    }
  }

  const { data: orders } = orderId
    ? await query.graph({
        entity: "order",
        fields: [
          "id",
          "display_id",
          "email",
          "total",
          "subtotal",
          "tax_total",
          "currency_code",
          "status",
          "metadata",
        ],
        filters: { id: orderId },
      })
    : { data: [] }

  res.status(200).json({
    type: "order",
    order: orders?.[0] || { id: orderId },
    payment: {
      provider: "razorpay",
      status: payment.status,
      razorpay_payment_id,
      razorpay_order_id,
      method: payment.method,
      amount_paise: payment.amount,
      verified: true,
    },
  })
}
