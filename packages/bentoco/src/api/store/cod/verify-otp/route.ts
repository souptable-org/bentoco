import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@bentoco/framework/utils"
import { Client } from "pg"
import { verifyOTPSession } from "../../../../utils/indian-order-state-machine"

type Body = {
  order_id: string
  phone: string
  otp: string
  tenant_id?: string
}

export const POST = async (
  req: MedusaRequest<Body>,
  res: MedusaResponse
) => {
  const body = (req.body || {}) as Body
  const { order_id, phone, otp } = body

  if (!order_id || !phone || !otp) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "order_id, phone, and otp are required"
    )
  }

  const tenantId =
    body.tenant_id || req.tenant_id || process.env.RAZORPAY_DEFAULT_TENANT_ID || "803a80b0-c7e2-4208-aed4-958ac19c08c6"

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured")
  }
  const client = new Client({ connectionString })
  await client.connect()

  let verificationResult
  try {
    verificationResult = await verifyOTPSession(order_id, tenantId, otp, client)
  } finally {
    await client.end()
  }

  if (!verificationResult.success) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      verificationResult.message || "OTP verification failed"
    )
  }

  // Update order metadata to state COD_VERIFIED
  try {
    const orderModule = req.scope.resolve(Modules.ORDER)
    await orderModule.updateOrders(order_id, {
      metadata: {
        payment_provider: "cod",
        payment_method: "cod",
        payment_status: "not_paid",
        prepaid: false,
        indian_status: "COD_VERIFIED",
        cod_phone: phone,
        cod_otp_verified_at: new Date().toISOString(),
        fulfillment_payment: "COD",
      },
    })
  } catch (e: any) {
    console.warn("[cod/verify-otp] order metadata update failed:", e?.message || e)
  }

  // Retrieve updated order
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: orders } = await query.graph({
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
    filters: { id: order_id },
  })

  res.status(200).json({
    success: true,
    order: orders?.[0] || { id: order_id },
    message: verificationResult.message,
  })
}
