/**
 * Enable India GST 18% (system tax provider) for storefront carts/orders.
 * Usage: node scripts/setup-tax-india.js
 */
const BASE = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"

async function req(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      `${method} ${path} ${res.status}: ${data.message || JSON.stringify(data)}`
    )
  }
  return data
}

async function main() {
  const auth = await req("/auth/user/emailpass", {
    method: "POST",
    body: { email: "merchant@bentoco.com", password: "supersecret" },
  })
  const token = auth.token

  const list = await req("/admin/tax-regions?limit=50", { token })
  const existing = list.tax_regions?.find(
    (t) => t.country_code === "in" && !t.province_code
  )
  if (existing) {
    console.log("India tax region already exists:", existing.id)
    return
  }

  const created = await req("/admin/tax-regions", {
    method: "POST",
    token,
    body: {
      country_code: "in",
      provider_id: "tp_system",
      default_tax_rate: {
        code: "GST",
        name: "GST 18%",
        rate: 18,
      },
    },
  })
  console.log("Created India GST 18%:", created.tax_region?.id)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
