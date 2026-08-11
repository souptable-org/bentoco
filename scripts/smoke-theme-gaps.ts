import fetch from "node-fetch"

const MEDUSA_BACKEND = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
const PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ||
  "pk_60d15336d7c41922c4ac354c4a90da700f0d785c6bb83269983167f444672f49"

async function runSmokeTest() {
  console.log("🚀 Starting Theme Engine Gap-Fill Smoke Test...")

  // 1. Fetch public store theme (published customer view)
  const storeRes = await fetch(
    `${MEDUSA_BACKEND}/store/tenant/theme?domain=alpha.localhost`,
    {
      headers: { "x-publishable-api-key": PUBLISHABLE_KEY },
    }
  )

  if (!storeRes.ok) {
    throw new Error(`GET /store/tenant/theme failed with status ${storeRes.status}`)
  }

  const storeData = (await storeRes.json()) as any
  console.log("✅ Public Customer Theme Resolved:", {
    tenant_id: storeData.tenant_id,
    active_theme: storeData.theme_config?.active_theme_id,
    source: storeData.source,
    has_css: !!storeData.css,
  })

  // 2. Fetch preview theme (draft admin view)
  const previewRes = await fetch(
    `${MEDUSA_BACKEND}/store/tenant/theme?domain=alpha.localhost&preview=1`,
    {
      headers: { "x-publishable-api-key": PUBLISHABLE_KEY },
    }
  )

  if (!previewRes.ok) {
    throw new Error(`GET /store/tenant/theme?preview=1 failed with status ${previewRes.status}`)
  }

  const previewData = (await previewRes.json()) as any
  console.log("✅ Admin Preview Theme Resolved:", {
    tenant_id: previewData.tenant_id,
    source: previewData.source,
    has_css: !!previewData.css,
  })

  console.log("🎉 Smoke test completed cleanly!")
}

runSmokeTest().catch((err) => {
  console.error("❌ Smoke test failed:", err)
  process.exit(1)
})
