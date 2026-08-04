import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { withPgClient } from "../../../../utils/pg-client"
import { initiateStoreDelegationToAgency } from "../../../../utils/agency-handlers"

export const AUTHENTICATE = false

/**
 * POST /api/agency/transfer-store
 * Body: { storeId | tenantId, targetMasterUid | agencyUid }
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body || {}) as {
    storeId?: string
    tenantId?: string
    targetMasterUid?: string
    agencyUid?: string
  }

  const tenantId = body.tenantId || body.storeId
  const agencyUid = body.targetMasterUid || body.agencyUid

  if (!tenantId || !agencyUid) {
    res.status(400).json({
      error: "tenantId (or storeId) and targetMasterUid (or agencyUid) are required.",
    })
    return
  }

  try {
    const result = await withPgClient((client) =>
      initiateStoreDelegationToAgency(tenantId, agencyUid, client)
    )
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}


