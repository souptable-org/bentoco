import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { withPgClient } from "../../../../utils/pg-client"

export const AUTHENTICATE = false

/**
 * POST /api/auth/verify-temporary-access
 * Body: { email, accessCode }
 *
 * Stage 5: accepts any 6-char code for known agency members (local/dev).
 * Production should validate hashed codes from grant-temporary-access.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body || {}) as { email?: string; accessCode?: string }
  const email = body.email?.trim().toLowerCase()
  const accessCode = body.accessCode?.trim()

  if (!email || !accessCode) {
    res.status(400).json({ error: "email and accessCode are required." })
    return
  }

  if (accessCode.length < 6) {
    res.status(401).json({ error: "Invalid or expired access code." })
    return
  }

  try {
    const result = await withPgClient(async (client) => {
      const memberRes = await client.query(
        `
        SELECT m.id, m.email, m.role, m.user_id, a.unique_uid, a.name
        FROM agency_team_member m
        JOIN agency a ON a.id = m.agency_id
        WHERE lower(m.email) = $1
        LIMIT 1
        `,
        [email]
      )

      if (memberRes.rows.length === 0) {
        return null
      }

      return memberRes.rows[0]
    })

    if (!result) {
      res.status(401).json({
        error: "No agency membership found for this email.",
      })
      return
    }

    res.json({
      success: true,
      token: "scoped_agency_temp_session",
      user: {
        email: result.email,
        role: "AGENCY_MEMBER",
        membershipId: result.id,
        userId: result.user_id,
        agencyUid: result.unique_uid,
        agencyName: result.name,
      },
      hint: "Use /login with email + password for full Medusa session; this OTP path only proves agency membership.",
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
