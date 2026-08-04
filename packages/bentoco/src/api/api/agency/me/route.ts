import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { withPgClient } from "../../../../utils/pg-client"

export const AUTHENTICATE = false

/**
 * GET /api/agency/me?email=
 * Resolves whether a Medusa user is an agency team member.
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const email = (req.query.email as string | undefined)?.trim().toLowerCase()

  if (!email) {
    res.status(400).json({ error: "email query parameter is required." })
    return
  }

  try {
    const data = await withPgClient(async (client) => {
      const userRes = await client.query(
        `SELECT id, email, first_name, last_name, role
         FROM "user"
         WHERE lower(email) = $1 AND deleted_at IS NULL
         LIMIT 1`,
        [email]
      )

      if (userRes.rows.length === 0) {
        return {
          isAgency: false,
          mode: "merchant" as const,
          user: null,
          agency: null,
          membership: null,
        }
      }

      const user = userRes.rows[0]
      const memberRes = await client.query(
        `
        SELECT
          m.id,
          m.role,
          m.rbac_role,
          m.user_id,
          m.email,
          a.id AS agency_id,
          a.name AS agency_name,
          a.unique_uid,
          a.subdomain
        FROM agency_team_member m
        JOIN agency a ON a.id = m.agency_id
        WHERE m.user_id = $1 OR lower(m.email) = $2
        LIMIT 1
        `,
        [user.id, email]
      )

      if (memberRes.rows.length === 0) {
        return {
          isAgency: false,
          mode: "merchant" as const,
          user: {
            id: user.id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            role: user.role || "MERCHANT",
          },
          agency: null,
          membership: null,
        }
      }

      const m = memberRes.rows[0]
      return {
        isAgency: true,
        mode: "agency" as const,
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: "AGENCY",
        },
        agency: {
          id: m.agency_id,
          name: m.agency_name,
          unique_uid: m.unique_uid,
          subdomain: m.subdomain,
        },
        membership: {
          id: m.id,
          role: m.role,
          rbac_role: m.rbac_role,
          user_id: m.user_id,
          email: m.email,
        },
      }
    })

    res.json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
