import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { withPgClient } from "../../../../utils/pg-client"
import { getAgencyStores } from "../../../../utils/agency-handlers"

export const AUTHENTICATE = false

/**
 * GET /api/agency/stores?agencyId=AGENCY-849201
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  try {
    const agencyId =
      (req.query.agencyId as string) ||
      (req.query.agencyUid as string) ||
      undefined
    const data = await withPgClient((client) =>
      getAgencyStores(client, agencyId)
    )
    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}


