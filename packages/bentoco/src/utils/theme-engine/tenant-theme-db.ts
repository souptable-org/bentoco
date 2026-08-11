import { Client } from "pg"
import {
  buildThemeConfig,
  type BuiltTheme,
} from "./build-theme-config"
import { buildPresetTheme, WARM_MINIMALIST_ID } from "./presets"
import type {
  ThemeBranding,
  ThemeConfig,
  ThemeHomepage,
  ThemeOverrides,
  ThemeSnapshot,
} from "./types"

export type TenantThemePayload = {
  tenant_id: string
  theme_config: ThemeConfig
  css: string
  font_stylesheet_url: string | null
  font_stylesheet_urls?: string[]
  variables: Record<string, string>
}

function dbUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL is not configured")
  }
  return url
}

/**
 * Ensure theme_config column exists (idempotent). Prefer migration, but
 * self-heal in dev if migration not yet applied.
 */
export async function ensureThemeConfigColumn(client: Client): Promise<void> {
  await client.query(`
    ALTER TABLE "tenant"
    ADD COLUMN IF NOT EXISTS "theme_config" JSONB
  `)
}

export async function getTenantThemeConfig(
  tenantId: string
): Promise<ThemeConfig | null> {
  const client = new Client({ connectionString: dbUrl() })
  try {
    await client.connect()
    await ensureThemeConfigColumn(client)
    const result = await client.query<{ theme_config: ThemeConfig | null }>(
      `SELECT theme_config FROM tenant WHERE id = $1 LIMIT 1`,
      [tenantId]
    )
    return result.rows[0]?.theme_config ?? null
  } finally {
    await client.end()
  }
}

export async function saveTenantThemeConfig(
  tenantId: string,
  config: ThemeConfig
): Promise<void> {
  const client = new Client({ connectionString: dbUrl() })
  try {
    await client.connect()
    await ensureThemeConfigColumn(client)
    const result = await client.query(
      `UPDATE tenant SET theme_config = $2::jsonb, updated_at = NOW() WHERE id = $1`,
      [tenantId, JSON.stringify(config)]
    )
    if (result.rowCount === 0) {
      throw new Error(`Tenant not found: ${tenantId}`)
    }
  } finally {
    await client.end()
  }
}

/**
 * Resolve theme for a tenant: stored config, or default Warm Minimalist.
 * Always returns compiled CSS for storefront injection.
 */
export function materializeTheme(
  config: ThemeConfig | null | undefined
): BuiltTheme {
  if (config?.design_md && config?.tokens) {
    return buildThemeConfig({
      themeId: config.active_theme_id || WARM_MINIMALIST_ID,
      designMd: config.design_md,
      layoutId: config.layout_id || "default",
      overrides: config.overrides,
      branding: config.branding,
      homepage: config.homepage,
    })
  }
  return buildPresetTheme(WARM_MINIMALIST_ID)
}

export async function getOrDefaultTenantTheme(
  tenantId: string
): Promise<TenantThemePayload> {
  const stored = await getTenantThemeConfig(tenantId)
  const effectiveConfig = stored || buildPresetTheme(WARM_MINIMALIST_ID).config

  // For Admin preview CSS compilation, prioritize draft snapshot if present, else published/flat
  const activeSnapshot = effectiveConfig.draft || effectiveConfig.published || {
    overrides: effectiveConfig.overrides,
    branding: effectiveConfig.branding,
    homepage: effectiveConfig.homepage,
  }

  const built = buildThemeConfig({
    themeId:
      (activeSnapshot as any)?.active_theme_id ||
      effectiveConfig.active_theme_id ||
      WARM_MINIMALIST_ID,
    designMd: (activeSnapshot as any)?.design_md || effectiveConfig.design_md,
    layoutId: effectiveConfig.layout_id || "default",
    overrides: activeSnapshot.overrides,
    branding: activeSnapshot.branding,
    homepage: activeSnapshot.homepage,
  })

  return {
    tenant_id: tenantId,
    theme_config: effectiveConfig,
    css: built.css,
    font_stylesheet_url: built.font_stylesheet_url,
    font_stylesheet_urls: built.font_stylesheet_urls,
    variables: built.variables,
  }
}

export async function installPresetForTenant(
  tenantId: string,
  themeId: string = WARM_MINIMALIST_ID,
  opts?: {
    overrides?: ThemeOverrides
    branding?: ThemeBranding
    homepage?: ThemeHomepage
  }
): Promise<TenantThemePayload> {
  const built = buildPresetTheme(themeId, opts)
  await saveTenantThemeConfig(tenantId, built.config)
  return {
    tenant_id: tenantId,
    theme_config: built.config,
    css: built.css,
    font_stylesheet_url: built.font_stylesheet_url,
    font_stylesheet_urls: built.font_stylesheet_urls,
    variables: built.variables,
  }
}

export function bootstrapPublishedFromFlat(config: ThemeConfig): ThemeSnapshot & { published_at: string } {
  const now = new Date().toISOString()
  return {
    active_theme_id: config.active_theme_id,
    design_md: config.design_md,
    overrides: config.overrides,
    branding: config.branding,
    homepage: config.homepage,
    updated_at: config.published_at || now,
    published_at: config.published_at || now,
  }
}

