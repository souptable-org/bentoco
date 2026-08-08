import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { withPgClient } from "../../../../utils/pg-client"
import { leaveStore } from "../../../../utils/agency-store-session"

export const AUTHENTICATE = false

/**
 * POST /api/agency/leave-store
 * Body: { sessionToken, email? }
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body || {}) as {
    sessionToken?: string
    email?: string
  }

  const sessionToken =
    body.sessionToken ||
    (req.headers["x-agency-store-session"] as string) ||
    ""

  if (!sessionToken) {
    res.status(400).json({ error: "sessionToken is required." })
    return
  }

  try {
    await withPgClient((client) =>
      leaveStore(client, sessionToken, body.email)
    )
    res.json({ ok: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
