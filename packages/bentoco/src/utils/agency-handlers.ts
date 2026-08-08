/**
 * Thin handlers used by Stage 4 Medusa agency routes.
 */
import type { Client } from "pg"
import {
  inviteStore as inviteStoreImpl,
  confirmAccess as confirmAccessImpl,
  completeAgencyInvite as completeAgencyInviteImpl,
  markStoreConfigured as markStoreConfiguredImpl,
  revokeAccess as revokeAccessImpl,
  requestRevokeAccess as requestRevokeAccessImpl,
  agencyMemberLogin as agencyMemberLoginImpl,
} from "./agency-access"
import {
  initiateStoreDelegationToAgency as initiateImpl,
  approveStoreDelegation as approveImpl,
  handoffStoreToMerchant as handoffImpl,
  listTenantPartners as listPartnersImpl,
  resolveTenantIdForMerchantEmail as resolveTenantImpl,
  requestAgencyLink as requestAgencyLinkImpl,
  acceptAgencyLink as acceptAgencyLinkImpl,
  normalizeAgencyUid as normalizeAgencyUidImpl,
} from "./agency-store-transfer"

export const inviteStore = inviteStoreImpl
export const confirmAccess = confirmAccessImpl
export const completeAgencyInvite = completeAgencyInviteImpl
export const markStoreConfigured = markStoreConfiguredImpl
export const revokeAccess = revokeAccessImpl
export const requestRevokeAccess = requestRevokeAccessImpl
export const agencyMemberLogin = agencyMemberLoginImpl
export const initiateStoreDelegationToAgency = initiateImpl
export const approveStoreDelegation = approveImpl
export const handoffStoreToMerchant = handoffImpl
export const listTenantPartners = listPartnersImpl
export const resolveTenantIdForMerchantEmail = resolveTenantImpl
export const requestAgencyLink = requestAgencyLinkImpl
export const acceptAgencyLink = acceptAgencyLinkImpl
export const normalizeAgencyUid = normalizeAgencyUidImpl

export async function getAccessLog(
  agencyId: string,
  tenantId: string | undefined,
  client: Client
): Promise<{ logs: any[] }> {
  const agencyRes = await client.query(
    `SELECT id FROM agency WHERE unique_uid = $1 OR id::text = $1 LIMIT 1`,
    [agencyId]
  )
  const realAgencyUuid = agencyRes.rows[0]?.id
  if (!realAgencyUuid) {
    return { logs: [] }
  }

  const params: any[] = [realAgencyUuid]
  let sql = `
    SELECT
      l.id,
      l.action,
      l.member_email,
      l.ip_address,
      l.metadata,
      l.created_at,
      l.tenant_id,
      l.store_id,
      t.store_name
    FROM agency_store_log l
    LEFT JOIN tenant t ON l.tenant_id = t.id::text
    WHERE l.agency_id = $1
  `
  if (tenantId) {
    params.push(tenantId)
    sql += ` AND l.tenant_id = $2`
  }
  sql += ` ORDER BY l.created_at DESC LIMIT 200`

  const logsRes = await client.query(sql, params)
  return { logs: logsRes.rows }
}

export async function getAgencyOverview(client: Client) {
  const storeCountRes = await client.query(
    `SELECT COUNT(*)::int AS count FROM tenant`
  )
  const totalStores = storeCountRes.rows[0]?.count ?? 0
  const activeAccess = await client.query(
    `SELECT COUNT(*)::int AS count FROM agency_store_access WHERE status = 'ACTIVE'`
  )
  const pendingAccess = await client.query(
    `SELECT COUNT(*)::int AS count FROM agency_store_access WHERE status = 'PENDING'`
  )

  const recent = await client.query(
    `
    SELECT l.id, l.action, l.member_email, l.created_at, t.store_name, l.tenant_id
    FROM agency_store_log l
    LEFT JOIN tenant t ON l.tenant_id = t.id::text
    ORDER BY l.created_at DESC
    LIMIT 10
    `
  )

  return {
    kpis: [
      {
        title: "Total Client Stores",
        value: String(totalStores),
        trend: "",
        isPositive: true,
      },
      {
        title: "Active Agency Access",
        value: String(activeAccess.rows[0]?.count ?? 0),
        trend: "",
        isPositive: true,
      },
      {
        title: "Pending Invites",
        value: String(pendingAccess.rows[0]?.count ?? 0),
        trend: "",
        isPositive: pendingAccess.rows[0]?.count === 0,
      },
      {
        title: "Combined Monthly GMV",
        value: "—",
        trend: "",
        isPositive: true,
        unit: "inr",
      },
    ],
    recentActivity: recent.rows.map((row, idx) => ({
      id: row.id || idx,
      type: row.action,
      store: row.store_name || row.tenant_id || "—",
      user: row.member_email || "System",
      time: row.created_at,
    })),
  }
}

