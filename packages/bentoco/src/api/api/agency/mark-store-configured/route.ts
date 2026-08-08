import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { withPgClient } from "../../../../utils/pg-client"
import { markStoreConfigured } from "../../../../utils/agency-handlers"

export const AUTHENTICATE = false

/**
 * POST /api/agency/mark-store-configured
 * Finish onboarding for a NEW store → ACTIVE.
 * Body: { tenantId, agencyId?, configuredByEmail, storeName?, subdomain?, states?, gateway?, importSource? }
 */
export const POST = async (req: MedusaRequest, res: MedusaResponse) => {
  const body = (req.body || {}) as {
    tenantId?: string
    agencyId?: string
    configuredByEmail?: string
    email?: string
    storeName?: string
    subdomain?: string
    states?: string[]
    gateway?: string
    importSource?: string
  }

  const tenantId = body.tenantId
  const configuredByEmail = body.configuredByEmail || body.email || "unknown"

  if (!tenantId) {
    res.status(400).json({ error: "tenantId is required." })
    return
  }

  try {
    const result = await withPgClient((client) =>
      markStoreConfigured(
        tenantId,
        body.agencyId,
        configuredByEmail,
        {
          storeName: body.storeName,
          subdomain: body.subdomain,
          states: body.states,
          gateway: body.gateway,
          importSource: body.importSource,
        },
        client
      )
    )
    res.json(result)
  } catch (err: any) {
    res.status(400).json({ error: err.message })
  }
}
