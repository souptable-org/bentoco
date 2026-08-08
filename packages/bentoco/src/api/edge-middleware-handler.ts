import { resolveHostToTenantId } from "./edge-tenant-resolver"

export interface EdgeNextRequestLike {
  headers: {
    get?: (name: string) => string | null
    [key: string]: any
  }
  url?: string
}

export interface EdgeMiddlewareResult {
  tenantId: string | null
  subdomain: string | null
  customDomain: string | null
  headers: Record<string, string>
}

/**
 * Next.js Edge Middleware Handler
 * Intercepts incoming requests at the network edge, resolves domain/subdomain to tenant_id,
 * and attaches x-tenant-id, x-tenant-subdomain, and x-tenant-custom-domain headers.
 */
export function handleEdgeTenantMiddleware(
  req: EdgeNextRequestLike,
  customMap?: Record<string, string>
): EdgeMiddlewareResult {
  let host = ""
  if (typeof req.headers.get === "function") {
    host = req.headers.get("host") || ""
  } else if (typeof req.headers === "object") {
    host = (req.headers["host"] as string) || ""
  }

  let explicitTenantId: string | null = null
  if (typeof req.headers.get === "function") {
    explicitTenantId = req.headers.get("x-tenant-id")
  } else if (typeof req.headers === "object") {
    explicitTenantId = (req.headers["x-tenant-id"] as string) || null
  }

  const resolution = resolveHostToTenantId(host, customMap)
  const finalTenantId = explicitTenantId || resolution.tenantId

  const responseHeaders: Record<string, string> = {}
  if (finalTenantId) {
    responseHeaders["x-tenant-id"] = finalTenantId
  }
  if (resolution.subdomain) {
    responseHeaders["x-tenant-subdomain"] = resolution.subdomain
  }
  if (resolution.customDomain) {
    responseHeaders["x-tenant-custom-domain"] = resolution.customDomain
  }

  return {
    tenantId: finalTenantId || null,
    subdomain: resolution.subdomain,
    customDomain: resolution.customDomain,
    headers: responseHeaders
  }
}