export async function getAgencyStores(client: Client, agencyUid?: string) {
  let agencyFilter = ""
  const params: any[] = []
  if (agencyUid) {
    params.push(agencyUid)
    agencyFilter = `AND (a.unique_uid = $1 OR a.id::text = $1)`
  }

  const res = await client.query(
    `
    SELECT
      acc.id,
      acc.status,
      acc.merchant_email,
      acc.tenant_id,
      acc.store_id,
      acc.invited_at,
      acc.confirmed_at,
      t.store_name,
      t.subdomain,
      t.plan,
      t.can_go_live,
      t.ownership_status,
      a.unique_uid AS agency_uid,
      a.name AS agency_name
    FROM agency_store_access acc
    JOIN agency a ON a.id = acc.agency_id
    LEFT JOIN tenant t ON t.id::text = acc.tenant_id
    WHERE 1=1 ${agencyFilter}
    ORDER BY acc.created_at DESC
    `,
    params
  )

  const stores = res.rows.map((row) => {
    const accessStatus = String(row.status || "").toUpperCase()
    let status = "suspended"
    if (accessStatus === "ACTIVE") status = "active"
    else if (accessStatus === "NEW") status = "new"
    else if (accessStatus === "PENDING") status = "staging"
    else if (accessStatus === "REVOKE_REQUESTED") status = "revoke_requested"
    else if (accessStatus === "REVOKED") status = "archived"

    return {
      id: row.store_id || row.tenant_id || row.id,
      tenantId: row.tenant_id || row.store_id,
      accessId: row.id,
      name: row.store_name || row.merchant_email || "Pending store",
      status,
      accessStatus,
      owner: row.merchant_email,
      plan: row.plan || "free",
      subdomain: row.subdomain,
      canGoLive: row.can_go_live,
      ownershipStatus: row.ownership_status,
      agencyUid: row.agency_uid,
      lastActivity: row.confirmed_at || row.invited_at,
      monthlyRevenuePaisa: 0,
    }
  })

  return { stores }
}

export async function getAgencyTeam(client: Client, agencyUid?: string) {
  const params: any[] = []
  let filter = ""
  if (agencyUid) {
    params.push(agencyUid)
    filter = `WHERE a.unique_uid = $1 OR a.id::text = $1`
  }

  const res = await client.query(
    `
    SELECT
      m.id,
      m.email,
      m.role,
      m.rbac_role,
      m.user_id,
      m.assigned_tenant_ids,
      a.unique_uid AS agency_uid,
      a.name AS agency_name
    FROM agency_team_member m
    JOIN agency a ON a.id = m.agency_id
    ${filter}
    ORDER BY m.role, m.email
    `,
    params
  )

  return {
    members: res.rows.map((row, idx) => ({
      id: row.id || idx,
      name: row.email?.split("@")[0] || "Member",
      email: row.email,
      role: row.role,
      rbacRole: row.rbac_role,
      userId: row.user_id,
      stores: Array.isArray(row.assigned_tenant_ids)
        ? `${row.assigned_tenant_ids.length} Stores`
        : "Assigned via access",
      status: "Active",
    })),
  }
}

/**
 * Per-active-site metering snapshot (no payment processor yet).
 * Product-grade enough to show real site counts + estimated charge from plan tiers.
 */
export async function getAgencyBilling(client?: Client, agencyUid?: string) {
  // When called without DB (legacy), return honest empty state
  if (!client) {
    return {
      monthlyCharges: "—",
      volumeDiscount: "—",
      paymentMethod: "Not configured",
      invoices: [] as any[],
      activeSites: 0,
      stagingSites: 0,
      pricePerActiveSiteInr: 2499,
      estimatedMonthlyInr: 0,
      note: "Connect DATABASE_URL for live metering",
    }
  }

  const params: any[] = []
  let agencyFilter = ""
  if (agencyUid) {
    params.push(agencyUid)
    agencyFilter = `AND (a.unique_uid = $1 OR a.id::text = $1)`
  }

  const counts = await client.query(
    `
    SELECT
      COUNT(*) FILTER (WHERE acc.status = 'ACTIVE')::int AS active_sites,
      COUNT(*) FILTER (WHERE acc.status = 'PENDING')::int AS staging_sites,
      COUNT(*) FILTER (WHERE acc.status = 'REVOKED')::int AS revoked_sites
    FROM agency_store_access acc
    JOIN agency a ON a.id = acc.agency_id
    WHERE 1=1 ${agencyFilter}
    `,
    params
  )

  const activeSites = counts.rows[0]?.active_sites ?? 0
  const stagingSites = counts.rows[0]?.staging_sites ?? 0
  const pricePerActiveSiteInr = 2499

  // Simple volume discount tiers (product spec)
  let volumeDiscountPct = 0
  if (activeSites >= 20) {
    volumeDiscountPct = 30
  } else if (activeSites >= 5) {
    volumeDiscountPct = 15
  }

  const gross = activeSites * pricePerActiveSiteInr
  const estimatedMonthlyInr = Math.round(
    gross * (1 - volumeDiscountPct / 100)
  )

  const formatInr = (n: number) =>
    n <= 0
      ? "—"
      : new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 0,
        }).format(n)

  return {
    monthlyCharges: formatInr(estimatedMonthlyInr),
    volumeDiscount:
      volumeDiscountPct > 0 ? `${volumeDiscountPct}% tier` : "None (under 5 sites)",
    paymentMethod: "Not configured",
    invoices: [] as any[],
    activeSites,
    stagingSites,
    pricePerActiveSiteInr,
    estimatedMonthlyInr,
    estimatedMonthlyPaisa: estimatedMonthlyInr * 100,
    note:
      "Metered estimate only — payment capture (Razorpay) not connected yet. Free/staging sites cannot go live.",
  }
}
