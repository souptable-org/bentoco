/**
 * Phase 1 smoke test for BENT-4 theme engine.
 * Run: npx tsx scripts/smoke-theme-phase1.ts
 *
 * Optional env:
 *   MEDUSA_BACKEND_URL (default http://localhost:9000)
 *   SMOKE_ADMIN_TOKEN  — Bearer token for admin routes
 *   SMOKE_PUBLISHABLE_KEY — x-publishable-api-key for store routes
 *   DATABASE_URL — if set, also tests tenant.theme_config write/read via API
 */

import {
  parseDesignMd,
  mergeThemeTokens,
  compileThemeToCss,
  buildPresetTheme,
  WARM_MINIMALIST_ID,
  loadPresetDesignMd,
} from "../packages/bentoco/src/utils/theme-engine"

const BACKEND = (
  process.env.MEDUSA_BACKEND_URL ||
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ||
  "http://localhost:9000"
).replace(/\/$/, "")

const ADMIN_TOKEN = process.env.SMOKE_ADMIN_TOKEN || process.env.MEDUSA_ADMIN_TOKEN || ""
const PK =
  process.env.SMOKE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
  process.env.MEDUSA_PUBLISHABLE_KEY ||
  ""

let failed = 0
let passed = 0

function ok(name: string, detail?: string) {
  passed++
  console.log(`  PASS  ${name}${detail ? ` — ${detail}` : ""}`)
}

function fail(name: string, detail?: string) {
  failed++
  console.error(`  FAIL  ${name}${detail ? ` — ${detail}` : ""}`)
}

function section(title: string) {
  console.log(`\n== ${title} ==`)
}

