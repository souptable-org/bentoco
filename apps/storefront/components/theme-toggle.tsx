"use client"

import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

const btnClass =
  "flex h-9 w-9 items-center justify-center rounded-[var(--radius)] border border-border bg-card text-foreground transition-colors hover:bg-muted"

/**
 * Light / dark toggle. Renders a neutral shell until mounted so SSR HTML
 * matches the first client paint (avoids next-themes hydration warnings).
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Identical markup on server + first client render
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Toggle color theme"
        className={className || btnClass}
        suppressHydrationWarning
      >
        <span className="h-4 w-4" aria-hidden suppressHydrationWarning />
      </button>
    )
  }

  const isDark = resolvedTheme === "dark"

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={className || btnClass}
    >
      {isDark ? (
        <Sun className="h-4 w-4" aria-hidden />
      ) : (
        <Moon className="h-4 w-4" aria-hidden />
      )}
    </button>
  )
}
