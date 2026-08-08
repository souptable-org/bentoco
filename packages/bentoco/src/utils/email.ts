import nodemailer from "nodemailer"

// =============================================
// EMAIL CONFIGURATION
// Use environment variables for production.
// Falls back to Ethereal (fake SMTP) for dev.
// =============================================

const SMTP_HOST     = process.env.SMTP_HOST     || "smtp.ethereal.email"
const SMTP_PORT     = parseInt(process.env.SMTP_PORT || "587")
// Ethereal test inbox (local dev only — override via SMTP_USER / SMTP_PASS)
const SMTP_USER     = process.env.SMTP_USER     || "vivianne84@ethereal.email"
const SMTP_PASS     = process.env.SMTP_PASS     || "X3WHrpgENQ8wsBqgCe"
const FROM_EMAIL    = process.env.FROM_EMAIL    || "noreply@bentoco.com"
const FROM_NAME     = process.env.FROM_NAME     || "Bentoco Platform"
const BASE_URL      = process.env.BASE_URL      || "http://localhost:9000"

async function createTransporter() {
  let user = SMTP_USER
  let pass = SMTP_PASS
  let host = SMTP_HOST
  let port = SMTP_PORT

  // If password missing, generate a fresh Ethereal account (old ones expire)
  if (!user || !pass) {
    const testAccount = await nodemailer.createTestAccount()
    user = testAccount.user
    pass = testAccount.pass
    host = testAccount.smtp.host
    port = testAccount.smtp.port
    console.log(
      `Generated Ethereal SMTP credentials: ${user} (set SMTP_USER/SMTP_PASS to pin this account)`
    )
  }

  return nodemailer.createTransport({
    host:   host,
    port:   port,
    secure: port === 465,
    auth: { user, pass },
  })
}

