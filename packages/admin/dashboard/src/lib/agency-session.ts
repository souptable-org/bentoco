/**
 * Client-side agency session helpers (Stage 5 / Phase 5).
 * Medusa session/JWT is handled by the SDK; this stores Bentoco mode hints.
 */

const MODE_KEY = "bentoco_admin_mode"
const AGENCY_UID_KEY = "bentoco_agency_uid"
const MEMBERSHIP_KEY = "bentoco_agency_membership"

export type AdminMode = "agency" | "merchant"

/**
 * Resolve admin mode from hostname (agency.* → agency, else merchant).
 * Call on app boot so dual-mode works without prior login to /agency.
 */
export function resolveModeFromHost(
  hostname: string = typeof window !== "undefined"
    ? window.location.hostname
    : ""
): AdminMode {
  const host = (hostname || "").split(":")[0].toLowerCase()
  if (
    host === "agency.bentoco.com" ||
    host === "agency.localhost" ||
    host.startsWith("agency.")
  ) {
    return "agency"
  }
  return "merchant"
}

/** Apply host-based mode if localStorage has no explicit mode yet. */
export function ensureModeFromHost(): AdminMode {
  const existing = getAdminMode()
  if (existing) {
    return existing
  }
  const fromHost = resolveModeFromHost()
  if (typeof window !== "undefined") {
    localStorage.setItem(MODE_KEY, fromHost)
  }
  return fromHost
}

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

/** Prefer same-origin (Vite proxy). Fall back only if an absolute backend is configured. */
const backendUrl = () => {
  try {
    // eslint-disable-next-line no-undef
    const configured =
      typeof __BACKEND_URL__ !== "undefined" ? __BACKEND_URL__ : ""
    if (configured && configured !== "/") {
      return configured.replace(/\/$/, "")
    }
  } catch {
    // ignore
  }
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  return ""
}

export async function fetchAgencyMe(email: string): Promise<AgencyMeResponse> {
  const base = backendUrl()
  const res = await fetch(
    `${base}/api/agency/me?email=${encodeURIComponent(email)}`
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
      // Always keep email on membership for assume-store
      const membership = {
        ...me.membership,
        email: me.membership.email || me.user?.email,
      }
      localStorage.setItem(MEMBERSHIP_KEY, JSON.stringify(membership))
    } else if (me.user?.email) {
      localStorage.setItem(
        MEMBERSHIP_KEY,
        JSON.stringify({ email: me.user.email, role: "AGENCY_MEMBER" })
      )
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
  if (typeof window !== "undefined") {
    // Host wins when on agency.* so merchants can't stay stuck on merchant mode
    if (resolveModeFromHost() === "agency") {
      return true
    }
  }
  return getAdminMode() === "agency"
}

/** True when current host is merchant-only (block /agency routes UX). */
export function isMerchantHost(): boolean {
  return resolveModeFromHost() === "merchant"
}
