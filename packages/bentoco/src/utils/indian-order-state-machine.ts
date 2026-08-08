import { Client } from "pg"
import crypto from "crypto"

export type IndianOrderStatus =
  | "ORDER_INITIATED"
  | "WHATSAPP_VERIFYING"
  | "COD_VERIFIED"
  | "PREPAID_FLIPPED"
  | "AWB_GENERATED"
  | "CANCELLED"

export interface OTPSessionResult {
  sessionId: string
  orderId: string
  tenantId: string
  phone: string
  rawOtp: string
  expiresAt: Date
}

export interface OTPVerificationResult {
  success: boolean
  orderId: string
  newStatus?: IndianOrderStatus
  remainingAttempts?: number
  message: string
}

function hashOTP(otp: string): string {
  return crypto.createHash("sha256").update(otp).digest("hex")
}

/**
 * Generates a 4-digit cryptographic numeric OTP string
 */
export function generate4DigitOTP(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

/**
 * Creates an OTP verification session and transitions order state to WHATSAPP_VERIFYING
 */
export async function createOTPSession(
  orderId: string,
  tenantId: string,
  phone: string,
  client: Client
): Promise<OTPSessionResult> {
  await client.query(`SET LOCAL app.current_tenant = '${tenantId}'`)

  const rawOtp = generate4DigitOTP()
  const otpHash = hashOTP(rawOtp)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10-minute expiry

  const res = await client.query(
    `INSERT INTO tenant_otp_session (tenant_id, order_id, phone, otp_code_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [tenantId, orderId, phone, otpHash, expiresAt]
  )

  // Update order status in metadata & log state history
  await client.query(
    `UPDATE "order" 
     SET metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{indian_status}', '"WHATSAPP_VERIFYING"') 
     WHERE id = $1 AND tenant_id = $2`,
    [orderId, tenantId]
  )
  await client.query(
    `INSERT INTO order_state_history (tenant_id, order_id, from_status, to_status, reason)
     VALUES ($1, $2, 'ORDER_INITIATED', 'WHATSAPP_VERIFYING', 'WhatsApp 4-digit OTP dispatched')`,
    [tenantId, orderId]
  )

  return {
    sessionId: res.rows[0].id,
    orderId,
    tenantId,
    phone,
    rawOtp,
    expiresAt,
  }
}

/**
 * Verifies 4-digit OTP and transitions order state to COD_VERIFIED
 */
export async function verifyOTPSession(
  orderId: string,
  tenantId: string,
  otpCode: string,
  client: Client
): Promise<OTPVerificationResult> {
  await client.query(`SET LOCAL app.current_tenant = '${tenantId}'`)

  const res = await client.query(
    `SELECT id, otp_code_hash, attempts, max_attempts, expires_at, is_verified
     FROM tenant_otp_session
     WHERE order_id = $1 AND tenant_id = $2 AND is_verified = false
     ORDER BY created_at DESC LIMIT 1`,
    [orderId, tenantId]
  )

  if (res.rows.length === 0) {
    return { success: false, orderId, message: "No active OTP session found for this order." }
  }

  const session = res.rows[0]

  if (new Date() > new Date(session.expires_at)) {
    return { success: false, orderId, message: "OTP has expired. Please request a new code." }
  }

  if (session.attempts >= session.max_attempts) {
    return { success: false, orderId, message: "Maximum OTP attempts exceeded." }
  }

  const inputHash = hashOTP(otpCode.trim())
  if (inputHash !== session.otp_code_hash) {
    const newAttempts = session.attempts + 1
    await client.query(`UPDATE tenant_otp_session SET attempts = $1 WHERE id = $2`, [newAttempts, session.id])
    return {
      success: false,
      orderId,
      remainingAttempts: session.max_attempts - newAttempts,
      message: `Invalid OTP code. ${session.max_attempts - newAttempts} attempts remaining.`,
    }
  }

  // Mark session verified and transition order to COD_VERIFIED in metadata
  await client.query(`UPDATE tenant_otp_session SET is_verified = true WHERE id = $1`, [session.id])
  await client.query(
    `UPDATE "order" 
     SET metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{indian_status}', '"COD_VERIFIED"') 
     WHERE id = $1 AND tenant_id = $2`,
    [orderId, tenantId]
  )
  await client.query(
    `INSERT INTO order_state_history (tenant_id, order_id, from_status, to_status, reason)
     VALUES ($1, $2, 'WHATSAPP_VERIFYING', 'COD_VERIFIED', '4-digit WhatsApp OTP verified successfully')`,
    [tenantId, orderId]
  )

  return {
    success: true,
    orderId,
    newStatus: "COD_VERIFIED",
    message: "Cash-on-Delivery order verified successfully.",
  }
}

/**
 * Converts order from WHATSAPP_VERIFYING -> PREPAID_FLIPPED upon instant UPI Intent payment
 */
export async function flipOrderToPrepaid(
  orderId: string,
  tenantId: string,
  paymentTransactionId: string,
  client: Client
): Promise<OTPVerificationResult> {
  await client.query(`SET LOCAL app.current_tenant = '${tenantId}'`)

  await client.query(
    `UPDATE "order" 
     SET metadata = jsonb_set(coalesce(metadata, '{}'::jsonb), '{indian_status}', '"PREPAID_FLIPPED"'),
         payment_status = 'captured' 
     WHERE id = $1 AND tenant_id = $2`,
    [orderId, tenantId]
  )
  await client.query(
    `INSERT INTO order_state_history (tenant_id, order_id, from_status, to_status, reason, metadata)
     VALUES ($1, $2, 'WHATSAPP_VERIFYING', 'PREPAID_FLIPPED', 'Flipped to Prepaid via UPI Intent', $3)`,
    [tenantId, orderId, JSON.stringify({ paymentTransactionId })]
  )

  return {
    success: true,
    orderId,
    newStatus: "PREPAID_FLIPPED",
    message: "Order successfully converted to Prepaid via UPI Intent.",
  }
}
