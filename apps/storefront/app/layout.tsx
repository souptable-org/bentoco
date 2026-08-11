import type { Metadata } from "next"
import "./globals.css"
import { AppProvider } from "@/lib/store"
import { ThemeStyles } from "@/components/theme-styles"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: "Bentoco Storefront",
  description: "Tenant storefront for Bentoco merchants.",
}

/** Theme + tenant homepage must never be statically cached */
export const dynamic = "force-dynamic"
export const revalidate = 0

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // suppressHydrationWarning: next-themes may set class="dark" on <html> before hydrate
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <ThemeProvider>
          <ThemeStyles />
          <AppProvider>{children}</AppProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
