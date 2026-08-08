import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { withPgClient } from "../../../../utils/pg-client"
import { completeAgencyInvite } from "../../../../utils/agency-handlers"

export const AUTHENTICATE = false

/**
 * POST /api/agency/complete-invite
 * Merchant completes agency invite after signup/login + 6-digit agency code.
 * Body: { inviteToken, agencyCode, merchantEmail, storeDisplayName? }
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body || {}) as {
    inviteToken?: string
    agencyCode?: string
    agencyUid?: string
    merchantEmail?: string
    email?: string
    storeDisplayName?: string
  }

  const inviteToken = body.inviteToken
  const agencyCode = body.agencyCode || body.agencyUid
  const merchantEmail = body.merchantEmail || body.email

  if (!inviteToken || !agencyCode || !merchantEmail) {
    res.status(400).json({
      error: "inviteToken, agencyCode, and merchantEmail are required.",
    })
    return
  }

  try {
    const result = await withPgClient((client) =>
      completeAgencyInvite(
        inviteToken,
        agencyCode,
        merchantEmail,
        body.storeDisplayName,
        client
      )
    )
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}
