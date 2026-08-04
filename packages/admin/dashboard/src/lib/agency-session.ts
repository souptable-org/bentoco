/**
 * Client-side agency session helpers (Stage 5).
 * Medusa session/JWT is handled by the SDK; this stores Bentoco mode hints.
 */

const MODE_KEY = "bentoco_admin_mode"
const AGENCY_UID_KEY = "bentoco_agency_uid"
const MEMBERSHIP_KEY = "bentoco_agency_membership"

export type AdminMode = "agency" | "merchant"

export type AgencyMembership = {
  id: string
  role: string
  rbac_role?: string
  user_id?: string
  email?: string
}

export type AgencyMeResponse = {
  isAgency: boolean
  mode: AdminMode
  user: {
    id: string
    email: string
    first_name?: string | null
    last_name?: string | null
    role?: string
  } | null
  agency: {
    id: string
    name: string
    unique_uid: string
    subdomain?: string
  } | null
  membership: AgencyMembership | null
}

const backendUrl = () => {
  try {
    // Vite injects __BACKEND_URL__
    // eslint-disable-next-line no-undef
    return (typeof __BACKEND_URL__ !== "undefined" && __BACKEND_URL__) || "http://localhost:9000"
  } catch {
    return "http://localhost:9000"
  }
}

export async function fetchAgencyMe(email: string): Promise<AgencyMeResponse> {
  const res = await fetch(
    `${backendUrl()}/api/agency/me?email=${encodeURIComponent(email)}`
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `Agency me failed (${res.status})`)
  }
  return res.json()
}

export function persistAgencySession(me: AgencyMeResponse) {
  if (me.isAgency && me.agency) {
    localStorage.setItem(MODE_KEY, "agency")
    localStorage.setItem(AGENCY_UID_KEY, me.agency.unique_uid)
    if (me.membership) {
      localStorage.setItem(MEMBERSHIP_KEY, JSON.stringify(me.membership))
    }
  } else {
    localStorage.setItem(MODE_KEY, "merchant")
    localStorage.removeItem(AGENCY_UID_KEY)
    localStorage.removeItem(MEMBERSHIP_KEY)
  }
}

export function clearAgencySession() {
  localStorage.removeItem(MODE_KEY)
  localStorage.removeItem(AGENCY_UID_KEY)
  localStorage.removeItem(MEMBERSHIP_KEY)
}

export function getAdminMode(): AdminMode | null {
  const mode = localStorage.getItem(MODE_KEY)
  if (mode === "agency" || mode === "merchant") {
    return mode
  }
  return null
}

export function getAgencyUid(): string | null {
  return localStorage.getItem(AGENCY_UID_KEY)
}

export function getAgencyMembership(): AgencyMembership | null {
  const raw = localStorage.getItem(MEMBERSHIP_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function isAgencyMode(): boolean {
  return getAdminMode() === "agency"
}
