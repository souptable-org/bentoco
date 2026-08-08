/**
 * Bentoco Admin Mode & Domain Resolver
 * Resolves incoming requests to AGENCY Mode (agency.bentoco.com) vs MERCHANT Mode (app.bentoco.com),
 * enforcing strict UI isolation and purging Agency routes in Merchant Mode.
 */

export type BentocoAdminMode = "AGENCY" | "MERCHANT"

export interface AdminModeResolution {
  mode: BentocoAdminMode
  hostname: string
  isAgencyHost: boolean
  isMerchantHost: boolean
  blockedRoutes: string[]
}

/**
 * Resolves Host header & URL path to Agency vs Merchant Admin Mode
 */
export function resolveAdminMode(host: string, pathname: string = "/"): AdminModeResolution {
  const cleanHost = (host || "").split(":")[0].toLowerCase()
  const cleanPath = (pathname || "/").toLowerCase()

  // 1. Check if Host is Agency Master Subdomain (agency.bentoco.com or agency.localhost)
  const isAgencyHost =
    cleanHost === "agency.bentoco.com" ||
    cleanHost === "agency.localhost" ||
    cleanHost.startsWith("agency.")

  const mode: BentocoAdminMode = isAgencyHost ? "AGENCY" : "MERCHANT"

  // 2. Blocked routes in Merchant Mode
  const blockedRoutes: string[] = []
  if (mode === "MERCHANT") {
    if (
      cleanPath.startsWith("/agency") ||
      cleanPath.startsWith("/stores/new") ||
      cleanPath.startsWith("/billing/agency") ||
      cleanPath.startsWith("/team/agency")
    ) {
      blockedRoutes.push(cleanPath)
    }
  }

  return {
    mode,
    hostname: cleanHost,
    isAgencyHost,
    isMerchantHost: !isAgencyHost,
    blockedRoutes,
  }
}

/**
 * Next.js / Express Middleware Handler for Admin Mode Resolution
 */
export function adminModeMiddlewareHandler(
  host: string,
  pathname: string = "/"
): {
  headers: Record<string, string>
  isBlocked: boolean
  redirectTo?: string
} {
  const resolution = resolveAdminMode(host, pathname)

  if (resolution.blockedRoutes.length > 0) {
    return {
      headers: {
        "x-bentoco-mode": "MERCHANT",
      },
      isBlocked: true,
      redirectTo: "/dashboard", // Redirect blocked Agency routes in Merchant mode to standard dashboard
    }
  }

  return {
    headers: {
      "x-bentoco-mode": resolution.mode,
      "x-bentoco-agency-host": resolution.isAgencyHost ? "true" : "false",
    },
    isBlocked: false,
  }
}
