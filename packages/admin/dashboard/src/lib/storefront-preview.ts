export function getStorefrontBaseUrl(): string {
  const envUrl =
    (import.meta.env as any)?.VITE_MEDUSA_STOREFRONT_URL ||
    (import.meta.env as any)?.VITE_STOREFRONT_URL
  if (envUrl) {
    return envUrl.replace(/\/$/, "")
  }
  return "http://localhost:3001"
}

export function normalizePreviewPath(rawPath?: string | null): string {
  if (!rawPath || rawPath === "/") return "/"
  const clean = rawPath.trim()
  return clean.startsWith("/") ? clean : `/${clean}`
}

export interface StorefrontPreviewUrlOptions {
  path?: string
  tenantId?: string | null
  cacheBust?: number | string
  draft?: boolean
}

export function storefrontPreviewUrl({
  path = "/",
  tenantId,
  cacheBust,
  draft = true,
}: StorefrontPreviewUrlOptions): string {
  const baseUrl = getStorefrontBaseUrl()
  const cleanPath = normalizePreviewPath(path)
  const url = new URL(cleanPath, baseUrl)

  if (draft) {
    url.searchParams.set("preview", "1")
  }
  if (tenantId) {
    url.searchParams.set("tenant_id", tenantId)
  }
  if (cacheBust) {
    url.searchParams.set("t", String(cacheBust))
  }

  return url.toString()
}
