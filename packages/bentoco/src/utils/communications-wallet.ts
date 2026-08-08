import { Client } from "pg"

export interface WalletTransactionResult {
  tenantId: string
  balancePaisa: number
  amountPaisa: number
  type: "topup" | "deduction"
  reason: string
  success: boolean
  message: string
}

/**
 * Prepaid Communications Wallet Module
 * Tracks merchant credit balance in integer Paisa for automated WhatsApp transactional messaging.
 */

/**
 * Gets current wallet balance for a tenant
 */
export async function getWalletBalance(tenantId: string, client: Client): Promise<number> {
  await client.query(`SET LOCAL app.current_tenant = '${tenantId}'`)

  const res = await client.query(`SELECT balance_paisa FROM tenant_wallet WHERE tenant_id = $1 LIMIT 1`, [
    tenantId,
  ])

  if (res.rows.length === 0) {
    return 0
  }
  return res.rows[0].balance_paisa
}

/**
 * Tops up merchant wallet balance (e.g. merchant recharges ₹500 = 50000 Paisa)
 */
export async function topupWalletBalance(
  tenantId: string,
  amountPaisa: number,
  paymentTransactionId: string,
  client: Client
): Promise<WalletTransactionResult> {
  if (amountPaisa <= 0) {
    throw new Error("Top-up amount must be greater than 0 Paisa.")
  }

  await client.query(`SET LOCAL app.current_tenant = '${tenantId}'`)

  const res = await client.query(
    `INSERT INTO tenant_wallet (tenant_id, balance_paisa)
     VALUES ($1, $2)
     ON CONFLICT (tenant_id)
     DO UPDATE SET balance_paisa = tenant_wallet.balance_paisa + EXCLUDED.balance_paisa, updated_at = NOW()
     RETURNING balance_paisa`,
    [tenantId, amountPaisa]
  )

  const newBalance = res.rows[0].balance_paisa

  await client.query(
    `INSERT INTO tenant_wallet_ledger (tenant_id, type, amount_paisa, balance_after_paisa, reason, metadata)
     VALUES ($1, 'topup', $2, $3, $4, $5)`,
    [tenantId, amountPaisa, newBalance, "Merchant Prepaid Wallet Recharge", JSON.stringify({ paymentTransactionId })]
  )

  return {
    tenantId,
    balancePaisa: newBalance,
    amountPaisa,
    type: "topup",
    reason: "Merchant Prepaid Wallet Recharge",
    success: true,
    message: `Successfully topped up ₹${amountPaisa / 100}. New balance: ₹${newBalance / 100}`,
  }
}

/**
 * Deducts credit from wallet balance (e.g. 25 Paisa per WhatsApp OTP)
 */
export async function deductWalletBalance(
  tenantId: string,
  amountPaisa: number,
  reason: string,
  client: Client
): Promise<WalletTransactionResult> {
  if (amountPaisa <= 0) {
    throw new Error("Deduction amount must be greater than 0 Paisa.")
  }

  await client.query(`SET LOCAL app.current_tenant = '${tenantId}'`)

  const currentBalance = await getWalletBalance(tenantId, client)

  if (currentBalance < amountPaisa) {
    return {
      tenantId,
      balancePaisa: currentBalance,
      amountPaisa,
      type: "deduction",
      reason,
      success: false,
      message: `Insufficient wallet balance (₹${currentBalance / 100}). Please top up to send WhatsApp messages.`,
    }
  }

  const res = await client.query(
    `UPDATE tenant_wallet
     SET balance_paisa = balance_paisa - $1, updated_at = NOW()
     WHERE tenant_id = $2
     RETURNING balance_paisa`,
    [amountPaisa, tenantId]
  )

  const newBalance = res.rows[0].balance_paisa

  await client.query(
    `INSERT INTO tenant_wallet_ledger (tenant_id, type, amount_paisa, balance_after_paisa, reason)
     VALUES ($1, 'deduction', $2, $3, $4)`,
    [tenantId, amountPaisa, newBalance, reason]
  )

  return {
    tenantId,
    balancePaisa: newBalance,
    amountPaisa,
    type: "deduction",
    reason,
    success: true,
    message: `Deducted ₹${amountPaisa / 100}. Remaining balance: ₹${newBalance / 100}`,
  }
}
