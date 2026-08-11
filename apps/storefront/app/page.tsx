import { headers } from "next/headers"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"
import {
  TenantStorefront,
  type HomepageCategorySectionView,
} from "@/components/tenant-storefront"
import { StoreNotFound } from "@/components/store-not-found"
import { fetchStorefrontTheme } from "@/lib/theme"
import { fetchStoreProductsByIds } from "@/lib/medusa"
import {
  orderProductsByIds,
  sliceSectionProductIds,
  sortCategorySections,
} from "@/lib/homepage-theme"

/**
 * Tenant homepage data flow:
 *   page.tsx (server) → fetchStorefrontTheme → pass branding/homepage props
 *   → TenantStorefront (client). CSS inject remains in ThemeStyles (layout).
 *
 * Editor iframe uses ?tenant_id=&preview=1 on localhost so middleware sets x-tenant-id.
 */
export default async function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}) {
  const headerList = await headers()
  const host =
    headerList.get("x-forwarded-host") || headerList.get("host") || ""
  const sp = (await searchParams) || {}
  const queryTenant = Array.isArray(sp.tenant_id)
    ? sp.tenant_id[0]
    : sp.tenant_id
  const tenantId = headerList.get("x-tenant-id") || queryTenant || null
  const isNotFound =
    headerList.get("x-tenant-not-found") === "1" && !tenantId
  const hostWithoutPort = host.split(":")[0].toLowerCase().trim()
  const isSubdomain =
    hostWithoutPort !== "localhost" &&
    hostWithoutPort !== "127.0.0.1" &&
    hostWithoutPort !== "bentoco.in" &&
    hostWithoutPort !== "www.bentoco.in"
  const isPreview =
    headerList.get("x-theme-preview") === "1" ||
    sp.preview === "1" ||
    Boolean(queryTenant)

  if (isNotFound) {
    const subdomain = hostWithoutPort.split(".")[0]
    return <StoreNotFound domain={host} subdomain={subdomain} />
  }

  if (isSubdomain || tenantId || isPreview) {
    const subdomain = hostWithoutPort.split(".")[0]
    let tenant: {
      tenant_id?: string
      store_name: string
      subdomain?: string | null
      custom_domain?: string | null
    } | null = null

    const backend =
      process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
    const publishableKey =
      process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
      "pk_60d15336d7c41922c4ac354c4a90da700f0d785c6bb83269983167f444672f49"

    try {
      // Prefer domain resolve (subdomain hosts). For editor iframe on localhost
      // we only have tenant_id — theme API still works with tenant_id alone.
      const res = await fetch(
        `${backend}/store/tenant/resolve?domain=${encodeURIComponent(host)}`,
        {
          headers: { "x-publishable-api-key": publishableKey },
          cache: "no-store",
        }
      )

      if (res.ok) {
        const data = await res.json()
        if (data?.tenant_id) {
          tenant = data
        }
      }
    } catch (err) {
      console.warn("[page.tsx] Failed to fetch tenant metadata", err)
    }

    // Editor preview: construct minimal tenant from id + theme payload
    if (!tenant && tenantId) {
      tenant = {
        tenant_id: tenantId,
        store_name: "Store",
        subdomain: null,
        custom_domain: null,
      }
    }

    if (!tenant) {
      return <StoreNotFound domain={host} subdomain={subdomain} />
    }

    const resolvedTenantId = tenant.tenant_id || tenantId || null

    // Single theme load for homepage content (always fresh in preview/dev)
    const theme = await fetchStorefrontTheme({
      tenantId: resolvedTenantId,
      host,
      preview: isPreview || process.env.NODE_ENV === "development",
    })

    // Enrich store name from theme API when domain resolve skipped
    if (theme.store_name && tenant.store_name === "Store") {
      tenant = { ...tenant, store_name: theme.store_name }
    }

    const branding = theme.theme_config?.branding
    const banners = theme.theme_config?.homepage?.banners
    const promises = theme.theme_config?.homepage?.promises

    const rawSections = sortCategorySections(
      theme.theme_config?.homepage?.category_sections || []
    )

    let categorySections: HomepageCategorySectionView[] = []
    try {
      categorySections = await Promise.all(
        rawSections.map(async (sec) => {
          const ids = sliceSectionProductIds(sec.product_ids, {
            source: sec.source,
            category_id: sec.category_id,
            limit: sec.limit,
          })
          let products: HomepageCategorySectionView["products"] = []
          if (ids.length) {
            try {
              const fetched = await fetchStoreProductsByIds(ids, {
                tenantId: resolvedTenantId,
              })
              const ordered = orderProductsByIds(fetched, ids)
              products = ordered.map((p) => ({
                id: p.id,
                title: p.name,
                price: `₹${p.price.toLocaleString("en-IN")}`,
                image: p.images?.[0] || "",
                tag: p.tags?.[0] || p.category,
                slug: p.slug,
              }))
            } catch {
              products = []
            }
          }
          return {
            title: sec.title || "Collection",
            products,
          }
        })
      )
    } catch {
      categorySections = []
    }

    return (
      <TenantStorefront
        tenant={tenant}
        branding={branding}
        banners={banners}
        promises={promises}
        categorySections={categorySections}
      />
    )
  }

  // Apex domain → platform landing
  return (
    <main className="flex min-h-screen flex-col justify-between bg-slate-950 font-sans text-slate-100 selection:bg-emerald-500/30 selection:text-white">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-400">
          Bentoco Multi-Tenant E-Commerce Platform
        </span>

        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
          Next-Gen Commerce Engine <br />
          <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            For Indian Merchants
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-slate-400 sm:text-lg">
          High-performance multi-tenant storefront engine with native UPI, COD
          verification, Shiprocket logistics, and zero app tax.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="http://alpha.localhost:3000"
            className="rounded-xl bg-emerald-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition-colors hover:bg-emerald-400"
          >
            Preview Demo Storefront (alpha.localhost)
          </a>
          <a
            href="http://localhost:7001"
            className="rounded-xl border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
          >
            Open Merchant Dashboard
          </a>
        </div>
      </div>

      <Footer />
    </main>
  )
}
