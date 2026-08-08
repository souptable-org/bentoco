import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { withPgClient } from "../../../../utils/pg-client"
import {
  listTenantPartners,
  resolveTenantIdForMerchantEmail,
} from "../../../../utils/agency-store-transfer"

export const AUTHENTICATE = false

/**
 * GET /api/agency/partners?tenantId=... | ?email=...
 * Merchant Settings → Users → Agency & Partners table.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    let tenantId = (req.query.tenantId as string) || ""
    const email = (req.query.email as string) || ""

    const data = await withPgClient(async (client) => {
      if (!tenantId && email) {
        tenantId =
          (await resolveTenantIdForMerchantEmail(email, client)) || ""
      }
      if (!tenantId) {
        throw new Error("tenantId or email is required to list partners.")
      }
      return listTenantPartners(tenantId, client)
    })

    res.json(data)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}
