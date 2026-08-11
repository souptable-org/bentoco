import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { Client } from "pg"
import {
  buildPresetTheme,
  defaultTenantIdFromEnv,
  materializeTheme,
  WARM_MINIMALIST_ID,
  type ThemeConfig,
} from "../../../../utils/theme-engine"

type TenantRow = {
  tenant_id: string
  store_name: string
  subdomain: string | null
  custom_domain: string | null
  theme_config: ThemeConfig | null
}

function parseDomain(rawHost?: string | null): {
  domain: string
  subdomain: string | null
} {
  if (!rawHost) return { domain: "localhost", subdomain: null }
  const hostWithoutPort = rawHost.split(":")[0].toLowerCase().trim()

  if (hostWithoutPort === "localhost" || hostWithoutPort === "127.0.0.1") {
    return { domain: hostWithoutPort, subdomain: null }
  }

  const parts = hostWithoutPort.split(".")
  if (parts.length > 2 || (parts.length === 2 && parts[1] === "localhost")) {
    return { domain: hostWithoutPort, subdomain: parts[0] }
  }

  return { domain: hostWithoutPort, subdomain: null }
}

/**
 * GET /store/tenant/theme
 * Public (publishable key) theme payload for the storefront to inject CSS.
 *
 * Query: ?domain=host or uses Host header. Optional ?tenant_id=
 */
export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const tenantIdQuery = req.query.tenant_id as string | undefined
  const queryDomain =
    (req.query.domain as string) ||
    req.headers["x-forwarded-host"] ||
    req.headers["host"]
  const { domain, subdomain } = parseDomain(queryDomain as string)

  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    // Dev fallback: still serve default preset CSS without DB
    const built = buildPresetTheme(WARM_MINIMALIST_ID)
    return res.status(200).json({
      tenant_id: tenantIdQuery || null,
      store_name: "Storefront",
      theme_config: built.config,
      css: built.css,
      font_stylesheet_url: built.font_stylesheet_url,
      font_stylesheet_urls: built.font_stylesheet_urls,
      source: "preset-fallback",
    })
  }

  const client = new Client({ connectionString })
  try {
    await client.connect()
    await client.query(`
      ALTER TABLE "tenant" ADD COLUMN IF NOT EXISTS "theme_config" JSONB
    `)

    let result

    if (tenantIdQuery) {
      result = await client.query<TenantRow>(
        `SELECT id as tenant_id, store_name, subdomain, custom_domain, theme_config
         FROM tenant WHERE id = $1 LIMIT 1`,
        [tenantIdQuery]
      )
    } else {
      result = await client.query<TenantRow>(
        `SELECT id as tenant_id, store_name, subdomain, custom_domain, theme_config
         FROM tenant
         WHERE custom_domain = $1 OR subdomain = $2
         LIMIT 1`,
        [domain, subdomain || domain]
      )
      if (!result.rows.length) {
        // Prefer the same default tenant the admin Config Editor saves to
        // (RAZORPAY_DEFAULT_TENANT_ID / BENTOCO_DEFAULT_TENANT_ID), not
        // "oldest tenant" which caused theme changes to never appear.
        const fallbackId = defaultTenantIdFromEnv()
        result = await client.query<TenantRow>(
          `SELECT id as tenant_id, store_name, subdomain, custom_domain, theme_config
           FROM tenant WHERE id = $1 LIMIT 1`,
          [fallbackId]
        )
        if (!result.rows.length) {
          result = await client.query<TenantRow>(
            `SELECT id as tenant_id, store_name, subdomain, custom_domain, theme_config
             FROM tenant
             ORDER BY created_at ASC
             LIMIT 1`
          )
        }
      }
    }

    if (!result.rows.length) {
      const built = buildPresetTheme(WARM_MINIMALIST_ID)
      return res.status(200).json({
        tenant_id: null,
        store_name: "Storefront",
        theme_config: built.config,
        css: built.css,
        font_stylesheet_url: built.font_stylesheet_url,
        font_stylesheet_urls: built.font_stylesheet_urls,
        source: "preset-fallback",
      })
    }

    const row = result.rows[0]
    const isPreview = req.query.preview === "1"
    let effectiveConfig = row.theme_config

    if (row.theme_config) {
      if (isPreview && row.theme_config.draft) {
        effectiveConfig = {
          ...row.theme_config,
          overrides: row.theme_config.draft.overrides ?? row.theme_config.overrides,
          branding: row.theme_config.draft.branding ?? row.theme_config.branding,
          homepage: row.theme_config.draft.homepage ?? row.theme_config.homepage,
        }
      } else if (!isPreview && row.theme_config.published) {
        effectiveConfig = {
          ...row.theme_config,
          overrides: row.theme_config.published.overrides ?? row.theme_config.overrides,
          branding: row.theme_config.published.branding ?? row.theme_config.branding,
          homepage: row.theme_config.published.homepage ?? row.theme_config.homepage,
        }
      }
    }

    const built = materializeTheme(effectiveConfig)

    return res.status(200).json({
      tenant_id: row.tenant_id,
      store_name: row.store_name,
      subdomain: row.subdomain,
      custom_domain: row.custom_domain,
      theme_config: built.config,
      css: built.css,
      font_stylesheet_url: built.font_stylesheet_url,
      font_stylesheet_urls: built.font_stylesheet_urls,
      source: row.theme_config ? (isPreview ? "tenant-draft" : "tenant-published") : "preset-default",
    })
  } catch (err: any) {
    console.error("[store/tenant/theme]", err)
    const built = buildPresetTheme(WARM_MINIMALIST_ID)
    return res.status(200).json({
      tenant_id: tenantIdQuery || null,
      store_name: "Storefront",
      theme_config: built.config,
      css: built.css,
      font_stylesheet_url: built.font_stylesheet_url,
      font_stylesheet_urls: built.font_stylesheet_urls,
      source: "preset-error-fallback",
      warning: err?.message,
    })
  } finally {
    await client.end()
  }
}
