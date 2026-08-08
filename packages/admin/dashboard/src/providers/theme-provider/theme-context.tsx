import { createContext } from "react"

export type ThemeOption = "light" | "dark" | "system"
export type ThemeValue = "light" | "dark"

type ThemeContextValue = {
  /** Selected preference: light | dark | system */
  theme: ThemeOption
  /** Resolved active theme after applying system preference */
  resolvedTheme: ThemeValue
  setTheme: (theme: ThemeOption) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
