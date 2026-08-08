/**
 * Client helpers for agency assume-store sessions.
 * Session token must be present for agency members on /admin APIs.
 */

import { getAgencyUid, getAgencyMembership } from "./agency-session"

const STORE_SESSION_KEY = "bentoco_agency_store_session"
const STORE_SESSION_META_KEY = "bentoco_agency_store_session_meta"

export type StoreSessionMeta = {
  tenantId: string
  storeName?: string
  subdomain?: string
  agencyUid?: string
  expiresAt?: string
  authMethod?: string
  publishedByEmail?: string | null
  memberEmail?: string
}

function backendBase(): string {
  if (typeof window !== "undefined") {
    return window.location.origin
  }
  return ""
}

export function getStoreSessionToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(STORE_SESSION_KEY)
}

export function getStoreSessionMeta(): StoreSessionMeta | null {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(STORE_SESSION_META_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function persistStoreSession(
  token: string,
  meta: StoreSessionMeta
): void {
  localStorage.setItem(STORE_SESSION_KEY, token)
  localStorage.setItem(STORE_SESSION_META_KEY, JSON.stringify(meta))
  if (meta.tenantId) {
    localStorage.setItem("bentoco_active_tenant_id", meta.tenantId)
  }
  if (meta.storeName) {
    localStorage.setItem("bentoco_active_tenant_name", meta.storeName)
  }
  if (meta.subdomain) {
    localStorage.setItem("bentoco_active_tenant_subdomain", meta.subdomain)
  }
}

export function clearStoreSession(): void {
  localStorage.removeItem(STORE_SESSION_KEY)
  localStorage.removeItem(STORE_SESSION_META_KEY)
}

export function hasValidStoreSession(): boolean {
  // Always re-hydrate from URL first (new tab from Open store)
  hydrateStoreSessionFromUrl()
  const token = getStoreSessionToken()
  const meta = getStoreSessionMeta()
  if (!token || !meta?.tenantId) return false
  if (meta.expiresAt && new Date(meta.expiresAt) < new Date()) {
    clearStoreSession()
    return false
  }
  return true
}

/**
 * New tab may not see localStorage write race; session is also passed in the URL.
 * Call as early as possible on merchant admin boot.
 */
export function hydrateStoreSessionFromUrl(): boolean {
  if (typeof window === "undefined") return false
  try {
    const params = new URLSearchParams(window.location.search)
    const token =
      params.get("store_session") || params.get("agency_store_session")
    const tenantId = params.get("tenant_id")
    if (!token || !tenantId) {
      return false
    }

    persistStoreSession(token, {
      tenantId,
      storeName: params.get("store_name") || undefined,
      subdomain: params.get("store") || undefined,
      agencyUid: params.get("agency_uid") || undefined,
      expiresAt: params.get("expires_at") || undefined,
      authMethod: params.get("auth_method") || "password_assume",
      memberEmail: params.get("member_email") || undefined,
      publishedByEmail: params.get("published_by") || undefined,
    })

    // Strip secrets from the address bar after hydrate
    params.delete("store_session")
    params.delete("agency_store_session")
    params.delete("expires_at")
    // keep tenant_id / store for UX
    const qs = params.toString()
    const clean =
      window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash
    window.history.replaceState({}, "", clean)
    return true
  } catch {
    return false
  }
}

/**
 * True when agency staff is operating a merchant store (airlock passed).
 * Merchant shell must stay; do NOT send them back to /agency.
 */
export function isStoreOperatorMode(): boolean {
  return hasValidStoreSession()
}

/**
 * Agency airlock: call assume-store then open merchant admin.
 * Opens merchant /orders (not / or /agency/*).
 *
 * IMPORTANT: open a blank tab synchronously in the click handler (pass
 * `preOpenedWindow`) — browsers block window.open() after await.
 */
export async function assumeAndOpenStore(input: {
  tenantId: string
  email: string
  agencyUid?: string | null
  storeName?: string | null
  subdomain?: string | null
  /** Opened with window.open("about:blank") in the click handler */
  preOpenedWindow?: Window | null
}): Promise<{ ok: boolean; error?: string; openUrl?: string }> {
  const agencyUid =
    input.agencyUid || getAgencyUid() || undefined
  const popup = input.preOpenedWindow ?? null

  try {
    const res = await fetch(`${backendBase()}/api/agency/assume-store`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: input.email,
        tenantId: input.tenantId,
        agencyUid,
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.allowed || !data.sessionToken) {
      if (popup && !popup.closed) {
        popup.close()
      }
      return {
        ok: false,
        error: data.error || "Could not open store (access denied).",
      }
    }

    persistStoreSession(data.sessionToken, {
      tenantId: data.tenantId,
      storeName: data.storeName || input.storeName || undefined,
      subdomain: data.subdomain || input.subdomain || undefined,
      agencyUid: data.agencyUid,
      expiresAt: data.expiresAt,
      authMethod: data.authMethod,
      memberEmail: data.memberEmail,
    })

    // Merchant admin entry — never /agency/*
    // Pass store_session in URL so the new tab hydrates even if storage races.
    const params = new URLSearchParams()
    params.set("tenant_id", data.tenantId)
    params.set("store_session", data.sessionToken)
    params.set("agency_session", "1")
    if (data.subdomain) params.set("store", data.subdomain)
    if (data.storeName) params.set("store_name", data.storeName)
    if (data.agencyUid) params.set("agency_uid", data.agencyUid)
    if (data.memberEmail) params.set("member_email", data.memberEmail)
    if (data.expiresAt) params.set("expires_at", data.expiresAt)
    if (data.authMethod) params.set("auth_method", data.authMethod)

    const openUrl = `${backendBase()}/orders?${params.toString()}`

    if (popup && !popup.closed) {
      popup.location.href = openUrl
    } else {
      // Popup blocked or not pre-opened → same-tab merchant admin
      window.location.assign(openUrl)
    }
    return { ok: true, openUrl }
  } catch (err: any) {
    if (popup && !popup.closed) {
      popup.close()
    }
    return {
      ok: false,
      error: err?.message || "Network error opening store.",
    }
  }
}

export async function leaveStoreSession(): Promise<void> {
  const token = getStoreSessionToken()
  const meta = getStoreSessionMeta()
  if (token) {
    try {
      await fetch(`${backendBase()}/api/agency/leave-store`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken: token,
          email: meta?.memberEmail,
        }),
      })
    } catch {
      // ignore network errors on leave
    }
  }
  clearStoreSession()
}

export async function redeemTempCodeAndOpen(input: {
  email: string
  accessCode: string
}): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(`${backendBase()}/api/agency/redeem-temp-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.allowed || !data.sessionToken) {
    return { ok: false, error: data.error || "Invalid or expired code." }
  }

  persistStoreSession(data.sessionToken, {
    tenantId: data.tenantId,
    storeName: data.storeName,
    subdomain: data.subdomain,
    agencyUid: data.agencyUid,
    expiresAt: data.expiresAt,
    authMethod: data.authMethod,
    publishedByEmail: data.publishedByEmail,
    memberEmail: data.memberEmail,
  })

  const params = new URLSearchParams()
  params.set("tenant_id", data.tenantId)
  params.set("agency_session", "1")
  params.set("temp", "1")
  window.location.href = `/?${params.toString()}`
  return { ok: true }
}

/** Actor email for headers — prefer membership, else session meta */
export function getActorEmailHint(): string | null {
  const m = getAgencyMembership()
  if (m?.email) return m.email
  const meta = getStoreSessionMeta()
  return meta?.memberEmail || null
}
