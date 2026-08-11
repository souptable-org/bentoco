"use client"

import React, { useEffect, useMemo, useState } from "react"
import { getProducts } from "@/lib/data"
import type { Product } from "@/lib/types"
import { ProductCard } from "@/components/product/ProductCard"
import { SlidersHorizontal, ChevronDown } from "lucide-react"

import { TenantChrome } from "@/components/tenant-chrome"

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [source, setSource] = useState<"medusa" | "mock" | "loading">(
    "loading"
  )
  const [activeCategory, setActiveCategory] = useState<string>("All")
  const [sortBy, setSortBy] = useState<string>("featured")
  const [sortOpen, setSortOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    let cancelled = false
    getProducts().then(({ products: list, source: src }) => {
      if (!cancelled) {
        setProducts(list)
        setSource(src)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const categories = useMemo(() => {
    const set = new Set<string>(["All"])
    for (const p of products) {
      if (p.category) set.add(p.category)
      p.tags?.forEach((t) => set.add(t))
    }
    return Array.from(set).slice(0, 12)
  }, [products])

  const filteredProducts = useMemo(() => {
    let result = [...products]
    if (activeCategory !== "All") {
      result = result.filter(
        (p) =>
          p.category.toLowerCase().includes(activeCategory.toLowerCase()) ||
          p.tags.some((t) =>
            t.toLowerCase().includes(activeCategory.toLowerCase())
          )
      )
    }

    if (sortBy === "price-low") {
      result.sort((a, b) => a.price - b.price)
    } else if (sortBy === "price-high") {
      result.sort((a, b) => b.price - a.price)
    }

    return result
  }, [products, activeCategory, sortBy])

  return (
    <TenantChrome tenant={{ store_name: "Merchant Catalog" }}>
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col items-center justify-center text-center mb-16">
        <h1 className="font-serif text-4xl md:text-5xl font-semibold mb-4">
          Collection
        </h1>
        <p className="text-muted-foreground max-w-xl">
          Curated pieces for your modern lifestyle. Discover our latest
          arrivals and timeless classics.
        </p>
        {source !== "loading" && (
          <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
            Source:{" "}
            <span className="font-semibold text-foreground">
              {source === "medusa" ? "Medusa / Bentoco API" : "Demo mock data"}
            </span>
          </p>
        )}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center border-y border-border py-4 mb-12 gap-4">
        <div className="flex items-center gap-6 overflow-x-auto w-full sm:w-auto hide-scrollbar pb-2 sm:pb-0 snap-x snap-mandatory">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`snap-start text-sm font-medium tracking-wide uppercase whitespace-nowrap transition-colors ${
                activeCategory === cat
                  ? "text-accent border-b border-accent pb-1"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 sm:gap-6 w-full sm:w-auto justify-between sm:justify-end">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide md:hidden"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filters
          </button>

          <div className="relative">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:block">
                Sort by:
              </span>
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="flex items-center gap-2 text-sm font-medium uppercase tracking-wide py-1 focus:outline-none cursor-pointer"
              >
                {sortBy === "featured"
                  ? "Featured"
                  : sortBy === "price-low"
                    ? "Price: Low to High"
                    : "Price: High to Low"}
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {sortOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setSortOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-md shadow-lg z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      setSortBy("featured")
                      setSortOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3 text-sm ${
                      sortBy === "featured"
                        ? "bg-accent/10 font-bold"
                        : "hover:bg-muted"
                    }`}
                  >
                    Featured
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("price-low")
                      setSortOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3 text-sm ${
                      sortBy === "price-low"
                        ? "bg-accent/10 font-bold"
                        : "hover:bg-muted"
                    }`}
                  >
                    Price: Low to High
                  </button>
                  <button
                    onClick={() => {
                      setSortBy("price-high")
                      setSortOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3 text-sm border-t border-border ${
                      sortBy === "price-high"
                        ? "bg-accent/10 font-bold"
                        : "hover:bg-muted"
                    }`}
                  >
                    Price: High to Low
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {source === "loading" ? (
        <div className="text-center py-24 text-muted-foreground">
          Loading products…
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-8 sm:gap-y-12">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {showFilters && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setShowFilters(false)}
          />
          <div className="relative w-[80%] max-w-sm h-full bg-card shadow-xl flex flex-col p-6 animate-in slide-in-from-left">
            <div className="flex items-center justify-between mb-8">
              <h2 className="font-serif text-2xl font-semibold">Filters</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="p-2 -mr-2"
              >
                <span className="sr-only">Close</span>×
              </button>
            </div>
            <div className="space-y-3">
              {categories.map((cat) => (
                <label key={cat} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="category"
                    checked={activeCategory === cat}
                    onChange={() => {
                      setActiveCategory(cat)
                      setShowFilters(false)
                    }}
                    className="w-4 h-4 accent-foreground"
                  />
                  <span className="text-sm">{cat}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {source !== "loading" && filteredProducts.length === 0 && (
        <div className="text-center py-24 text-muted-foreground">
          <p>No products found. Add products in merchant admin → Products.</p>
        </div>
      )}
    </div>
    </TenantChrome>
  )
}
