import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { withPgClient } from "../../../../utils/pg-client"
import { getAccessLog } from "../../../../utils/agency-handlers"

export const AUTHENTICATE = false

/**
 * GET /api/agency/access-log?agencyId=AGENCY-849201&tenantId=optional
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const agencyId = req.query.agencyId as string
  const tenantId = req.query.tenantId as string | undefined

  if (!agencyId) {
    res.status(400).json({ error: "agencyId is required." })
    return
  }

  try {
    const result = await withPgClient((client) =>
      getAccessLog(agencyId, tenantId, client)
    )
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}


