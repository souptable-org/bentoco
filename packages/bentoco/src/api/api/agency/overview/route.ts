import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { withPgClient } from "../../../../utils/pg-client"
import { getAgencyOverview } from "../../../../utils/agency-handlers"

export const AUTHENTICATE = false

/**
 * GET /api/agency/overview
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const data = await withPgClient((client) => getAgencyOverview(client))
    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}


