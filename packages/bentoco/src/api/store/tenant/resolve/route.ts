import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { withPgClient } from "../../../../utils/pg-client"

type TenantResolveResult = {
  tenant_id: string
  store_name: string
  subdomain: string | null
  custom_domain: string | null
}

// In-memory resolution cache (5-minute TTL)
const cache = new Map<string, { data: TenantResolveResult; expiresAt: number }>()

function parseDomain(rawHost?: string | null): { domain: string; subdomain: string | null } {
  if (!rawHost) return { domain: "localhost", subdomain: null }
  const hostWithoutPort = rawHost.split(":")[0].toLowerCase().trim()

  if (hostWithoutPort === "localhost" || hostWithoutPort === "127.0.0.1") {
    return { domain: hostWithoutPort, subdomain: null }
  }

  const parts = hostWithoutPort.split(".")
  if (parts.length > 2 || (parts.length === 2 && parts[1] === "localhost")) {
    return { domain: hostWithoutPort, subdomain: parts[0] }
  }

  return { domain: hostWithoutPort, subdomain: null }
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const queryDomain = (req.query.domain as string) || req.headers["x-forwarded-host"] || req.headers["host"]
  const { domain, subdomain } = parseDomain(queryDomain as string)

  // Apex domain / localhost requests do not have tenant subdomains
  if (!subdomain && (domain === "localhost" || domain === "127.0.0.1" || domain === "bentoco.in")) {
    return res.status(404).json({ message: "Apex domain request. No tenant assigned." })
  }

  const cacheKey = subdomain || domain
  const now = Date.now()
  const cached = cache.get(cacheKey)

  if (cached && cached.expiresAt > now) {
    return res.json(cached.data)
  }

  try {
    const tenantData = await withPgClient(async (client) => {
      // Strictly match custom_domain or subdomain. Fail closed if no match.
      const result = await client.query<TenantResolveResult>(
        `SELECT id as tenant_id, store_name, subdomain, custom_domain
         FROM tenant
         WHERE custom_domain = $1 OR subdomain = $2
         LIMIT 1`,
        [domain, subdomain || domain]
      )

      if (!result.rows.length) {
        return null
      }

      return result.rows[0]
    })

    if (!tenantData) {
      return res.status(404).json({ message: "Tenant not found for domain", domain, subdomain })
    }

    cache.set(cacheKey, { data: tenantData, expiresAt: now + 5 * 60 * 1000 })
    return res.json(tenantData)
  } catch (err: any) {
    console.error("[tenant-resolve] Error resolving domain", err)
    return res.status(500).json({ message: err?.message || "Internal server error" })
  }
}
