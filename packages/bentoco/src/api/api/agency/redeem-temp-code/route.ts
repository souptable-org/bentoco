import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { withPgClient } from "../../../../utils/pg-client"
import { redeemTempAccessCode } from "../../../../utils/agency-store-session"

export const AUTHENTICATE = false

/**
 * POST /api/agency/redeem-temp-code
 * Body: { email, accessCode }
 *
 * Limited bypass of agency shell — still creates assume-store session with limits.
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body || {}) as {
    email?: string
    accessCode?: string
    code?: string
  }

  const email = body.email?.trim()
  const accessCode = (body.accessCode || body.code || "").trim()

  if (!email || !accessCode) {
    res.status(400).json({ error: "email and accessCode are required." })
    return
  }

  const ipAddress =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown"

  try {
    const result = await withPgClient((client) =>
      redeemTempAccessCode(client, { email, accessCode, ipAddress })
    )

    if (!result.allowed) {
      res.status(403).json({ error: result.reason, allowed: false })
      return
    }

    res.json({
      allowed: true,
      sessionToken: result.sessionToken,
      expiresAt: result.expiresAt,
      tenantId: result.tenantId,
      storeName: result.storeName,
      subdomain: result.subdomain,
      agencyUid: result.agencyUid,
      agencyName: result.agencyName,
      memberEmail: result.memberEmail,
      authMethod: result.authMethod,
      publishedByEmail: result.publishedByEmail,
      openPath: `/?tenant_id=${encodeURIComponent(result.tenantId!)}`,
      limited: true,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
