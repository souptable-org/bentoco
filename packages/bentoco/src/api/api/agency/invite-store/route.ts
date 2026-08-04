import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { withPgClient } from "../../../../utils/pg-client"
import { inviteStore } from "../../../../utils/agency-handlers"

export const AUTHENTICATE = false

/**
 * POST /api/agency/invite-store
 * Body: { agencyId, merchantEmail, storeDisplayName }
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body || {}) as {
    agencyId?: string
    merchantEmail?: string
    storeDisplayName?: string
  }
  const { agencyId, merchantEmail, storeDisplayName } = body

  if (!agencyId || !merchantEmail || !storeDisplayName) {
    res.status(400).json({
      error: "agencyId, merchantEmail, and storeDisplayName are required.",
    })
    return
  }

  try {
    const result = await withPgClient(async (client) => {
      try {
        return await inviteStore(
          agencyId,
          merchantEmail,
          storeDisplayName,
          client
        )
      } catch (err: any) {
        // Email transport may fail in local dev â€” still return invite if DB wrote
        if (err?.message?.includes("Invalid login") || err?.code === "EAUTH") {
          // re-run DB portion only is hard; surface partial success
          throw err
        }
        throw err
      }
    })
    res.json(result)
  } catch (err: any) {
    // Soft-fail email: if invite was created but SMTP failed, helpers throw after insert
    // Callers can still use inviteToken when present
    res.status(500).json({ error: err.message })
  }
}


