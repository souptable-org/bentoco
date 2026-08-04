import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { withPgClient } from "../../../../utils/pg-client"
import { agencyMemberLogin } from "../../../../utils/agency-handlers"

export const AUTHENTICATE = false

/**
 * POST /api/agency/member-login
 * Body: { agencyId, memberId, tenantId }
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body || {}) as {
    agencyId?: string
    memberId?: string
    tenantId?: string
  }
  const { agencyId, memberId, tenantId } = body
  const ipAddress =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown"

  if (!agencyId || !memberId || !tenantId) {
    res.status(400).json({
      error: "agencyId, memberId, and tenantId are required.",
    })
    return
  }

  try {
    const result = await withPgClient((client) =>
      agencyMemberLogin(agencyId, memberId, tenantId, ipAddress, client)
    )
    if (!result.allowed) {
      res.status(403).json({ error: result.reason })
      return
    }
    res.json(result)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}


