import crypto from "crypto"
import { Client } from "pg"

export type RazorpayCredentials = {
  key_id: string
  key_secret: string
  webhook_secret?: string
  /** Display name on Checkout */
  business_name?: string
}

export type RazorpayOrder = {
  id: string
  amount: number
  currency: string
  status: string
  receipt?: string
}

export type RazorpayPayment = {
  id: string
  order_id: string
  status: string
  method?: string
  amount: number
  currency: string
  email?: string
  contact?: string
  captured?: boolean
}

const RAZORPAY_API = "https://api.razorpay.com/v1"

const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(process.env.ENCRYPTION_SECRET || process.env.JWT_SECRET || "bentoco-secret-encryption-key")
  .digest()

function encryptPayload(data: Record<string, unknown>): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv)
  let encrypted = cipher.update(JSON.stringify(data), "utf8", "hex")
  encrypted += cipher.final("hex")
  const authTag = cipher.getAuthTag().toString("hex")
  return JSON.stringify({
    iv: iv.toString("hex"),
    content: encrypted,
    tag: authTag,
  })
}

function decryptPayload(encryptedString: any): Record<string, unknown> | null {
  try {
    let parsed = typeof encryptedString === "string" ? JSON.parse(encryptedString) : encryptedString
    if (!parsed || !parsed.iv || !parsed.content || !parsed.tag) {
      // Legacy unencrypted JSON fallback
      return parsed
    }
    const decipher = crypto.createDecipheriv(
      "aes-256-gcm",
      ENCRYPTION_KEY,
      Buffer.from(parsed.iv, "hex")
    )
    decipher.setAuthTag(Buffer.from(parsed.tag, "hex"))
    let decrypted = decipher.update(parsed.content, "hex", "utf8")
    decrypted += decipher.final("utf8")
    return JSON.parse(decrypted)
  } catch (err) {
    console.error("[razorpay-byok] Decryption failed:", err)
    return null
  }
}

/**
 * Resolve BYOK credentials strictly from tenant_payment_config in the database.
 */
export async function resolveRazorpayCredentials(
  tenantId?: string | null
): Promise<RazorpayCredentials | null> {
  const targetTenant =
    tenantId || process.env.RAZORPAY_DEFAULT_TENANT_ID || "803a80b0-c7e2-4208-aed4-958ac19c08c6"

  if (targetTenant) {
    try {
      const fromDb = await loadFromTenantConfig(targetTenant)
      if (fromDb) return fromDb
    } catch (e) {
      console.warn("[razorpay-byok] tenant load failed", (e as Error).message)
    }
  }

  return null
}

async function loadFromTenantConfig(
  tenantId: string
): Promise<RazorpayCredentials | null> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) return null

  const client = new Client({ connectionString })
  try {
    await client.connect()
    await client.query(`SELECT set_config('app.current_tenant', $1, true)`, [
      tenantId,
    ])
    const res = await client.query(
      `SELECT encrypted_payload FROM tenant_payment_config
       WHERE tenant_id = $1 AND provider_id = 'razorpay' AND is_active = true
       LIMIT 1`,
      [tenantId]
    )
    if (!res.rows.length) return null
    const rawPayload = res.rows[0].encrypted_payload
    const payload = decryptPayload(rawPayload)
    if (!payload || !payload.key_id || !payload.key_secret) return null
    return {
      key_id: String(payload.key_id),
      key_secret: String(payload.key_secret),
      webhook_secret: payload.webhook_secret
        ? String(payload.webhook_secret)
        : undefined,
      business_name: payload.business_name
        ? String(payload.business_name)
        : undefined,
    }
  } finally {
    await client.end()
  }
}

export async function saveRazorpayCredentials(
  tenantId: string,
  credentials: RazorpayCredentials
): Promise<void> {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured")
  }
  const client = new Client({ connectionString })
  try {
    await client.connect()
    await client.query(`SELECT set_config('app.current_tenant', $1, true)`, [
      tenantId,
    ])

    const encryptedString = encryptPayload({
      key_id: credentials.key_id,
      key_secret: credentials.key_secret,
      webhook_secret: credentials.webhook_secret || null,
      business_name: credentials.business_name || null,
    })

    await client.query(
      `INSERT INTO tenant_payment_config (tenant_id, provider_id, encrypted_payload, is_active)
       VALUES ($1, 'razorpay', $2::jsonb, true)
       ON CONFLICT (tenant_id, provider_id)
       DO UPDATE SET
         encrypted_payload = EXCLUDED.encrypted_payload,
         is_active = true,
         updated_at = NOW()`,
      [tenantId, encryptedString]
    )
  } finally {
    await client.end()
  }
}

/** Major currency units (₹) → paise for Razorpay */
export function toPaise(amountMajor: number): number {
  return Math.round(Number(amountMajor) * 100)
}

export function basicAuthHeader(creds: RazorpayCredentials): string {
  const token = Buffer.from(`${creds.key_id}:${creds.key_secret}`).toString(
    "base64"
  )
  return `Basic ${token}`
}

export async function razorpayRequest<T>(
  creds: RazorpayCredentials,
  method: string,
  path: string,
  body?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(`${RAZORPAY_API}${path}`, {
    method,
    headers: {
      Authorization: basicAuthHeader(creds),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = (await res.json().catch(() => ({}))) as T & {
    error?: { description?: string; code?: string }
  }
  if (!res.ok) {
    const msg =
      data?.error?.description ||
      `Razorpay ${method} ${path} failed (${res.status})`
    throw new Error(msg)
  }
  return data
}

export async function createRazorpayOrder(
  creds: RazorpayCredentials,
  params: {
    amountPaise: number
    currency?: string
    receipt: string
    notes?: Record<string, string>
  }
): Promise<RazorpayOrder> {
  return razorpayRequest<RazorpayOrder>(creds, "POST", "/orders", {
    amount: params.amountPaise,
    currency: (params.currency || "INR").toUpperCase(),
    receipt: params.receipt.slice(0, 40),
    notes: params.notes || {},
  })
}

export async function fetchRazorpayPayment(
  creds: RazorpayCredentials,
  paymentId: string
): Promise<RazorpayPayment> {
  return razorpayRequest<RazorpayPayment>(
    creds,
    "GET",
    `/payments/${encodeURIComponent(paymentId)}`
  )
}

/**
 * Client checkout success signature:
 * HMAC_SHA256(order_id|payment_id, key_secret)
 * https://razorpay.com/docs/payments/server-integration/nodejs/payment-gateway/build-integration/
 */
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
  keySecret: string
): boolean {
  if (!orderId || !paymentId || !signature || !keySecret) return false
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex")
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature.trim())
    )
  } catch {
    return expected === signature.trim()
  }
}

export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string,
  webhookSecret: string
): boolean {
  if (!signature || !webhookSecret) return false
  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(typeof rawBody === "string" ? rawBody : rawBody.toString("utf8"))
    .digest("hex")
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature.trim())
    )
  } catch {
    return expected === signature.trim()
  }
}

/** Payment counts as money received for order completion */
export function isPaymentSuccessful(payment: RazorpayPayment): boolean {
  const s = (payment.status || "").toLowerCase()
  return s === "captured" || s === "authorized" || payment.captured === true
}