// =============================================
// EMAIL 1: Agency Access Invite (Existing Merchant)
// Sent when an agency requests access to an existing merchant's store.
// =============================================
export async function sendAgencyAccessInvite({
  merchantEmail,
  agencyName,
  agencyUid,
  storeDisplayName,
  inviteToken,
  inviteUrl,
  inviteType = "new_merchant",
}: {
  merchantEmail: string
  agencyName: string
  agencyUid: string
  storeDisplayName: string
  inviteToken: string
  inviteUrl?: string
  inviteType?: "new_merchant" | "existing_merchant"
}): Promise<{ previewUrl?: string | false }> {
  const frontendUrl = (
    process.env.ADMIN_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:7001"
  ).replace(/\/$/, "")
  const confirmUrl =
    inviteUrl ||
    `${frontendUrl}/login?agency_invite=${encodeURIComponent(inviteToken)}&agency=${encodeURIComponent(agencyUid)}`

  const isNew = inviteType === "new_merchant"
  const title = isNew ? "Create your store with your agency" : "Agency access request"
  const bodyLead = isNew
    ? `Your agency <strong>${agencyName}</strong> invited you to set up <strong>${storeDisplayName}</strong> on Bentoco. You create the account and store — they cannot do that alone.`
    : `Agency <strong>${agencyName}</strong> is requesting access to manage <strong>${storeDisplayName}</strong>.`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Inter, -apple-system, sans-serif; background: #f9f9f9; margin: 0; padding: 0; }
        .container { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #eee; }
        .header { background: #0f172a; padding: 32px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 20px; font-weight: 600; }
        .header p { color: #94a3b8; margin: 6px 0 0; font-size: 13px; }
        .body { padding: 32px; }
        .body p { color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
        .agency-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
        .agency-card .name { font-weight: 600; color: #0f172a; font-size: 15px; }
        .agency-card .uid { font-family: monospace; font-size: 12px; color: #64748b; margin-top: 4px; }
        .btn { display: block; width: fit-content; margin: 24px auto; background: #0f172a; color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; }
        .note { font-size: 12px; color: #9ca3af; text-align: center; margin-top: 24px; }
        .footer { background: #f8fafc; padding: 20px 32px; border-top: 1px solid #eee; text-align: center; }
        .footer p { font-size: 12px; color: #9ca3af; margin: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${title}</h1>
          <p>Bentoco Commerce Platform</p>
        </div>
        <div class="body">
          <p>${bodyLead}</p>
          <div class="agency-card">
            <div class="name">${agencyName}</div>
            <div class="uid">Agency code: ${agencyUid}</div>
          </div>
          <p>Click below to ${isNew ? "create your account" : "sign in"}. You will confirm the agency code (6 digits). You can revoke access later.</p>
          <a href="${confirmUrl}" class="btn">${isNew ? "Create account & confirm" : "Review & confirm"}</a>
          <p class="note">This link expires in 48 hours. If you did not expect this, ignore this email.</p>
        </div>
        <div class="footer">
          <p>© Bentoco Commerce Platform · <a href="https://bentoco.com">bentoco.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `

  const transporter = await createTransporter()
  const info = await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: merchantEmail,
    subject: isNew
      ? `${agencyName} invited you to set up ${storeDisplayName} on Bentoco`
      : `${agencyName} is requesting access to your store`,
    html,
  })

  console.log(`📧 Agency access invite sent to ${merchantEmail}`)
  const previewUrl = nodemailer.getTestMessageUrl(info)
  if (previewUrl) {
    console.log(`🔗 Ethereal Mail Preview URL: ${previewUrl}`)
  }
  // Ethereal does NOT deliver to real Gmail/etc — only this preview (or ethereal.email login)
  return { previewUrl: previewUrl || undefined }
}

// =============================================
// EMAIL 2: New Merchant Welcome
// Sent to a brand-new merchant after the agency has set up their store.
// =============================================
export async function sendNewMerchantWelcome({
  merchantEmail,
  storeName,
  storeSubdomain,
  agencyName,
  loginUrl,
}: {
  merchantEmail: string
  storeName: string
  storeSubdomain: string
  agencyName: string
  loginUrl: string
}): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Inter, -apple-system, sans-serif; background: #f9f9f9; margin: 0; padding: 0; }
        .container { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #eee; }
        .header { background: #0f172a; padding: 32px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 20px; font-weight: 600; }
        .header p { color: #94a3b8; margin: 6px 0 0; font-size: 13px; }
        .body { padding: 32px; }
        .body p { color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
        .store-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px 20px; margin: 20px 0; }
        .store-card .name { font-weight: 600; color: #14532d; font-size: 15px; }
        .store-card .url { font-family: monospace; font-size: 12px; color: #16a34a; margin-top: 4px; }
        .btn { display: block; width: fit-content; margin: 24px auto; background: #16a34a; color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; }
        .footer { background: #f8fafc; padding: 20px 32px; border-top: 1px solid #eee; text-align: center; }
        .footer p { font-size: 12px; color: #9ca3af; margin: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Your Store is Ready 🎉</h1>
          <p>Bentoco Commerce Platform</p>
        </div>
        <div class="body">
          <p><strong>${agencyName}</strong> has set up a store on your behalf on the Bentoco platform.</p>
          <div class="store-card">
            <div class="name">${storeName}</div>
            <div class="url">${storeSubdomain}.bentoco.com</div>
          </div>
          <p>You are the owner of this store. The agency manages it on your behalf but you can log in at any time and take full control.</p>
          <a href="${loginUrl}" class="btn">Log In to Your Store</a>
          <p style="font-size:13px;color:#6b7280;">Your login email is this address. Use "Forgot Password" on the login page to set your password on first login.</p>
        </div>
        <div class="footer">
          <p>© Bentoco Commerce Platform · <a href="https://bentoco.com">bentoco.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `

  const transporter = await createTransporter()
  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: merchantEmail,
    subject: `Your store "${storeName}" is ready on Bentoco`,
    html,
  })

  console.log(`📧 New merchant welcome sent to ${merchantEmail}`)
}

// =============================================
// EMAIL 3: Access Confirmed (Agency Notification)
// Sent to agency owner after merchant confirms access.
// =============================================
export async function sendAccessConfirmedToAgency({
  agencyOwnerEmail,
  agencyName,
  merchantEmail,
  storeDisplayName,
  dashboardUrl,
}: {
  agencyOwnerEmail: string
  agencyName: string
  merchantEmail: string
  storeDisplayName: string
  dashboardUrl: string
}): Promise<void> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Inter, -apple-system, sans-serif; background: #f9f9f9; margin: 0; padding: 0; }
        .container { max-width: 520px; margin: 40px auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #eee; }
        .header { background: #0f172a; padding: 32px; text-align: center; }
        .header h1 { color: #fff; margin: 0; font-size: 20px; font-weight: 600; }
        .body { padding: 32px; }
        .body p { color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px; }
        .btn { display: block; width: fit-content; margin: 24px auto; background: #0f172a; color: #fff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; }
        .footer { background: #f8fafc; padding: 20px 32px; border-top: 1px solid #eee; text-align: center; }
        .footer p { font-size: 12px; color: #9ca3af; margin: 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Access Confirmed ✅</h1>
        </div>
        <div class="body">
          <p><strong>${merchantEmail}</strong> has confirmed that <strong>${agencyName}</strong> can manage their store <strong>${storeDisplayName}</strong>.</p>
          <p>The store is now active in your agency dashboard.</p>
          <a href="${dashboardUrl}" class="btn">Open Agency Dashboard</a>
        </div>
        <div class="footer">
          <p>© Bentoco Commerce Platform · <a href="https://bentoco.com">bentoco.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `

  const transporter = await createTransporter()
  await transporter.sendMail({
    from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
    to: agencyOwnerEmail,
    subject: `✅ ${merchantEmail} confirmed access to "${storeDisplayName}"`,
    html,
  })

  console.log(`📧 Access confirmed notification sent to ${agencyOwnerEmail}`)
}
