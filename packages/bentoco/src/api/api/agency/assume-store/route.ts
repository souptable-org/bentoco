import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { withPgClient } from "../../../../utils/pg-client"
import { assumeStore } from "../../../../utils/agency-store-session"

export const AUTHENTICATE = false

/**
 * POST /api/agency/assume-store
 * Body: { email, tenantId, agencyUid? }
 *
 * Agency airlock: only after this succeeds may the actor use merchant admin
 * for that tenant (via x-agency-store-session header).
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body || {}) as {
    email?: string
    tenantId?: string
    storeId?: string
    agencyUid?: string
    agencyId?: string
  }

  const email = body.email?.trim()
  const tenantId = (body.tenantId || body.storeId || "").trim()
  const agencyUid = body.agencyUid || body.agencyId

  if (!email || !tenantId) {
    res.status(400).json({ error: "email and tenantId are required." })
    return
  }

  const ipAddress =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown"

  try {
    const result = await withPgClient((client) =>
      assumeStore(client, {
        email,
        tenantId,
        agencyUid,
        ipAddress,
        authMethod: "password_assume",
      })
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
      rbacRole: result.rbacRole,
      authMethod: result.authMethod,
      // Same-origin merchant entry (agency tab stays open)
      openPath: `/?tenant_id=${encodeURIComponent(result.tenantId!)}`,
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
}