export async function updateTenantThemeOverrides(
  tenantId: string,
  patch: {
    overrides?: ThemeOverrides
    branding?: ThemeBranding
    homepage?: ThemeHomepage
    design_md?: string
    theme_id?: string
  }
): Promise<TenantThemePayload> {
  const existing =
    (await getTenantThemeConfig(tenantId)) || buildPresetTheme(WARM_MINIMALIST_ID).config
  const now = new Date().toISOString()

  // Ensure published snapshot exists (bootstrap for legacy v1 rows)
  const publishedSnapshot = existing.published || bootstrapPublishedFromFlat(existing)

  // Retrieve current draft or initialize from active state
  const currentDraft = existing.draft || {
    active_theme_id: existing.active_theme_id,
    design_md: existing.design_md,
    overrides: existing.overrides,
    branding: existing.branding,
    homepage: existing.homepage,
    updated_at: now,
  }

  const nextDraft: ThemeSnapshot = {
    active_theme_id: patch.theme_id || currentDraft.active_theme_id || existing.active_theme_id,
    design_md: patch.design_md || currentDraft.design_md || existing.design_md,
    overrides: patch.overrides ?? currentDraft.overrides,
    branding: patch.branding ?? currentDraft.branding,
    homepage: patch.homepage ?? currentDraft.homepage,
    updated_at: now,
  }

  const nextConfig: ThemeConfig = {
    ...existing,
    schema_version: 2,
    active_theme_id: existing.active_theme_id,
    design_md: existing.design_md,
    // Published snapshot stays UNTOUCHED on draft save!
    published: publishedSnapshot,
    // Top-level mirrors published for backward-compatibility with non-v2 readers
    overrides: publishedSnapshot.overrides,
    branding: publishedSnapshot.branding,
    homepage: publishedSnapshot.homepage,
    published_at: publishedSnapshot.published_at,
    // Draft receives new edit
    draft: nextDraft,
    history: existing.history || [],
  }

  await saveTenantThemeConfig(tenantId, nextConfig)

  // Compile draft CSS for editor preview response
  const draftBuilt = buildThemeConfig({
    themeId: nextDraft.active_theme_id || WARM_MINIMALIST_ID,
    designMd: nextDraft.design_md || existing.design_md,
    layoutId: "default",
    overrides: nextDraft.overrides,
    branding: nextDraft.branding,
    homepage: nextDraft.homepage,
  })

  return {
    tenant_id: tenantId,
    theme_config: nextConfig,
    css: draftBuilt.css,
    font_stylesheet_url: draftBuilt.font_stylesheet_url,
    font_stylesheet_urls: draftBuilt.font_stylesheet_urls,
    variables: draftBuilt.variables,
  }
}

export async function publishTenantTheme(tenantId: string): Promise<TenantThemePayload> {
  const current = await getTenantThemeConfig(tenantId)
  if (!current) {
    throw new Error("No theme config found to publish")
  }

  const now = new Date().toISOString()
  const currentSnapshot = current.published || {
    active_theme_id: current.active_theme_id,
    overrides: current.overrides,
    branding: current.branding,
    homepage: current.homepage,
    design_md: current.design_md,
    updated_at: current.published_at || now,
    published_at: current.published_at || now,
  }

  const draftSnapshot = current.draft || {
    active_theme_id: current.active_theme_id,
    overrides: current.overrides,
    branding: current.branding,
    homepage: current.homepage,
    design_md: current.design_md,
    updated_at: now,
  }

  const history = current.history ? [...current.history] : []
  history.unshift({ at: now, snapshot: currentSnapshot })
  if (history.length > 10) history.pop()

  const updated: ThemeConfig = {
    ...current,
    schema_version: 2,
    overrides: draftSnapshot.overrides ?? current.overrides,
    branding: draftSnapshot.branding ?? current.branding,
    homepage: draftSnapshot.homepage ?? current.homepage,
    published_at: now,
    published: {
      ...draftSnapshot,
      published_at: now,
    },
    draft: undefined,
    history,
  }

  await saveTenantThemeConfig(tenantId, updated)
  return getOrDefaultTenantTheme(tenantId)
}

export async function discardTenantThemeDraft(tenantId: string): Promise<TenantThemePayload> {
  const current = await getTenantThemeConfig(tenantId)
  if (current) {
    const updated: ThemeConfig = {
      ...current,
      draft: undefined,
    }
    await saveTenantThemeConfig(tenantId, updated)
  }
  return getOrDefaultTenantTheme(tenantId)
}

export async function rollbackTenantTheme(tenantId: string): Promise<TenantThemePayload> {
  const current = await getTenantThemeConfig(tenantId)
  if (!current || !current.history || current.history.length === 0) {
    throw new Error("No history snapshot available for rollback")
  }

  const lastEntry = current.history[0]
  const remainingHistory = current.history.slice(1)
  const now = new Date().toISOString()

  const restoredSnapshot = {
    ...lastEntry.snapshot,
    published_at: now,
  }

  const updated: ThemeConfig = {
    ...current,
    schema_version: 2,
    overrides: restoredSnapshot.overrides,
    branding: restoredSnapshot.branding,
    homepage: restoredSnapshot.homepage,
    published_at: now,
    published: restoredSnapshot,
    draft: undefined,
    history: remainingHistory,
  }

  await saveTenantThemeConfig(tenantId, updated)
  return getOrDefaultTenantTheme(tenantId)
}

export function defaultTenantIdFromEnv(bodyTenant?: string): string {
  return (
    bodyTenant ||
    process.env.BENTOCO_DEFAULT_TENANT_ID ||
    process.env.RAZORPAY_DEFAULT_TENANT_ID ||
    "803a80b0-c7e2-4208-aed4-958ac19c08c6"
  )
}
