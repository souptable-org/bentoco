"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Search, ShoppingBag } from "lucide-react"
import type {
  ThemeBanner,
  ThemeBranding,
  ThemePromises,
} from "@/lib/theme"
import { shouldSuppressMockCatalog } from "@/lib/homepage-theme"
import { HeroBanners } from "@/components/home/hero-banners"
import { PromisesBar } from "@/components/home/promises-bar"
import { TenantChrome } from "@/components/tenant-chrome"

type TenantInfo = {
  tenant_id?: string
  store_name: string
  subdomain?: string | null
  custom_domain?: string | null
}

export type HomepageCategorySectionView = {
  title: string
  products: Array<{
    id: string
    title: string
    price: string
    image: string
    tag?: string
    slug?: string
  }>
}

export function TenantStorefront({
  tenant,
  branding,
  banners,
  promises,
  categorySections = [],
}: {
  tenant: TenantInfo
  branding?: ThemeBranding
  banners?: ThemeBanner[]
  promises?: ThemePromises
  categorySections?: HomepageCategorySectionView[]
}) {
  const [searchTerm, setSearchTerm] = useState("")

  const sampleProducts = [
    {
      id: "p1",
      title: `${tenant.store_name} Signature Product A`,
      price: "₹1,499",
      tag: "Best Seller",
      image:
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
      slug: "handwoven-chanderi-silk-saree",
    },
    {
      id: "p2",
      title: `${tenant.store_name} Premium Edition B`,
      price: "₹2,299",
      tag: "New",
      image:
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80",
      slug: "mens-linen-blend-kurta-set",
    },
    {
      id: "p3",
      title: `${tenant.store_name} Essential Craft C`,
      price: "₹999",
      tag: "Popular",
      image:
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80",
      slug: "handwoven-chanderi-silk-saree",
    },
    {
      id: "p4",
      title: `${tenant.store_name} Deluxe Pack D`,
      price: "₹3,499",
      tag: "Featured",
      image:
        "https://images.unsplash.com/photo-1560343090-f0409e92791a?w=600&auto=format&fit=crop&q=80",
      slug: "mens-linen-blend-kurta-set",
    },
  ]

  const filteredSamples = sampleProducts.filter((p) =>
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const hasConfiguredSections = shouldSuppressMockCatalog(categorySections)
  const showMockCatalog = !hasConfiguredSections

  return (
    <TenantChrome tenant={tenant} branding={branding}>
      {/* Hero Banners */}
      <HeroBanners banners={banners} storeName={tenant.store_name} />

      {/* Promises / Trust Bar */}
      <PromisesBar promises={promises} />

      {/* Homepage Category Sections */}
      {categorySections.length > 0 ? (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
          {categorySections.map((sec, idx) => (
            <div key={`${sec.title}-${idx}`} className="space-y-6">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  {sec.title}
                </h3>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {sec.products.map((prod) => (
                  <ProductCard key={prod.id} product={prod} />
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {/* Mock Catalog Fallback */}
      {showMockCatalog ? (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between border-b border-border pb-3 mb-6">
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              Featured Catalog
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {filteredSamples.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        </section>
      ) : null}
    </TenantChrome>
  )
}

function ProductCard({
  product,
}: {
  product: {
    id: string
    title: string
    price: string
    image: string
    tag?: string
    slug?: string
  }
}) {
  const href = product.slug ? `/product/${product.slug}` : `/shop`

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-card transition-all duration-300 hover:shadow-lg">
      <Link href={href} className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.tag ? (
          <span className="absolute left-3 top-3 rounded-[var(--radius)] border border-border bg-background/90 px-2.5 py-1 text-[10px] font-bold text-primary backdrop-blur-md">
            {product.tag}
          </span>
        ) : null}
      </Link>

      <div className="flex flex-1 flex-col justify-between p-5">
        <div>
          <Link href={href} className="block">
            <h4 className="font-semibold text-foreground transition-colors group-hover:text-primary">
              {product.title}
            </h4>
            <p className="mt-2 text-sm font-bold text-foreground">
              {product.price}
            </p>
          </Link>
        </div>

        <Link
          href={href}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-colors hover:opacity-90"
        >
          <ShoppingBag className="h-4 w-4" /> View product
        </Link>
      </div>
    </div>
  )
}
