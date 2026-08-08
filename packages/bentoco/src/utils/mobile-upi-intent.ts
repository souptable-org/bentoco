import crypto from "crypto"
import { paisaToRupees } from "./inr-currency-math"

export interface UPIIntentParams {
  vpa: string // Merchant UPI VPA (e.g. "store@razorpay" or "merchant@ybl")
  payeeName: string // Merchant Store Name (e.g. "Urban Threads")
  orderId: string // Transaction Reference / Order ID
  paisaAmount: number // Amount in integer Paisa
  note?: string // Transaction Note
}

export interface MobileUPIIntentPayload {
  orderId: string
  paisaAmount: number
  rupeesAmount: number
  genericIntentUrl: string
  appIntents: {
    gpay: string
    phonepe: string
    paytm: string
  }
}

/**
 * Builds standard Indian NPCI UPI Intent Deep-Link URL
 * Format: upi://pay?pa={vpa}&pn={payeeName}&tr={orderId}&am={rupees}&cu=INR&tn={note}
 */
export function generateUPIIntentUrl(params: UPIIntentParams): string {
  const rupees = paisaToRupees(params.paisaAmount).toFixed(2)
  const encodedVpa = encodeURIComponent(params.vpa.trim())
  const encodedPn = encodeURIComponent(params.payeeName.trim())
  const encodedTr = encodeURIComponent(params.orderId.trim())
  const encodedTn = encodeURIComponent(params.note || `Order #${params.orderId}`)

  return `upi://pay?pa=${encodedVpa}&pn=${encodedPn}&tr=${encodedTr}&am=${rupees}&cu=INR&tn=${encodedTn}`
}

/**
 * Creates mobile slide-up drawer payload for GPay, PhonePe, and Paytm
 */
export function createMobileUPIIntentDrawer(params: UPIIntentParams): MobileUPIIntentPayload {
  const genericUrl = generateUPIIntentUrl(params)
  const rupeesAmount = paisaToRupees(params.paisaAmount)

  // App-specific URI schemes for direct 1-click launch on mobile
  const gpayUrl = genericUrl.replace(/^upi:\/\//, "tez://")
  const phonepeUrl = genericUrl.replace(/^upi:\/\//, "phonepe://")
  const paytmUrl = genericUrl.replace(/^upi:\/\//, "paytmmp://")

  return {
    orderId: params.orderId,
    paisaAmount: params.paisaAmount,
    rupeesAmount,
    genericIntentUrl: genericUrl,
    appIntents: {
      gpay: gpayUrl,
      phonepe: phonepeUrl,
      paytm: paytmUrl,
    },
  }
}

/**
 * Validates webhook HMAC-SHA256 signature from BYOG payment gateway (Razorpay/Cashfree/PhonePe)
 */
export function verifyGatewayWebhookSignature(
  rawBody: string,
  signature: string,
  webhookSecret: string
): boolean {
  if (!signature || !webhookSecret) return false
  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex")

  return expectedSignature.toLowerCase() === signature.trim().toLowerCase()
}
