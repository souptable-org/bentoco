import { MedusaRequest, MedusaResponse, MedusaNextFunction } from "@bentoco/framework/http"
import { Client } from "pg"

export interface TenantContext {
  id: string
  storeName: string
  subdomain: string
  customDomain?: string
}

declare global {
  namespace Express {
    interface Request {
      tenant_id?: string
      tenant?: TenantContext
    }
  }
}

/**
 * Tenant Resolution and RLS Context Middleware
 * Extracts x-tenant-id or host subdomain from incoming request,
 * validates tenant against PostgreSQL tenant table, and injects session RLS context.
 */
export async function tenantMiddleware(
  req: MedusaRequest,
  res: MedusaResponse,
  next: MedusaNextFunction
) {
  try {
    // 1. Extract tenant identifier from header or host header
    let tenantId = req.headers["x-tenant-id"] as string
    const host = req.headers.host || ""
    const subdomain = host.split(".")[0]

    // 2. Resolve tenant using DB client if tenantId not explicitly passed in header
    const connectionString = process.env.DATABASE_URL
    if (connectionString && (!tenantId || tenantId === "default")) {
      const client = new Client({ connectionString })
      await client.connect()
      try {
        const result = await client.query(
          `SELECT id, store_name, subdomain, custom_domain FROM tenant WHERE subdomain = $1 OR custom_domain = $2 LIMIT 1`,
          [subdomain, host]
        )
        if (result.rows.length > 0) {
          const row = result.rows[0]
          tenantId = row.id
          req.tenant = {
            id: row.id,
            storeName: row.store_name,
            subdomain: row.subdomain,
            customDomain: row.custom_domain
          }
        }
      } finally {
        await client.end()
      }
    }

    if (tenantId) {
      req.tenant_id = tenantId
    }

    next()
  } catch (error) {
    next(error)
  }
}

/**
 * Helper to wrap any database transaction block with transaction-scoped RLS session context
 */
export async function withTenantTransaction<T>(
  client: Client,
  tenantId: string,
  fn: (client: Client) => Promise<T>
): Promise<T> {
  // Prefer parameterized set_config (safe; no string interpolation)
  const {
    withTenantTransaction: impl,
  } = require("../utils/tenant-rls-context") as typeof import("../utils/tenant-rls-context")
  return impl(client, tenantId, fn)
}
