/**
 * Merchant admin entry from agency console.
 * MUST go through assume-store (agency airlock) — never open merchant admin
 * without a server-issued store session for agency users.
 */

import { assumeAndOpenStore } from "./agency-store-session"
import { getAgencyUid, getAgencyMembership } from "./agency-session"

const ACTIVE_TENANT_ID_KEY = "bentoco_active_tenant_id"
const ACTIVE_TENANT_NAME_KEY = "bentoco_active_tenant_name"
const ACTIVE_TENANT_SUBDOMAIN_KEY = "bentoco_active_tenant_subdomain"

export type OpenMerchantStoreInput = {
  tenantId?: string | null
  subdomain?: string | null
  storeName?: string | null
  /** Required for assume-store; falls back to membership email */
  email?: string | null
  preferSameOrigin?: boolean
}

function isLocalhost(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname.endsWith(".localhost") ||
      window.location.hostname === "127.0.0.1")
  )
}

export function getMerchantStoreOrigin(subdomain: string): string {
  const clean = subdomain.replace(/[^a-z0-9-]/gi, "").toLowerCase()
  if (isLocalhost()) {
    const port = window.location.port ? `:${window.location.port}` : ""
    return `http://${clean}.localhost${port}`
  }
  return `https://${clean}.bentoco.com`
}

export function setActiveTenantContext(input: {
  tenantId?: string | null
  storeName?: string | null
  subdomain?: string | null
}): void {
  if (typeof window === "undefined") return
  if (input.tenantId) {
    localStorage.setItem(ACTIVE_TENANT_ID_KEY, input.tenantId)
  }
  if (input.storeName) {
    localStorage.setItem(ACTIVE_TENANT_NAME_KEY, input.storeName)
  }
  if (input.subdomain) {
    localStorage.setItem(ACTIVE_TENANT_SUBDOMAIN_KEY, input.subdomain)
  }
}

export function getActiveTenantId(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(ACTIVE_TENANT_ID_KEY)
}

export function getActiveTenantLabel(): string | null {
  if (typeof window === "undefined") return null
  return (
    localStorage.getItem(ACTIVE_TENANT_NAME_KEY) ||
    localStorage.getItem(ACTIVE_TENANT_SUBDOMAIN_KEY)
  )
}

export function clearActiveTenantContext(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(ACTIVE_TENANT_ID_KEY)
  localStorage.removeItem(ACTIVE_TENANT_NAME_KEY)
  localStorage.removeItem(ACTIVE_TENANT_SUBDOMAIN_KEY)
}

/**
 * Open merchant store via assume-store airlock.
 * Accepts legacy string (treated as tenantId/subdomain fallback).
 *
 * Opens a blank tab immediately (user gesture) so popup blockers allow it.
 */
export async function openMerchantStore(
  subdomainOrInput: string | OpenMerchantStoreInput
): Promise<void> {
  const input: OpenMerchantStoreInput =
    typeof subdomainOrInput === "string"
      ? { tenantId: subdomainOrInput, subdomain: subdomainOrInput }
      : subdomainOrInput

  const tenantId = (input.tenantId || "").trim()
  if (!tenantId) {
    window.alert("Missing store id — cannot open merchant admin.")
    return
  }

  const membership = getAgencyMembership()
  let email = (input.email || membership?.email || "").trim()

  // Membership may not have email — try JWT-adjacent storage / me cache
  if (!email && typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("bentoco_agency_membership")
      if (raw) {
        const m = JSON.parse(raw)
        if (m?.email) email = String(m.email)
      }
    } catch {
      // ignore
    }
  }

  if (!email) {
    email =
      window.prompt("Confirm your agency email to open this store:")?.trim() ||
      ""
  }

  if (!email) {
    window.alert("Agency email is required to open a store.")
    return
  }

  // Must open during the click stack — after await, browsers block popups
  const preOpened = window.open("about:blank", "_blank")
  if (preOpened) {
    try {
      preOpened.document.write(
        "<!doctype html><title>Opening store…</title><body style=\"font-family:system-ui;padding:2rem;background:#000;color:#fff\">Opening merchant admin…</body>"
      )
    } catch {
      // cross-origin or restricted about:blank — fine
    }
  }

  const result = await assumeAndOpenStore({
    tenantId,
    email,
    agencyUid: getAgencyUid(),
    storeName: input.storeName,
    subdomain: input.subdomain,
    preOpenedWindow: preOpened,
  })

  if (!result.ok) {
    window.alert(result.error || "Access denied for this store.")
  }
}

export function openMerchantLogin(): void {
  const url = isLocalhost()
    ? `${window.location.protocol}//app.localhost${
        window.location.port ? `:${window.location.port}` : ""
      }/login`
    : "/login"
  window.open(url, "_blank", "noopener,noreferrer")
}

export const NEW_TAB_HINT = "opens in a new tab"

export function merchantOpenAriaLabel(storeName: string): string {
  return `Open ${storeName} merchant admin (${NEW_TAB_HINT})`
}

export function merchantOpenTitle(): string {
  return `Open merchant admin via Agency airlock (${NEW_TAB_HINT})`
}
