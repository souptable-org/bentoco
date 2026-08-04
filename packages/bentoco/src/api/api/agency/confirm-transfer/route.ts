import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { withPgClient } from "../../../../utils/pg-client"
import { approveStoreDelegation } from "../../../../utils/agency-handlers"

export const AUTHENTICATE = false

/**
 * POST /api/agency/confirm-transfer
 * Body: { storeId | tenantId, targetMasterUid | agencyUid, confirmationCode }
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body || {}) as {
    storeId?: string
    tenantId?: string
    targetMasterUid?: string
    agencyUid?: string
    confirmationCode?: string
  }

  const tenantId = body.tenantId || body.storeId
  const agencyUid = body.targetMasterUid || body.agencyUid
  const confirmationCode = body.confirmationCode

  if (!tenantId || !agencyUid || !confirmationCode) {
    res.status(400).json({
      error:
        "tenantId (or storeId), targetMasterUid (or agencyUid), and confirmationCode are required.",
    })
    return
  }

  try {
    const result = await withPgClient((client) =>
      approveStoreDelegation(tenantId, agencyUid, confirmationCode, client)
    )
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}


