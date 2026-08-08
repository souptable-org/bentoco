import {
  completeCartWorkflowId,
  createPaymentCollectionForCartWorkflowId,
} from "@bentoco/core-flows"
import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  remoteQueryObjectFromString,
} from "@bentoco/framework/utils"
import { Client } from "pg"
import { createOTPSession } from "../../../../utils/indian-order-state-machine"

type Body = {
  cart_id: string
  phone: string
  tenant_id?: string
}

export const POST = async (
  req: MedusaRequest<Body>,
  res: MedusaResponse
) => {
  const body = (req.body || {}) as Body
  const { cart_id, phone } = body

  if (!cart_id || !phone) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "cart_id and phone are required"
    )
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

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
      "shipping_address.phone"
    ],
    filters: { id: cart_id },
  })
  const cart = carts?.[0]
  if (!cart) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Cart ${cart_id} not found`)
  }

  const tenantId =
    body.tenant_id || req.tenant_id || process.env.RAZORPAY_DEFAULT_TENANT_ID || "803a80b0-c7e2-4208-aed4-958ac19c08c6"

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
        amount: Number(cart.total ?? 0),
        data: {},
      })
    }
  } catch (e: any) {
    console.warn("[cod/request-otp] payment session:", e?.message || e)
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
      err?.message || "Cart completion failed"
    )
  }

  const orderId = result?.id
  if (!orderId) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Order could not be created from cart"
    )
  }

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured")
  }
  const client = new Client({ connectionString })
  await client.connect()

  let otpResult
  try {
    otpResult = await createOTPSession(orderId, tenantId, phone, client)
  } finally {
    await client.end()
  }

  console.log(`[COD OTP] Sent OTP ${otpResult.rawOtp} to phone ${phone} for Order ${orderId}`)

  res.status(200).json({
    success: true,
    order_id: orderId,
    phone: phone,
    otp: process.env.NODE_ENV !== "production" ? otpResult.rawOtp : undefined,
  })
}
