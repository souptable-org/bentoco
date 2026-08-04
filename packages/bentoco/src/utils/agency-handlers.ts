/**
 * Thin handlers used by Stage 4 Medusa agency routes.
 */
import type { Client } from "pg"
import {
  inviteStore as inviteStoreImpl,
  confirmAccess as confirmAccessImpl,
  revokeAccess as revokeAccessImpl,
  agencyMemberLogin as agencyMemberLoginImpl,
} from "./agency-access"
import {
  initiateStoreDelegationToAgency as initiateImpl,
  approveStoreDelegation as approveImpl,
} from "./agency-store-transfer"

export const inviteStore = inviteStoreImpl
export const confirmAccess = confirmAccessImpl
export const revokeAccess = revokeAccessImpl
export const agencyMemberLogin = agencyMemberLoginImpl
export const initiateStoreDelegationToAgency = initiateImpl
export const approveStoreDelegation = approveImpl

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

  const stores = res.rows.map((row) => ({
    id: row.store_id || row.tenant_id || row.id,
    accessId: row.id,
    name: row.store_name || row.merchant_email || "Pending store",
    status:
      row.status === "ACTIVE"
        ? "active"
        : row.status === "PENDING"
          ? "staging"
          : "suspended",
    accessStatus: row.status,
    owner: row.merchant_email,
    plan: row.plan || "free",
    subdomain: row.subdomain,
    canGoLive: row.can_go_live,
    ownershipStatus: row.ownership_status,
    agencyUid: row.agency_uid,
    lastActivity: row.confirmed_at || row.invited_at,
    monthlyRevenuePaisa: 0,
  }))

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

export async function getAgencyBilling() {
  return {
    monthlyCharges: "—",
    volumeDiscount: "—",
    paymentMethod: "Not configured",
    invoices: [] as any[],
    note: "Billing integration pending",
  }
}
