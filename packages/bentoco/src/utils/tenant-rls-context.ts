import type { Client } from "pg"

/**
 * Set transaction-local tenant for Postgres RLS policies.
 * Uses set_config(..., is_local=true) — equivalent to SET LOCAL.
 */
export async function setTenantRlsContext(
  client: Client,
  tenantId: string
): Promise<void> {
  await client.query(`SELECT set_config('app.current_tenant', $1, true)`, [
    tenantId,
  ])
}

/**
 * Clear transaction-local tenant context.
 */
export async function clearTenantRlsContext(client: Client): Promise<void> {
  await client.query(`SELECT set_config('app.current_tenant', '', true)`)
}

/**
 * Run fn inside a transaction with app.current_tenant set for RLS.
 */
export async function withTenantTransaction<T>(
  client: Client,
  tenantId: string,
  fn: (client: Client) => Promise<T>
): Promise<T> {
  await client.query("BEGIN")
  try {
    await setTenantRlsContext(client, tenantId)
    const result = await fn(client)
    await client.query("COMMIT")
    return result
  } catch (error) {
    await client.query("ROLLBACK")
    throw error
  }
}

/**
 * Prefer this for Bentoco custom APIs that must respect RLS.
 * Connects as bentoco_app when DATABASE_APP_URL is set, else DATABASE_URL.
 */
export function getTenantAppDatabaseUrl(): string {
  if (process.env.DATABASE_APP_URL) {
    return process.env.DATABASE_APP_URL
  }
  const base =
    process.env.DATABASE_URL ||
    "postgres://postgres:postgres@localhost:5432/bentoco"
  // Derive bentoco_app URL from admin URL when possible
  try {
    const u = new URL(base)
    u.username = "bentoco_app"
    u.password = process.env.BENTOCO_APP_PASSWORD || "bentoco_app_pass"
    return u.toString()
  } catch {
    return base.replace(
      /postgres:\/\/[^@]+@/,
      "postgres://bentoco_app:bentoco_app_pass@"
    )
  }
}
