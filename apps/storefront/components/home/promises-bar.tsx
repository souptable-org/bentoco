"use client"

import type { ThemePromises } from "@/lib/theme"
import { promisesBarVisible } from "@/lib/homepage-theme"
import {
  isCustomPromiseIcon,
  resolvePromiseIcon,
} from "@/lib/promise-icons"

function gridClassForCount(count: number): string {
  // Centered band; equal columns; never leave a lone uneven column looking off-center
  if (count <= 1) return "mx-auto grid max-w-[14rem] grid-cols-1"
  if (count === 2) return "mx-auto grid max-w-xl grid-cols-2"
  if (count === 3) return "mx-auto grid max-w-3xl grid-cols-1 sm:grid-cols-3"
  return "mx-auto grid max-w-5xl grid-cols-2 lg:grid-cols-4"
}

export function PromisesBar({ promises }: { promises?: ThemePromises }) {
  if (!promisesBarVisible(promises)) return null

  const items = (promises?.items || []).filter((i) => (i.text || "").trim())
  const count = items.length

  return (
    <section
      className="border-b border-border bg-card"
      aria-label="Store promises"
    >
      <div className="px-4 py-9 sm:px-6 sm:py-11 lg:px-8">
        <ul className={`${gridClassForCount(count)} gap-x-0 gap-y-8`}>
          {items.map((item, i) => {
            const custom = isCustomPromiseIcon(item) && item.icon_url
            const Icon = resolvePromiseIcon(item.icon)
            const showDivider = i < count - 1

            return (
              <li
                key={`${item.icon}-${item.text}-${i}`}
                className="relative flex flex-col items-center justify-start px-4 text-center sm:px-6"
              >
                {/* Hairline divider between columns (sm+) */}
                {showDivider ? (
                  <span
                    className="absolute right-0 top-2 hidden h-[calc(100%-0.5rem)] w-px bg-border/80 sm:block"
                    aria-hidden
                  />
                ) : null}

                <div className="flex w-full max-w-[11.5rem] flex-col items-center gap-3.5">
                  <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-muted text-primary shadow-[inset_0_0_0_1px_var(--color-border)]">
                    <span
                      className="absolute inset-0 rounded-full opacity-[0.12]"
                      style={{ background: "var(--color-primary)" }}
                      aria-hidden
                    />
                    {custom ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.icon_url}
                        alt=""
                        className="relative h-6 w-6 object-contain"
                      />
                    ) : (
                      <Icon
                        className="relative h-[1.35rem] w-[1.35rem]"
                        strokeWidth={1.6}
                        aria-hidden
                      />
                    )}
                  </div>

                  <p
                    className="text-[0.8125rem] font-semibold leading-snug tracking-tight text-foreground sm:text-sm"
                    style={{
                      fontFamily:
                        "var(--font-text), var(--font-sans), system-ui",
                    }}
                  >
                    {item.text}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
