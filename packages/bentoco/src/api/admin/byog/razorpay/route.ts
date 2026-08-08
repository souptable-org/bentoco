import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@bentoco/framework/http"
import { MedusaError } from "@bentoco/framework/utils"
import {
  resolveRazorpayCredentials,
  saveRazorpayCredentials,
  razorpayRequest,
} from "../../../../utils/razorpay-byok"

type Body = {
  tenant_id?: string
  key_id?: string
  key_secret?: string
  webhook_secret?: string
  business_name?: string
  test_connection?: boolean
}

function defaultTenantId(body?: Body): string {
  return (
    body?.tenant_id ||
    process.env.RAZORPAY_DEFAULT_TENANT_ID ||
    // Alpha Textiles demo tenant (local seed)
    "803a80b0-c7e2-4208-aed4-958ac19c08c6"
  )
}

/**
 * GET /admin/byog/razorpay
 * Returns whether BYOK keys are configured (never returns secret).
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const tenantId =
    (req.query.tenant_id as string) || defaultTenantId()
  const creds = await resolveRazorpayCredentials(tenantId)
  res.status(200).json({
    configured: Boolean(creds?.key_id && creds?.key_secret),
    tenant_id: tenantId,
    key_id_masked: creds?.key_id
      ? `${creds.key_id.slice(0, 8)}…`
      : null,
    business_name: creds?.business_name || null,
    source: creds
      ? process.env.RAZORPAY_KEY_ID &&
        creds.key_id === process.env.RAZORPAY_KEY_ID.trim()
        ? "env"
        : "tenant_payment_config"
      : null,
  })
}

/**
 * POST /admin/byog/razorpay
 * Save merchant Razorpay keys (BYOK). Optional test_connection hits /orders with ₹1.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<Body>,
  res: MedusaResponse
) => {
  const body = req.validatedBody || (req.body as Body)
  const tenantId = defaultTenantId(body)

  if (!body.key_id?.trim() || !body.key_secret?.trim()) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "key_id and key_secret are required"
    )
  }

  const credentials = {
    key_id: body.key_id.trim(),
    key_secret: body.key_secret.trim(),
    webhook_secret: body.webhook_secret?.trim() || undefined,
    business_name: body.business_name?.trim() || undefined,
  }

  if (body.test_connection !== false) {
    // Minimal auth check — list orders limit 1
    try {
      await razorpayRequest(credentials, "GET", "/orders?count=1")
    } catch (e: any) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Razorpay rejected these keys: ${e?.message || "auth failed"}`
      )
    }
  }

  await saveRazorpayCredentials(tenantId, credentials)

  res.status(200).json({
    saved: true,
    tenant_id: tenantId,
    key_id_masked: `${credentials.key_id.slice(0, 8)}…`,
    message:
      "BYOK Razorpay keys saved. Payments will settle to this merchant’s Razorpay account.",
  })
}
