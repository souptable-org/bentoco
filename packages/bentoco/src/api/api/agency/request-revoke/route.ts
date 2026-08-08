import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { withPgClient } from "../../../../utils/pg-client"
import { requestRevokeAccess } from "../../../../utils/agency-handlers"

export const AUTHENTICATE = false

/**
 * POST /api/agency/request-revoke
 * Merchant requests revoke — status → REVOKE_REQUESTED (agency must accept).
 * Body: { agencyId, tenantId, requestedByEmail }
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body || {}) as {
    agencyId?: string
    tenantId?: string
    requestedByEmail?: string
    revokedByEmail?: string
  }
  const agencyId = body.agencyId
  const tenantId = body.tenantId
  const requestedByEmail = body.requestedByEmail || body.revokedByEmail

  if (!agencyId || !tenantId || !requestedByEmail) {
    res.status(400).json({
      error: "agencyId, tenantId, and requestedByEmail are required.",
    })
    return
  }

  try {
    const result = await withPgClient((client) =>
      requestRevokeAccess(agencyId, tenantId, requestedByEmail, client)
    )
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}
