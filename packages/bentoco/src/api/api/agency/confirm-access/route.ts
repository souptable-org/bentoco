import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { withPgClient } from "../../../../utils/pg-client"
import { confirmAccess } from "../../../../utils/agency-handlers"

export const AUTHENTICATE = false

/**
 * GET /api/agency/confirm-access?token=xxx
 * Public merchant consent link.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const token = req.query.token as string
  if (!token) {
    res.status(400).json({ error: "token is required." })
    return
  }

  try {
    const result = await withPgClient((client) => confirmAccess(token, client))
    res.json({ ...result, redirectTo: "/agency/access-confirmed" })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}


