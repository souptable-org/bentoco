import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { withPgClient } from "../../../../utils/pg-client"
import { acceptAgencyLink } from "../../../../utils/agency-handlers"

export const AUTHENTICATE = false

/**
 * POST /api/agency/accept-link
 * Agency accepts merchant access request (PENDING → ACTIVE).
 * Body: { agencyId, tenantId, acceptedByEmail }
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body || {}) as {
    agencyId?: string
    agencyUid?: string
    tenantId?: string
    storeId?: string
    acceptedByEmail?: string
  }

  const agencyId = body.agencyId || body.agencyUid
  const tenantId = body.tenantId || body.storeId
  const acceptedByEmail = body.acceptedByEmail

  if (!agencyId || !tenantId || !acceptedByEmail) {
    res.status(400).json({
      error: "agencyId, tenantId, and acceptedByEmail are required.",
    })
    return
  }

  try {
    const result = await withPgClient((client) =>
      acceptAgencyLink(tenantId, agencyId, acceptedByEmail, client)
    )
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}
