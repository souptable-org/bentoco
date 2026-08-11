import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@bentoco/framework/http"
import { MedusaError } from "@bentoco/framework/utils"
import {
  defaultTenantIdFromEnv,
  getOrDefaultTenantTheme,
  installPresetForTenant,
  listBuiltinPresets,
  updateTenantThemeOverrides,
  WARM_MINIMALIST_ID,
} from "../../../utils/theme-engine"
import type {
  ThemeBranding,
  ThemeHomepage,
  ThemeOverrides,
} from "../../../utils/theme-engine"

type Body = {
  tenant_id?: string
  /** Install a builtin preset as the active theme */
  install_preset?: string
  overrides?: ThemeOverrides
  branding?: ThemeBranding
  homepage?: ThemeHomepage
  /** Full DESIGN.md source (import path) */
  design_md?: string
  theme_id?: string
}

export function resolveAdminThemeTenantId(
  req: AuthenticatedMedusaRequest,
  explicitTenantId?: string
): string {
  const resolved =
    explicitTenantId ||
    (req.query?.tenant_id as string) ||
    req.tenant_id ||
    req.tenant?.id

  if (resolved) {
    return resolved
  }

  const isProd =
    process.env.NODE_ENV === "production" || process.env.NODE_ENV === "staging"
  if (isProd) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Tenant ID is required for theme operations in production."
    )
  }

  console.warn(
    "[theme-engine] Using dev fallback tenant ID. Provide explicit tenant_id or session context in production."
  )
  return defaultTenantIdFromEnv()
}

/**
 * GET /admin/store-theme
 * Returns active theme + compiled CSS for a tenant (defaults to demo tenant).
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const tenantId = resolveAdminThemeTenantId(req)

  try {
    const payload = await getOrDefaultTenantTheme(tenantId)
    res.status(200).json({
      ...payload,
      presets: listBuiltinPresets(),
    })
  } catch (err: any) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      err?.message || "Failed to load store theme"
    )
  }
}

/**
 * POST /admin/store-theme
 * Install a preset and/or update editor overrides for a tenant.
 *
 * Body examples:
 *  { "install_preset": "warm-minimalist" }
 *  { "overrides": { "radius_step": 3, "colors": { "accent": "#0ea5e9" } } }
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<Body>,
  res: MedusaResponse
) => {
  const body = (req.validatedBody || req.body || {}) as Body
  const tenantId = resolveAdminThemeTenantId(req, body.tenant_id)

  try {
    let payload

    if (body.install_preset) {
      payload = await installPresetForTenant(tenantId, body.install_preset, {
        overrides: body.overrides,
        branding: body.branding,
        homepage: body.homepage,
      })
    } else if (body.design_md) {
      payload = await updateTenantThemeOverrides(tenantId, {
        design_md: body.design_md,
        theme_id: body.theme_id || "imported",
        overrides: body.overrides,
        branding: body.branding,
        homepage: body.homepage,
      })
    } else if (body.overrides || body.branding || body.homepage) {
      payload = await updateTenantThemeOverrides(tenantId, {
        overrides: body.overrides,
        branding: body.branding,
        homepage: body.homepage,
      })
    } else {
      // No-op install default if empty body
      payload = await installPresetForTenant(tenantId, WARM_MINIMALIST_ID)
    }

    res.status(200).json(payload)
  } catch (err: any) {
    if (err?.message?.includes("not found") || err?.message?.includes("Unknown")) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, err.message)
    }
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      err?.message || "Failed to update store theme"
    )
  }
}
