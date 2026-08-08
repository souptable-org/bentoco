import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { withPgClient } from "../../../../utils/pg-client"
import { getAgencyBilling } from "../../../../utils/agency-handlers"

export const AUTHENTICATE = false

/**
 * GET /api/agency/billing?agencyId=AGENCY-XXXX
 * Live per-active-site metering (no payment processor yet).
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const agencyId =
      (req.query.agencyId as string) ||
      (req.query.agencyUid as string) ||
      undefined
    const data = await withPgClient((client) =>
      getAgencyBilling(client, agencyId)
    )
    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}


