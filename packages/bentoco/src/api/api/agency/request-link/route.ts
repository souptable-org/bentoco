import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { withPgClient } from "../../../../utils/pg-client"
import {
  requestAgencyLink,
  resolveTenantIdForMerchantEmail,
} from "../../../../utils/agency-handlers"

export const AUTHENTICATE = false

/**
 * POST /api/agency/request-link
 * Merchant requests agency access (PENDING). Agency must accept.
 * Body: { agencyCode | agencyUid, tenantId?, email?, merchantEmail? }
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body || {}) as {
    agencyCode?: string
    agencyUid?: string
    tenantId?: string
    storeId?: string
    email?: string
    merchantEmail?: string
  }

  const agencyCode = body.agencyCode || body.agencyUid
  const merchantEmail = body.merchantEmail || body.email
  let tenantId = body.tenantId || body.storeId

  if (!agencyCode) {
    res.status(400).json({
      error: "agencyCode (6-digit) is required.",
    })
    return
  }

  try {
    const result = await withPgClient(async (client) => {
      if (!tenantId && merchantEmail) {
        tenantId =
          (await resolveTenantIdForMerchantEmail(merchantEmail, client)) ||
          undefined
      }
      if (!tenantId) {
        throw new Error(
          "tenantId or merchant email is required to resolve the store."
        )
      }
      return requestAgencyLink(
        tenantId,
        agencyCode,
        merchantEmail || "merchant@unknown.local",
        client
      )
    })
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}
