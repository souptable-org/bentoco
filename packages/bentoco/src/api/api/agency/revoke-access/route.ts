import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { withPgClient } from "../../../../utils/pg-client"
import { revokeAccess } from "../../../../utils/agency-handlers"

export const AUTHENTICATE = false

/**
 * DELETE /api/agency/revoke-access
 * Body: { agencyId, tenantId, revokedByEmail }
 */
export const DELETE = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body || {}) as {
    agencyId?: string
    tenantId?: string
    revokedByEmail?: string
  }
  const { agencyId, tenantId, revokedByEmail } = body

  if (!agencyId || !tenantId || !revokedByEmail) {
    res.status(400).json({
      error: "agencyId, tenantId, and revokedByEmail are required.",
    })
    return
  }

  try {
    const result = await withPgClient((client) =>
      revokeAccess(agencyId, tenantId, revokedByEmail, client)
    )
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}


