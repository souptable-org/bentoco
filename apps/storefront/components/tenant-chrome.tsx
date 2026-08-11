"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Search, ShoppingBag } from "lucide-react"
import type { ThemeBranding } from "@/lib/theme"
import { ThemeToggle } from "@/components/theme-toggle"

export type TenantInfo = {
  tenant_id?: string
  store_name: string
  subdomain?: string | null
  custom_domain?: string | null
}

export function TenantChrome({
  tenant,
  branding,
  children,
}: {
  tenant: TenantInfo
  branding?: ThemeBranding
  children: React.ReactNode
}) {
  const [searchTerm, setSearchTerm] = useState("")

  const iconUrl = branding?.logo_icon_url || branding?.logo_url || ""
  const wordmarkOn = branding?.wordmark_enabled !== false
  const wordmarkMode = branding?.wordmark_mode || "font"
  const wordmarkSvg = branding?.wordmark_svg_url || ""
  const wordmarkText = branding?.wordmark_text || tenant.store_name
  const wordmarkFont = branding?.wordmark_font_family

  return (
    <div className="min-h-screen bg-surface text-foreground font-sans flex flex-col selection:bg-accent/20 selection:text-foreground">
      {/* Dynamic Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-card/90 backdrop-blur-md transition-colors">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            {iconUrl ? (
              <img
                src={iconUrl}
                alt={tenant.store_name}
                className="h-9 w-9 object-contain transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md">
                {tenant.store_name.slice(0, 2).toUpperCase()}
              </div>
            )}

            {wordmarkOn ? (
              wordmarkMode === "svg" && wordmarkSvg ? (
                <img
                  src={wordmarkSvg}
                  alt={wordmarkText}
                  className="h-6 max-w-[160px] object-contain"
                />
              ) : (
                <span
                  className="text-lg font-bold tracking-tight text-foreground transition-colors group-hover:text-accent"
                  style={wordmarkFont ? { fontFamily: wordmarkFont } : undefined}
                >
                  {wordmarkText}
                </span>
              )
            ) : null}
          </Link>

          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/shop" className="hover:text-foreground transition-colors">
              Shop All
            </Link>
            <Link href="/track-order" className="hover:text-foreground transition-colors">
              Track Order
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search catalog..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-48 lg:w-64 rounded-full bg-input border border-border pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent transition-all"
              />
            </div>

            <ThemeToggle />

            <Link
              href="/cart"
              className="relative flex h-9 w-9 items-center justify-center rounded-full bg-input border border-border text-foreground hover:bg-muted transition-colors"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                0
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1">{children}</main>

      {/* Dynamic Footer */}
      <footer className="border-t border-border bg-card text-card-foreground">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-base text-foreground mb-3">{tenant.store_name}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Powered by Bentoco Multi-Tenant Commerce Engine. High-performance, native UPI, and fast regional shipping.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">Shop</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link href="/shop" className="hover:text-foreground">All Products</Link></li>
                <li><Link href="/shop?tag=featured" className="hover:text-foreground">Featured Collections</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">Customer Care</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li><Link href="/track-order" className="hover:text-foreground">Track Your Package</Link></li>
                <li><Link href="/faq" className="hover:text-foreground">Shipping & Returns</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-3">Trust & Payments</h4>
              <p className="text-xs text-muted-foreground mb-2">Native UPI, COD Verification & Razorpay Secure.</p>
              <span className="inline-block px-2.5 py-1 rounded bg-muted text-[10px] font-mono text-muted-foreground">GST Complaint Store</span>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
            <p>© {new Date().getFullYear()} {tenant.store_name}. All rights reserved.</p>
            <p className="text-[11px]">Bentoco Storefront Engine</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
