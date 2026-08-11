"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * next-themes: toggles `class="dark"` on <html> (attribute="class").
 * defaultTheme=light + enableSystem=false avoids SSR/client class mismatches
 * from OS preference before hydration. Users still toggle light/dark manually.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
      storageKey="bentoco-storefront-theme"
      {...props}
    >
      {children}
    </NextThemesProvider>
  )
}
