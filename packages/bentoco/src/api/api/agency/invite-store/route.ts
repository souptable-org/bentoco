import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { withPgClient } from "../../../../utils/pg-client"
import { inviteStore } from "../../../../utils/agency-handlers"

export const AUTHENTICATE = false

/**
 * POST /api/agency/invite-store
 * Agency invites merchant — does NOT create the store.
 * Body: { agencyId, merchantEmail, storeDisplayName, inviteType? }
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body || {}) as {
    agencyId?: string
    merchantEmail?: string
    storeDisplayName?: string
    inviteType?: "new_merchant" | "existing_merchant"
  }
  const { agencyId, merchantEmail, storeDisplayName } = body
  const inviteType = body.inviteType || "new_merchant"

  if (!agencyId || !merchantEmail) {
    res.status(400).json({
      error: "agencyId and merchantEmail are required.",
    })
    return
  }

  const name =
    storeDisplayName?.trim() ||
    (inviteType === "existing_merchant"
      ? "Existing store"
      : merchantEmail.split("@")[0] || "New store")

  try {
    const result = await withPgClient((client) =>
      inviteStore(agencyId, merchantEmail, name, client, inviteType)
    )
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}
