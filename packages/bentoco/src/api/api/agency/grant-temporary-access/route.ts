import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import crypto from "crypto"
import { withPgClient } from "../../../../utils/pg-client"

export const AUTHENTICATE = false

/**
 * POST /api/agency/grant-temporary-access
 * Body: { memberEmail, storeId, expiryHours?, agencyId? }
 * Generates a 6-char code, logs it, attempts email (best-effort).
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body || {}) as {
    memberEmail?: string
    storeId?: string
    tenantId?: string
    expiryHours?: number
    agencyId?: string
  }

  const { memberEmail, storeId, tenantId, agencyId } = body
  const expiryHours = body.expiryHours ?? 8

  if (!memberEmail || !(storeId || tenantId)) {
    res.status(400).json({
      error: "memberEmail and storeId (or tenantId) are required.",
    })
    return
  }

  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  let accessCode = ""
  for (let i = 0; i < 6; i++) {
    accessCode += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  const targetId = tenantId || storeId!

  try {
    await withPgClient(async (client) => {
      let realAgencyUuid: string | null = null
      if (agencyId) {
        const a = await client.query(
          `SELECT id FROM agency WHERE unique_uid = $1 OR id::text = $1 LIMIT 1`,
          [agencyId]
        )
        realAgencyUuid = a.rows[0]?.id || null
      }
      if (!realAgencyUuid) {
        const a = await client.query(`SELECT id FROM agency LIMIT 1`)
        realAgencyUuid = a.rows[0]?.id || null
      }
      if (realAgencyUuid) {
        await client.query(
          `
          INSERT INTO agency_store_log
            (agency_id, tenant_id, store_id, member_email, action, metadata)
          VALUES ($1, $2, $3, $4, 'INVITE_SENT', $5)
          `,
          [
            realAgencyUuid,
            targetId,
            storeId || null,
            memberEmail,
            JSON.stringify({
              type: "temporary_access",
              expiryHours,
              codeHash: crypto
                .createHash("sha256")
                .update(accessCode)
                .digest("hex"),
            }),
          ]
        )
      }
    })

    // Email transport is optional in local Stage 4; code returned in non-production.
    console.log(
      `[grant-temporary-access] code for ${memberEmail} store=${targetId} hours=${expiryHours}`
    )

    res.json({
      success: true,
      message: "Access code generated.",
      // Dev-only: return code so local testing works without SMTP
      ...(process.env.NODE_ENV !== "production" ? { accessCode } : {}),
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}


