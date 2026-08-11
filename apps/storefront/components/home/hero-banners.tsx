"use client"

import { useCallback, useEffect, useState } from "react"
import type { ThemeBanner } from "@/lib/theme"
import { activeBanners } from "@/lib/homepage-theme"

const AUTO_MS = 5500
const SLIDE_MS = 600

export function HeroBanners({
  banners,
  storeName,
}: {
  banners?: ThemeBanner[]
  storeName: string
}) {
  const items = activeBanners(banners)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const multi = items.length > 1

  const goTo = useCallback(
    (next: number) => {
      if (!items.length) return
      const n = ((next % items.length) + items.length) % items.length
      setIndex(n)
    },
    [items.length]
  )

  const goNext = useCallback(() => goTo(index + 1), [goTo, index])
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index])

  useEffect(() => {
    if (!multi || paused) return
    const t = window.setInterval(() => {
      setIndex((i) => (i + 1) % items.length)
    }, AUTO_MS)
    return () => window.clearInterval(t)
  }, [multi, paused, items.length])

  if (items.length === 0) {
    return (
      <section className="relative overflow-hidden border-b border-border bg-muted/40 py-16 sm:py-24">
        <div className="relative z-10 mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <span className="mb-4 inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
            Welcome
          </span>
          <h2
            className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl"
            style={{
              fontFamily: "var(--font-display), var(--font-sans), system-ui",
            }}
          >
            {storeName}
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Discover the collection — quality products, secure checkout, and
            dedicated support.
          </p>
        </div>
      </section>
    )
  }

  return (
    <section
      className="group relative w-full overflow-hidden border-b border-border bg-muted"
      style={{ aspectRatio: "1920 / 720" }}
      aria-roledescription="carousel"
      aria-label="Store banners"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
          setPaused(false)
        }
      }}
    >
      {/* Sliding track — moves left as index increases */}
      <div
        className="flex h-full w-full"
        style={{
          width: `${items.length * 100}%`,
          transform: `translate3d(-${(index * 100) / items.length}%, 0, 0)`,
          transition: `transform ${SLIDE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
          willChange: "transform",
        }}
      >
        {items.map((item, i) => (
          <div
            key={`${item.url}-${i}`}
            className="relative h-full shrink-0"
            style={{ width: `${100 / items.length}%` }}
            aria-hidden={i !== index}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.url}
              alt={item.alt || `${storeName} banner ${i + 1}`}
              className="h-full w-full object-cover object-center"
              draggable={false}
            />
          </div>
        ))}
      </div>

      {/* Soft bottom gradient so dots stay readable on any banner */}
      {multi ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/45 via-black/15 to-transparent"
          aria-hidden
        />
      ) : null}

      {multi ? (
        <>
          {/* Prev / next — fade in on hover */}
          <button
            type="button"
            aria-label="Previous banner"
            onClick={goPrev}
            className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 hover:bg-black/50 group-hover:opacity-100 focus-visible:opacity-100 sm:left-4"
          >
            <ChevronLeft />
          </button>
          <button
            type="button"
            aria-label="Next banner"
            onClick={goNext}
            className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white opacity-0 backdrop-blur-sm transition-opacity duration-200 hover:bg-black/50 group-hover:opacity-100 focus-visible:opacity-100 sm:right-4"
          >
            <ChevronRight />
          </button>

          {/* Dotted navigation */}
          <div
            className="absolute bottom-4 left-0 right-0 z-10 flex items-center justify-center gap-2 sm:bottom-5"
            role="tablist"
            aria-label="Banner slides"
          >
            {items.map((_, i) => {
              const active = i === index
              return (
                <button
                  key={i}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`Show banner ${i + 1} of ${items.length}`}
                  onClick={() => goTo(i)}
                  className="group/dot relative flex h-6 items-center justify-center px-0.5"
                >
                  <span
                    className={
                      active
                        ? "h-2 w-2.5 rounded-full bg-white shadow-sm ring-2 ring-white/40 transition-all duration-300 sm:h-2 sm:w-6"
                        : "h-2 w-2 rounded-full bg-white/55 transition-all duration-300 hover:bg-white/85 group-hover/dot:scale-110"
                    }
                  />
                </button>
              )
            })}
          </div>
        </>
      ) : null}

      {/* Live region for screen readers */}
      {multi ? (
        <span className="sr-only" aria-live="polite">
          Banner {index + 1} of {items.length}
        </span>
      ) : null}
    </section>
  )
}

function ChevronLeft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M15 6L9 12l6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
