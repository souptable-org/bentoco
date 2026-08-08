/**
 * Edge Subdomain & Custom Domain Resolver Module
 * Resolves incoming hostnames (subdomain.localhost, subdomain.bentoco.com, custom domains)
 * to tenant_id using a high-speed memory/Redis caching strategy.
 */

export interface EdgeTenantResolution {
  tenantId: string | null
  subdomain: string | null
  customDomain: string | null
}

const HOSTNAME_CACHE = new Map<string, string>()

/**
 * Resolves host header (e.g. "brand-a.localhost:3000", "nike.bentoco.com", "nike.com") to tenant_id
 */
export function resolveHostToTenantId(
  host: string,
  customMap?: Record<string, string>
): EdgeTenantResolution {
  if (!host) {
    return { tenantId: null, subdomain: null, customDomain: null }
  }

  // Strip port number if present (e.g. brand-a.localhost:3000 -> brand-a.localhost)
  const cleanHost = host.split(":")[0].toLowerCase()

  // 1. Check in-memory / Redis cache
  if (customMap && customMap[cleanHost]) {
    return {
      tenantId: customMap[cleanHost],
      subdomain: cleanHost.split(".")[0],
      customDomain: cleanHost
    }
  }

  if (HOSTNAME_CACHE.has(cleanHost)) {
    return {
      tenantId: HOSTNAME_CACHE.get(cleanHost)!,
      subdomain: cleanHost.split(".")[0],
      customDomain: cleanHost
    }
  }

  // 2. Parse subdomain for *.localhost or *.bentoco.com
  const parts = cleanHost.split(".")
  if (parts.length > 1 && (parts.includes("localhost") || parts.includes("bentoco"))) {
    const subdomain = parts[0]
    return {
      tenantId: null,
      subdomain: subdomain,
      customDomain: null
    }
  }

  // 3. Custom domain case (e.g. nike.com)
  return {
    tenantId: null,
    subdomain: null,
    customDomain: cleanHost
  }
}

/**
 * Registers hostname -> tenant_id in high-speed cache
 */
export function cacheEdgeTenantMapping(hostname: string, tenantId: string) {
  HOSTNAME_CACHE.set(hostname.toLowerCase(), tenantId)
}

/**
 * Purges hostname cache entry
 */
export function clearEdgeTenantCache(hostname?: string) {
  if (hostname) {
    HOSTNAME_CACHE.delete(hostname.toLowerCase())
  } else {
    HOSTNAME_CACHE.clear()
  }
}
