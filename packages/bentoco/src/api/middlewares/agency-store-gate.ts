/**
 * Admin gate: agency members may only hit /admin/* when they hold a valid
 * assume-store session (opened from Agency console) or an equivalent temp-code session.
 * Merchants (non-agency users) pass through unchanged.
 */

import type {
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
} from "@bentoco/framework/http"
import { withPgClient } from "../../utils/pg-client"
import {
  isAgencyMemberEmail,
  validateStoreSession,
} from "../../utils/agency-store-session"

const SESSION_HEADER = "x-agency-store-session"
const TENANT_HEADER = "x-tenant-id"

/** Paths agency members may call without assume-store (identity only). */
const AGENCY_ALLOW_WITHOUT_SESSION = [
  /^\/admin\/users\/me$/i,
  /^\/admin\/users\/me\//i,
  /^\/admin\/notifications/i,
  /^\/admin\/feature-flags/i,
]

async function getActorEmail(req: MedusaRequest): Promise<string | null> {
  const auth = (req as any).auth_context || (req as any).auth
  const user = (req as any).user
  if (user?.email) {
    return String(user.email).toLowerCase()
  }
  if (auth?.app_metadata?.email) {
    return String(auth.app_metadata.email).toLowerCase()
  }
  // Dashboard sets this after assume-store / agency login
  const h = req.headers["x-actor-email"]
  if (typeof h === "string" && h.includes("@")) {
    return h.toLowerCase()
  }

  const actorId = auth?.actor_id || auth?.user_id
  if (actorId && String(actorId).includes("@")) {
    return String(actorId).toLowerCase()
  }

  // Resolve Medusa user id → email
  if (actorId) {
    try {
      const row = await withPgClient(async (client) => {
        const r = await client.query(
          `SELECT email FROM "user" WHERE id = $1 AND deleted_at IS NULL LIMIT 1`,
          [String(actorId)]
        )
        return r.rows[0]?.email as string | undefined
      })
      if (row) {
        return String(row).toLowerCase()
      }
    } catch {
      // ignore lookup failures
    }
  }

  return null
}

export async function agencyStoreGate(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    // Only gate admin API
    const path = req.originalUrl || req.url || ""
    if (!path.startsWith("/admin")) {
      return next()
    }

    const email = await getActorEmail(req)
    if (!email) {
      // Unauthenticated or unresolved — let Medusa auth handle 401
      return next()
    }

    const isMember = await withPgClient((client) =>
      isAgencyMemberEmail(client, email)
    )

    if (!isMember) {
      // Pure merchant path
      return next()
    }

    // Agency member: allow a few identity endpoints without store session
    if (AGENCY_ALLOW_WITHOUT_SESSION.some((re) => re.test(path.split("?")[0]))) {
      return next()
    }

    const sessionToken =
      (req.headers[SESSION_HEADER] as string) ||
      (req.headers["x-bentoco-store-session"] as string) ||
      ""
    const tenantId =
      (req.headers[TENANT_HEADER] as string) ||
      (req.query?.tenant_id as string) ||
      ""

    if (!sessionToken) {
      res.status(403).json({
        type: "not_allowed",
        message:
          "Agency members must open a store from the Agency console (Open store). Direct merchant admin access is blocked.",
        code: "AGENCY_ASSUME_REQUIRED",
      })
      return
    }

    const session = await withPgClient((client) =>
      validateStoreSession(client, sessionToken, tenantId || undefined)
    )

    if (!session) {
      res.status(403).json({
        type: "not_allowed",
        message:
          "Store session missing, expired, or revoked. Return to Agency console and open the store again.",
        code: "AGENCY_SESSION_INVALID",
      })
      return
    }

    // Session email must match authenticated actor
    if (session.member_email.toLowerCase() !== email) {
      res.status(403).json({
        type: "not_allowed",
        message: "Store session does not belong to this user.",
        code: "AGENCY_SESSION_MISMATCH",
      })
      return
    }

    // Inject tenant for downstream RLS / handlers
    ;(req as any).tenant_id = session.tenant_id
    ;(req as any).agency_store_session = session
    if (!req.headers[TENANT_HEADER]) {
      req.headers[TENANT_HEADER] = session.tenant_id
    }

    return next()
  } catch (err) {
    console.error("[agencyStoreGate]", err)
    return next(err)
  }
}
