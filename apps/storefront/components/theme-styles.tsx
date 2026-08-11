import { fetchStorefrontTheme } from "@/lib/theme"
import { headers } from "next/headers"

/**
 * Server component: loads tenant theme CSS and injects into the document.
 * Always no-store in development so Config Editor Save is visible immediately.
 */
export async function ThemeStyles() {
  const headerList = await headers()
  const host = headerList.get("host") || headerList.get("x-forwarded-host")
  const tenantId = headerList.get("x-tenant-id")
  const isPreview = headerList.get("x-theme-preview") === "1"

  const theme = await fetchStorefrontTheme({
    tenantId,
    host,
    preview: true, // always fresh theme for storefront (editor + live)
  })

  const extraSheets = theme.font_stylesheet_urls?.filter(Boolean) || []
  const hasGoogle = Boolean(theme.font_stylesheet_url)
  const published = theme.theme_config?.published_at || ""

  return (
    <>
      {hasGoogle || extraSheets.length > 0 ? (
        <>
          {hasGoogle ? (
            <>
              <link rel="preconnect" href="https://fonts.googleapis.com" />
              <link
                rel="preconnect"
                href="https://fonts.gstatic.com"
                crossOrigin="anonymous"
              />
              <link rel="stylesheet" href={theme.font_stylesheet_url!} />
            </>
          ) : null}
          {extraSheets.map((href) => (
            <link key={href} rel="stylesheet" href={href} />
          ))}
        </>
      ) : null}
      {theme.css ? (
        <style
          id="bentoco-tenant-theme"
          data-theme-id={theme.theme_config?.active_theme_id || "default"}
          data-theme-source={theme.source || "unknown"}
          data-tenant-id={theme.tenant_id || tenantId || ""}
          data-published-at={published}
          data-preview={isPreview ? "1" : "0"}
          dangerouslySetInnerHTML={{
            // Compiler already emits html,:root light + html.dark dark blocks
            __html: theme.css,
          }}
        />
      ) : null}
    </>
  )
}
