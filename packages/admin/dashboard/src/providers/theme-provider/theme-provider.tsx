import { PropsWithChildren, useCallback, useEffect, useState } from "react"
import { ThemeContext, ThemeOption, ThemeValue } from "./theme-context"

/** Same storage key as Medusa admin so theme is shared across agency + store admin. */
const THEME_KEY = "medusa_admin_theme"

function getDefaultValue(): ThemeOption {
  if (typeof window === "undefined") {
    return "system"
  }

  const persisted = localStorage.getItem(THEME_KEY) as ThemeOption | null

  if (persisted === "light" || persisted === "dark" || persisted === "system") {
    return persisted
  }

  return "system"
}

function getThemeValue(selected: ThemeOption): ThemeValue {
  if (selected === "system") {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    }

    return "light"
  }

  return selected
}

function applyThemeClass(value: ThemeValue) {
  const root = document.documentElement

  /**
   * Temporarily disable transitions to prevent
   * the theme change from flashing.
   */
  const css = document.createElement("style")
  css.appendChild(
    document.createTextNode(
      `* {
        -webkit-transition: none !important;
        -moz-transition: none !important;
        -o-transition: none !important;
        -ms-transition: none !important;
        transition: none !important;
      }`
    )
  )
  document.head.appendChild(css)

  // Always clear both, then set the active mode (Medusa uses .dark on <html>)
  root.classList.remove("light", "dark")
  root.classList.add(value)
  root.style.colorScheme = value

  /**
   * Re-enable transitions after the theme has been set,
   * and force the browser to repaint.
   */
  window.getComputedStyle(css).opacity
  document.head.removeChild(css)
}

export const ThemeProvider = ({ children }: PropsWithChildren) => {
  const [theme, setThemeState] = useState<ThemeOption>(getDefaultValue)
  const [resolvedTheme, setResolvedTheme] = useState<ThemeValue>(() =>
    getThemeValue(getDefaultValue())
  )

  const setTheme = useCallback((next: ThemeOption) => {
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      // ignore storage errors (private mode, etc.)
    }
    const resolved = getThemeValue(next)
    setThemeState(next)
    setResolvedTheme(resolved)
    // Apply immediately so UI updates without waiting for effect flush
    applyThemeClass(resolved)
  }, [])

  // Apply class on mount / when resolved theme changes from system listener
  useEffect(() => {
    applyThemeClass(resolvedTheme)
  }, [resolvedTheme])

  // Follow OS preference when preference is "system" (Medusa behavior)
  useEffect(() => {
    if (theme !== "system") {
      return
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)")

    const onChange = () => {
      const next = media.matches ? "dark" : "light"
      setResolvedTheme(next)
      applyThemeClass(next)
    }

    onChange()
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
