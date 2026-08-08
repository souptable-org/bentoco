import Medusa from "@bentoco/js-sdk"

/**
 * Always use the page origin in the browser so Vite can proxy
 * /auth, /admin, /api → Medusa :9000. Avoids CORS / "Failed to fetch"
 * from cross-origin calls to localhost:9000.
 */
function resolveBackendUrl(): string {
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin
  }
  // SSR / non-browser fallback
  try {
    // eslint-disable-next-line no-undef
    const fromDefine =
      typeof __BACKEND_URL__ !== "undefined" ? __BACKEND_URL__ : ""
    if (fromDefine && fromDefine !== "/") {
      return fromDefine
    }
  } catch {
    // ignore
  }
  return "http://localhost:9000"
}

function resolveAuthType(): "jwt" | "session" {
  try {
    // eslint-disable-next-line no-undef
    const t = typeof __AUTH_TYPE__ !== "undefined" ? __AUTH_TYPE__ : "jwt"
    return t === "session" ? "session" : "jwt"
  } catch {
    return "jwt"
  }
}

function resolveJwtKey(): string {
  try {
    // eslint-disable-next-line no-undef
    return (
      (typeof __JWT_TOKEN_STORAGE_KEY__ !== "undefined" &&
        __JWT_TOKEN_STORAGE_KEY__) ||
      "bentoco_jwt"
    )
  } catch {
    return "bentoco_jwt"
  }
}

export const backendUrl = resolveBackendUrl()
const authType = resolveAuthType()
const jwtTokenStorageKey = resolveJwtKey()

function tenantGlobalHeaders(): Record<string, string> {
  if (typeof window === "undefined") {
    return {}
  }
  const headers: Record<string, string> = {}
  const tenantId = localStorage.getItem("bentoco_active_tenant_id")
  if (tenantId) {
    headers["x-tenant-id"] = tenantId
  }
  const storeSession = localStorage.getItem("bentoco_agency_store_session")
  if (storeSession) {
    headers["x-agency-store-session"] = storeSession
  }
  // Help admin gate resolve actor email for agency members
  try {
    const metaRaw = localStorage.getItem("bentoco_agency_store_session_meta")
    if (metaRaw) {
      const meta = JSON.parse(metaRaw)
      if (meta?.memberEmail) {
        headers["x-actor-email"] = meta.memberEmail
      }
    }
    const membershipRaw = localStorage.getItem("bentoco_agency_membership")
    if (membershipRaw && !headers["x-actor-email"]) {
      const m = JSON.parse(membershipRaw)
      if (m?.email) headers["x-actor-email"] = m.email
    }
  } catch {
    // ignore
  }
  return headers
}

export const sdk = new Medusa({
  baseUrl: backendUrl,
  auth: {
    type: authType,
    jwtTokenStorageKey,
  },
  // Re-read each request via custom fetch path: Config.globalHeaders is
  // spread per request; we use a Proxy so tenant switcher stays live.
  globalHeaders: new Proxy(
    {},
    {
      ownKeys() {
        return Object.keys(tenantGlobalHeaders())
      },
      getOwnPropertyDescriptor(_t, prop) {
        const h = tenantGlobalHeaders()
        if (prop in h) {
          return {
            enumerable: true,
            configurable: true,
            value: h[prop as string],
          }
        }
        return undefined
      },
      get(_t, prop: string) {
        return tenantGlobalHeaders()[prop]
      },
    }
  ) as Record<string, string>,
})

// Hydrate agency store-operator session when Open store lands on merchant admin
if (typeof window !== "undefined") {
  try {
    const params = new URLSearchParams(window.location.search)
    const token =
      params.get("store_session") || params.get("agency_store_session")
    const tid = params.get("tenant_id")
    if (token && tid) {
      localStorage.setItem("bentoco_agency_store_session", token)
      localStorage.setItem("bentoco_active_tenant_id", tid)
      const meta = {
        tenantId: tid,
        storeName: params.get("store_name") || undefined,
        subdomain: params.get("store") || undefined,
        agencyUid: params.get("agency_uid") || undefined,
        expiresAt: params.get("expires_at") || undefined,
        authMethod: params.get("auth_method") || "password_assume",
        memberEmail: params.get("member_email") || undefined,
      }
      localStorage.setItem(
        "bentoco_agency_store_session_meta",
        JSON.stringify(meta)
      )
      if (meta.storeName) {
        localStorage.setItem("bentoco_active_tenant_name", meta.storeName)
      }
      if (meta.subdomain) {
        localStorage.setItem("bentoco_active_tenant_subdomain", meta.subdomain)
      }
      // Strip token from URL after hydrate
      params.delete("store_session")
      params.delete("agency_store_session")
      params.delete("expires_at")
      const qs = params.toString()
      window.history.replaceState(
        {},
        "",
        window.location.pathname + (qs ? `?${qs}` : "") + window.location.hash
      )
    } else if (tid) {
      localStorage.setItem("bentoco_active_tenant_id", tid)
    }
    const store = params.get("store")
    if (store) {
      localStorage.setItem("bentoco_active_tenant_subdomain", store)
    }
  } catch {
    // ignore
  }
}

// useful when you want to call the BE from the console and try things out quickly
if (typeof window !== "undefined") {
  ;(window as any).__sdk = sdk
  ;(window as any).__BACKEND_URL_RESOLVED__ = backendUrl
  ;(window as any).__AUTH_TYPE_RESOLVED__ = authType
}
