/**
 * Agency invite handshake cookie (set from login?agency_invite=…).
 * Used so merchant signup can prefill the 6-digit agency code.
 */

export const AGENCY_INVITE_COOKIE = "bentoco_agency_invite"
export const AGENCY_INVITE_STORAGE = "bentoco_agency_invite"

export type AgencyInvitePayload = {
  inviteToken: string
  agencyUid: string
  email?: string
  storeDisplayName?: string
  inviteType?: "new_merchant" | "existing_merchant"
}

export function setAgencyInviteCookie(payload: AgencyInvitePayload): void {
  if (typeof document === "undefined") return
  const maxAge = 60 * 60 * 48 // 48h
  const value = encodeURIComponent(JSON.stringify(payload))
  document.cookie = `${AGENCY_INVITE_COOKIE}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`
  try {
    localStorage.setItem(AGENCY_INVITE_STORAGE, JSON.stringify(payload))
  } catch {
    // ignore
  }
}

export function getAgencyInviteCookie(): AgencyInvitePayload | null {
  if (typeof document === "undefined") return null

  try {
    const raw = localStorage.getItem(AGENCY_INVITE_STORAGE)
    if (raw) {
      return JSON.parse(raw) as AgencyInvitePayload
    }
  } catch {
    // fall through
  }

  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${AGENCY_INVITE_COOKIE}=`))
  if (!match) return null
  try {
    const json = decodeURIComponent(match.split("=").slice(1).join("="))
    return JSON.parse(json) as AgencyInvitePayload
  } catch {
    return null
  }
}

export function clearAgencyInviteCookie(): void {
  if (typeof document === "undefined") return
  document.cookie = `${AGENCY_INVITE_COOKIE}=; path=/; max-age=0`
  try {
    localStorage.removeItem(AGENCY_INVITE_STORAGE)
  } catch {
    // ignore
  }
}

/** Parse login URL search params into invite payload */
export function parseAgencyInviteFromSearch(
  search: string
): AgencyInvitePayload | null {
  const params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`)
  const inviteToken = params.get("agency_invite")
  const agencyUid = params.get("agency")
  if (!inviteToken || !agencyUid) return null
  return {
    inviteToken,
    agencyUid,
    email: params.get("email") || undefined,
    storeDisplayName: params.get("store") || undefined,
    inviteType:
      (params.get("type") as AgencyInvitePayload["inviteType"]) ||
      "new_merchant",
  }
}

/** Digits only for OTP UI (from AGENCY-849201 → 849201) */
export function agencyUidToDigits(uid: string): string {
  const digits = String(uid || "").replace(/\D/g, "")
  return digits.slice(-6)
}
