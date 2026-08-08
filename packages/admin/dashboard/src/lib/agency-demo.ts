/**
 * Explicit demo fixtures for the agency console.
 * Not live data — UI must label these as demo until APIs are wired.
 */

export type DemoStoreStatus = "active" | "staging" | "suspended"

export type DemoManagedStore = {
  id: string
  name: string
  subdomain: string
  status: DemoStoreStatus
  ownershipStatus: "AGENCY_MANAGED" | "TRANSFER_PENDING"
}

export const AGENCY_DEMO_BANNER =
  "Demo data — figures and stores are sample fixtures, not live metrics."

export const AGENCY_DEMO_TEAM_BANNER =
  "Demo roster — sample staff only, not your live agency team."

export type DemoTeamMember = {
  id: string
  name: string
  email: string
  role: "AGENCY_OWNER" | "AGENCY_MEMBER"
  stores: string
  status: "Active" | "Invited"
}

/** Explicit team fixtures — never silent-merge with live API responses. */
export const DEMO_TEAM_MEMBERS: DemoTeamMember[] = [
  {
    id: "demo-alice-admin",
    name: "Alice Admin",
    email: "alice@pixelcraft.com",
    role: "AGENCY_OWNER",
    stores: "All (4 Stores)",
    status: "Active",
  },
  {
    id: "demo-bob-builder",
    name: "Bob Builder",
    email: "bob@pixelcraft.com",
    role: "AGENCY_MEMBER",
    stores: "2 Stores",
    status: "Active",
  },
  {
    id: "demo-charlie-dev",
    name: "Charlie Dev",
    email: "charlie@pixelcraft.com",
    role: "AGENCY_MEMBER",
    stores: "1 Store",
    status: "Invited",
  },
]

export const DEMO_MANAGED_STORES: DemoManagedStore[] = [
  {
    id: "demo-urban-threads",
    name: "Urban Threads",
    subdomain: "urban-threads",
    status: "active",
    ownershipStatus: "AGENCY_MANAGED",
  },
  {
    id: "demo-apex-gear",
    name: "Apex Gear",
    subdomain: "apex-gear",
    status: "staging",
    ownershipStatus: "AGENCY_MANAGED",
  },
  {
    id: "demo-luxeliving",
    name: "LuxeLiving",
    subdomain: "luxeliving",
    status: "active",
    ownershipStatus: "AGENCY_MANAGED",
  },
  {
    id: "demo-aura-beauty",
    name: "Aura Beauty",
    subdomain: "aura-beauty",
    status: "suspended",
    ownershipStatus: "AGENCY_MANAGED",
  },
]

export const DEMO_KPI = [
  {
    title: "Total client stores",
    value: "4",
    trend: "Sample",
    isPositive: true as const,
  },
  {
    title: "Combined monthly GMV",
    value: "—",
    trend: "Not connected",
    isPositive: true as const,
  },
  {
    title: "Active stores",
    value: "2",
    trend: "Sample",
    isPositive: true as const,
  },
  {
    title: "Suspended stores",
    value: "1",
    trend: "Sample",
    isPositive: false as const,
  },
]

export function storesByStatus(status: DemoStoreStatus) {
  return DEMO_MANAGED_STORES.filter((s) => s.status === status)
}
