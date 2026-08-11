import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const MEDUSA_BACKEND = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"

type CachedResolution =
  | { found: true; tenantId: string; expiresAt: number }
  | { found: false; expiresAt: number }

const tenantCache = new Map<string, CachedResolution>()

export async function middleware(request: NextRequest) {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "localhost:3000"
  const url = request.nextUrl.clone()

  // Skip static files, Next.js internal routes, and favicon
  if (
    url.pathname.startsWith("/_next") ||
    url.pathname.startsWith("/static") ||
    url.pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  const hostKey = host.split(":")[0].toLowerCase()
  const isApexHost =
    hostKey === "localhost" ||
    hostKey === "127.0.0.1" ||
    hostKey === "bentoco.in" ||
    hostKey === "www.bentoco.in"

  // 1. Apex / plain localhost
  // - Default: marketing landing (no tenant)
  // - Editor preview: ?tenant_id=…&preview=1 → inject tenant so iframe shows themed store
  if (isApexHost) {
    const previewTenant =
      request.nextUrl.searchParams.get("tenant_id") ||
      request.nextUrl.searchParams.get("preview_tenant") ||
      request.cookies.get("bentoco_preview_tenant_id")?.value ||
      null
    const isPreview =
      request.nextUrl.searchParams.get("preview") === "1" ||
      Boolean(request.nextUrl.searchParams.get("tenant_id")) ||
      Boolean(request.nextUrl.searchParams.get("preview_tenant"))

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set("x-tenant-domain", hostKey)

    if (previewTenant && isPreview) {
      requestHeaders.set("x-tenant-id", previewTenant)
      requestHeaders.delete("x-tenant-not-found")
      requestHeaders.set("x-theme-preview", "1")
      const response = NextResponse.next({ request: { headers: requestHeaders } })
      response.cookies.set("bentoco_tenant_id", previewTenant, {
        path: "/",
        sameSite: "lax",
      })
      response.cookies.set("bentoco_preview_tenant_id", previewTenant, {
        path: "/",
        sameSite: "lax",
      })
      // Avoid caching themed preview HTML in the browser/iframe
      response.headers.set(
        "Cache-Control",
        "no-store, no-cache, must-revalidate"
      )
      return response
    }

    const requestHeadersClear = new Headers(request.headers)
    requestHeadersClear.delete("x-tenant-id")
    requestHeadersClear.set("x-tenant-domain", hostKey)
    const response = NextResponse.next({
      request: { headers: requestHeadersClear },
    })
    response.cookies.delete("bentoco_tenant_id")
    return response
  }

  // 2. Subdomain / Custom Domain Resolution (Fail-Closed)
  let resolvedTenantId: string | null = null
  const now = Date.now()
  const cached = tenantCache.get(hostKey)

  if (cached && cached.expiresAt > now) {
    if (cached.found) {
      resolvedTenantId = cached.tenantId
    }
  } else {
    try {
      const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "pk_60d15336d7c41922c4ac354c4a90da700f0d785c6bb83269983167f444672f49"
      const res = await fetch(`${MEDUSA_BACKEND}/store/tenant/resolve?domain=${encodeURIComponent(host)}`, {
        cache: "no-store",
        headers: { "x-publishable-api-key": publishableKey },
      })

      if (res.ok) {
        const data = await res.json()
        if (data?.tenant_id && typeof data.tenant_id === "string") {
          resolvedTenantId = data.tenant_id
          tenantCache.set(hostKey, { found: true, tenantId: data.tenant_id, expiresAt: now + 5 * 60 * 1000 })
        } else {
          tenantCache.set(hostKey, { found: false, expiresAt: now + 1 * 60 * 1000 })
        }
      } else {
        // 404 or error -> Fail closed
        tenantCache.set(hostKey, { found: false, expiresAt: now + 1 * 60 * 1000 })
      }
    } catch (err) {
      console.warn("[storefront-middleware] Error connecting to domain resolver", err)
    }
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-tenant-domain", hostKey)

  if (resolvedTenantId) {
    // Valid merchant store found -> inject tenant context
    requestHeaders.set("x-tenant-id", resolvedTenantId)
    requestHeaders.delete("x-tenant-not-found")

    const response = NextResponse.next({ request: { headers: requestHeaders } })
    response.cookies.set("bentoco_tenant_id", resolvedTenantId, {
      path: "/",
      sameSite: "lax",
    })
    return response
  } else {
    // Fail Closed: Unknown subdomain -> Mark tenant not found (no default fallback)
    requestHeaders.delete("x-tenant-id")
    requestHeaders.set("x-tenant-not-found", "1")

    const response = NextResponse.next({ request: { headers: requestHeaders } })
    response.cookies.delete("bentoco_tenant_id")
    return response
  }
}
