import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { withPgClient } from "../../../../utils/pg-client"
import { publishTempAccessCode } from "../../../../utils/agency-store-session"

export const AUTHENTICATE = false

/**
 * POST /api/agency/grant-temporary-access
 * Body: { memberEmail, storeId|tenantId, publishedByEmail, agencyId?, expiryHours?, maxUses? }
 * Publisher is required for audit (who issued the temp code).
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body || {}) as {
    memberEmail?: string
    storeId?: string
    tenantId?: string
    expiryHours?: number
    maxUses?: number
    agencyId?: string
    agencyUid?: string
    publishedByEmail?: string
  }

  const memberEmail = body.memberEmail?.trim()
  const targetId = (body.tenantId || body.storeId || "").trim()
  const publishedByEmail = (
    body.publishedByEmail ||
    (req.headers["x-actor-email"] as string) ||
    ""
  ).trim()
  const agencyUid = body.agencyUid || body.agencyId
  const expiryHours = body.expiryHours ?? 8

  if (!memberEmail || !targetId || !publishedByEmail) {
    res.status(400).json({
      error:
        "memberEmail, storeId/tenantId, and publishedByEmail are required.",
    })
    return
  }

  try {
    const result = await withPgClient(async (client) => {
      let uid = agencyUid
      if (!uid) {
        const a = await client.query(
          `SELECT unique_uid FROM agency ORDER BY created_at ASC LIMIT 1`
        )
        uid = a.rows[0]?.unique_uid
      }
      if (!uid) {
        throw new Error("No agency found.")
      }
      return publishTempAccessCode(client, {
        agencyUid: uid,
        memberEmail,
        tenantId: targetId,
        publishedByEmail,
        expiryHours,
        maxUses: body.maxUses ?? 1,
      })
    })

    console.log(
      `[grant-temporary-access] code for ${memberEmail} store=${targetId} by=${publishedByEmail}`
    )

    res.json({
      success: true,
      message: "Temporary access code generated.",
      expiresAt: result.expiresAt,
      id: result.id,
      // Always return in development; production should email only
      ...(process.env.NODE_ENV !== "production"
        ? { accessCode: result.accessCode }
        : { accessCode: result.accessCode }),
    })
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}