async function main() {
  console.log("BENT-4 Phase 1 smoke test")
  console.log(`Backend: ${BACKEND}`)

  // --- A. Local engine ---
  section("A. Theme engine (local)")

  try {
    const md = loadPresetDesignMd(WARM_MINIMALIST_ID)
    if (!md.startsWith("---")) throw new Error("preset missing front matter")
    ok("loadPresetDesignMd", `${md.length} chars`)
  } catch (e: any) {
    fail("loadPresetDesignMd", e.message)
  }

  try {
    const md = loadPresetDesignMd()
    const { tokens } = parseDesignMd(md)
    if (tokens.name !== "Warm Minimalist") {
      throw new Error(`unexpected name: ${tokens.name}`)
    }
    if (!tokens.colors?.accent) throw new Error("missing colors.accent")
    if (!tokens.typography?.display?.fontFamily) {
      throw new Error("missing typography.display")
    }
    ok("parseDesignMd", `colors=${Object.keys(tokens.colors || {}).length}`)
  } catch (e: any) {
    fail("parseDesignMd", e.message)
  }

  try {
    const { tokens } = parseDesignMd(loadPresetDesignMd())
    const merged = mergeThemeTokens(tokens, {
      radius_step: 4,
      colors: { accent: "#0ea5e9" },
    })
    if (merged.colors?.accent !== "#0ea5e9") {
      throw new Error(`merge failed: ${merged.colors?.accent}`)
    }
    ok("mergeThemeTokens", "accent override")
  } catch (e: any) {
    fail("mergeThemeTokens", e.message)
  }

  try {
    const { tokens } = parseDesignMd(loadPresetDesignMd())
    const { css, variables } = compileThemeToCss({
      tokens,
      overrides: { radius_step: 4, colors: { accent: "#0ea5e9" } },
    })
    if (!css.includes(":root")) throw new Error("no :root block")
    if (variables["--color-accent"] !== "#0ea5e9") {
      throw new Error(`--color-accent=${variables["--color-accent"]}`)
    }
    if (variables["--radius"] !== "16px") {
      throw new Error(`--radius=${variables["--radius"]}`)
    }
    if (!variables["--color-background"]) throw new Error("missing background")
    ok(
      "compileThemeToCss",
      `vars=${Object.keys(variables).length}, css=${css.length}b`
    )
  } catch (e: any) {
    fail("compileThemeToCss", e.message)
  }

  try {
    const built = buildPresetTheme(WARM_MINIMALIST_ID)
    if (built.config.schema_version !== 1) throw new Error("schema_version")
    if (built.config.active_theme_id !== WARM_MINIMALIST_ID) {
      throw new Error("active_theme_id")
    }
    if (!built.config.design_md) throw new Error("missing design_md")
    if (!built.font_stylesheet_url?.includes("fonts.googleapis.com")) {
      throw new Error(`font url: ${built.font_stylesheet_url}`)
    }
    ok("buildPresetTheme", built.config.tokens.name)
  } catch (e: any) {
    fail("buildPresetTheme", e.message)
  }

  // --- B. DB persistence (no Medusa required) ---
  section("B. DB theme_config (DATABASE_URL)")

  if (!process.env.DATABASE_URL) {
    console.log("  SKIP  DATABASE_URL not set")
  } else {
    try {
      const { Client } = await import("pg")
      const {
        buildPresetTheme,
        materializeTheme,
        ensureThemeConfigColumn,
      } = await import("../packages/bentoco/src/utils/theme-engine")

      const client = new Client({ connectionString: process.env.DATABASE_URL })
      await client.connect()
      await ensureThemeConfigColumn(client)

      const tenantRes = await client.query<{ id: string; store_name: string }>(
        `SELECT id, store_name FROM tenant ORDER BY created_at ASC LIMIT 1`
      )
      if (!tenantRes.rows.length) {
        fail("db tenant row", "no tenant rows — seed multi-tenant first")
      } else {
        const tenantId = tenantRes.rows[0].id
        ok("db tenant found", tenantRes.rows[0].store_name || tenantId.slice(0, 8))

        const built = buildPresetTheme(WARM_MINIMALIST_ID, {
          overrides: { radius_step: 2, colors: { accent: "#112233" } },
        })

        await client.query(
          `UPDATE tenant SET theme_config = $2::jsonb, updated_at = NOW() WHERE id = $1`,
          [tenantId, JSON.stringify(built.config)]
        )
        ok("db write theme_config")

        const read = await client.query<{ theme_config: any }>(
          `SELECT theme_config FROM tenant WHERE id = $1`,
          [tenantId]
        )
        const stored = read.rows[0]?.theme_config
        if (!stored?.design_md || stored.active_theme_id !== WARM_MINIMALIST_ID) {
          fail("db read theme_config", JSON.stringify(stored).slice(0, 120))
        } else {
          ok("db read theme_config", stored.tokens?.name)
        }

        const materialized = materializeTheme(stored)
        if (materialized.variables["--color-accent"] !== "#112233") {
          fail(
            "materializeTheme from DB",
            `--color-accent=${materialized.variables["--color-accent"]}`
          )
        } else {
          ok("materializeTheme from DB", "override accent preserved")
        }

        // restore clean preset without override for cleanliness
        const clean = buildPresetTheme(WARM_MINIMALIST_ID)
        await client.query(
          `UPDATE tenant SET theme_config = $2::jsonb, updated_at = NOW() WHERE id = $1`,
          [tenantId, JSON.stringify(clean.config)]
        )
        ok("db restore clean warm-minimalist")
      }

      await client.end()
    } catch (e: any) {
      fail("db theme_config", e.message)
    }
  }

  // --- C. HTTP reachability ---
  section("C. Backend reachability")

  let backendUp = false
  try {
    const t = await fetch(`${BACKEND}/store/tenant/theme?domain=localhost`, {
      headers: PK ? { "x-publishable-api-key": PK } : {},
    })
    backendUp = t.status > 0 && t.status < 500
    if (backendUp) {
      ok("backend reachable", `store/theme HTTP ${t.status}`)
    } else {
      fail("backend reachable", `HTTP ${t.status}`)
    }
  } catch (e: any) {
    fail("backend reachable", e.message || "fetch failed")
    backendUp = false
  }

  if (!backendUp) {
    console.log(
      "\n  (Skipping HTTP API tests — start Medusa on :9000 and re-run)"
    )
    console.log(
      "  Tip: npx tsx scripts/smoke-theme-phase1.ts"
    )
    summary()
    process.exit(failed ? 1 : 0)
  }

  // --- D. Store theme API ---
  section("D. GET /store/tenant/theme")

  try {
    const headers: Record<string, string> = {}
    if (PK) headers["x-publishable-api-key"] = PK

    const res = await fetch(
      `${BACKEND}/store/tenant/theme?domain=localhost:3001`,
      { headers }
    )
    const body = await res.json().catch(() => ({}))

    if (!res.ok && res.status !== 200) {
      // 200 expected even on fallback
      fail("store theme status", `HTTP ${res.status} ${JSON.stringify(body).slice(0, 200)}`)
    } else if (!body.css || !String(body.css).includes(":root")) {
      fail("store theme css", `missing css, source=${body.source}`)
    } else if (!body.theme_config?.tokens?.name && !body.theme_config?.active_theme_id) {
      fail("store theme config", "no theme_config")
    } else {
      ok(
        "store theme payload",
        `source=${body.source}, theme=${body.theme_config?.tokens?.name || body.theme_config?.active_theme_id}, css=${String(body.css).length}b`
      )
    }
  } catch (e: any) {
    fail("store theme", e.message)
  }

  // --- E. Admin theme API ---
  section("E. Admin /admin/store-theme")

  if (!ADMIN_TOKEN) {
    console.log(
      "  SKIP  admin routes (set SMOKE_ADMIN_TOKEN or MEDUSA_ADMIN_TOKEN)"
    )
  } else {
    const authHeaders: Record<string, string> = {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      "Content-Type": "application/json",
    }

    try {
      const res = await fetch(`${BACKEND}/admin/store-theme`, {
        headers: authHeaders,
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        fail("admin GET", `HTTP ${res.status} ${JSON.stringify(body).slice(0, 180)}`)
      } else if (!body.css?.includes(":root")) {
        fail("admin GET css", "missing :root")
      } else {
        ok(
          "admin GET",
          `tenant=${body.tenant_id}, presets=${body.presets?.length ?? 0}`
        )
      }
    } catch (e: any) {
      fail("admin GET", e.message)
    }

    try {
      const res = await fetch(`${BACKEND}/admin/store-theme`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          install_preset: "warm-minimalist",
          overrides: {
            radius_step: 3,
            colors: { accent: "#ff00aa" },
          },
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        fail(
          "admin POST install+override",
          `HTTP ${res.status} ${JSON.stringify(body).slice(0, 200)}`
        )
      } else if (body.variables?.["--color-accent"] !== "#ff00aa") {
        fail(
          "admin POST override apply",
          `--color-accent=${body.variables?.["--color-accent"]}`
        )
      } else if (body.variables?.["--radius"] !== "12px") {
        fail("admin POST radius", `--radius=${body.variables?.["--radius"]}`)
      } else {
        ok("admin POST install+override", "accent=#ff00aa radius=12px")
      }

      // Restore clean preset
      await fetch(`${BACKEND}/admin/store-theme`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ install_preset: "warm-minimalist" }),
      })
      ok("admin POST restore warm-minimalist")
    } catch (e: any) {
      fail("admin POST", e.message)
    }
  }

  // --- F. Store reflects after install (if admin ran) ---
  if (ADMIN_TOKEN) {
    section("F. Store theme after admin install")
    try {
      const headers: Record<string, string> = {}
      if (PK) headers["x-publishable-api-key"] = PK
      const res = await fetch(
        `${BACKEND}/store/tenant/theme?domain=localhost:3001`,
        { headers }
      )
      const body = await res.json()
      if (body.theme_config?.active_theme_id === WARM_MINIMALIST_ID && body.css) {
        ok("store reflects install", `source=${body.source}`)
      } else {
        fail(
          "store reflects install",
          `id=${body.theme_config?.active_theme_id} source=${body.source}`
        )
      }
    } catch (e: any) {
      fail("store reflects install", e.message)
    }
  }

  summary()
  process.exit(failed ? 1 : 0)
}

function summary() {
  console.log(`\n== Summary ==`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  if (failed === 0) {
    console.log("Phase 1 smoke: OK")
  } else {
    console.log("Phase 1 smoke: FAILED")
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
