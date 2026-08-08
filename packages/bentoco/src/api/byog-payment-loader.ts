import { Client } from "pg"

export interface TenantPaymentCredentials {
  id: string
  tenantId: string
  providerId: "razorpay" | "cashfree" | "phonepe" | string
  credentials: Record<string, any>
  isActive: boolean
}

/**
 * BYOG (Bring Your Own Gateway) Payment Loader Module
 * Dynamically loads merchant-specific payment gateway credentials (Razorpay, Cashfree, PhonePe)
 * from PostgreSQL based on active tenant_id context, bypassing static single-tenant .env values.
 */
export async function loadTenantPaymentCredentials(
  tenantId: string,
  providerId: string,
  existingClient?: Client
): Promise<TenantPaymentCredentials | null> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not configured.")
  }

  const client = existingClient || new Client({ connectionString })
  const shouldDisconnect = !existingClient

  try {
    if (shouldDisconnect) {
      await client.connect()
    }

    // Set transaction-level RLS context
    await client.query(`SET LOCAL app.current_tenant = '${tenantId}'`)

    const res = await client.query(
      `SELECT id, tenant_id, provider_id, encrypted_payload, is_active 
       FROM tenant_payment_config 
       WHERE tenant_id = $1 AND provider_id = $2 AND is_active = true 
       LIMIT 1`,
      [tenantId, providerId]
    )

    if (res.rows.length === 0) {
      return null
    }

    const row = res.rows[0]
    return {
      id: row.id,
      tenantId: row.tenant_id,
      providerId: row.provider_id,
      credentials: row.encrypted_payload,
      isActive: row.is_active
    }
  } finally {
    if (shouldDisconnect) {
      await client.end()
    }
  }
}

/**
 * Register or Update Merchant Payment Gateway Credentials (BYOG)
 */
export async function saveTenantPaymentCredentials(
  tenantId: string,
  providerId: string,
  credentials: Record<string, any>,
  client: Client
): Promise<void> {
  await client.query(`SET LOCAL app.current_tenant = '${tenantId}'`)

  await client.query(
    `INSERT INTO tenant_payment_config (tenant_id, provider_id, encrypted_payload, is_active)
     VALUES ($1, $2, $3, true)
     ON CONFLICT (tenant_id, provider_id)
     DO UPDATE SET encrypted_payload = EXCLUDED.encrypted_payload, is_active = true, updated_at = NOW()`,
    [tenantId, providerId, JSON.stringify(credentials)]
  )
}
