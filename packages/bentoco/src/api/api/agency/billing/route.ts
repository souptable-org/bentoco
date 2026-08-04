import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { getAgencyBilling } from "../../../../utils/agency-handlers"

export const AUTHENTICATE = false

/**
 * GET /api/agency/billing
 */
export const GET = async (_req: MedusaRequest, res: MedusaResponse) => {
  res.json(await getAgencyBilling())
}


