/**
 * One-shot: enable COD (pp_system_default) + free India shipping for storefront checkout.
 * Usage: node scripts/setup-cod-india.js
 * Requires API on :9000 and merchant@bentoco.com / supersecret
 */
const BASE = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
const REGION_ID =
  process.env.MEDUSA_INDIA_REGION_ID || "reg_01KZ5T3298V6210QBXTVWG3TXW"
const SLOC_ID =
  process.env.MEDUSA_STOCK_LOCATION_ID || "sloc_01KZ5T32NPP9FGPPN7YHQH5D1D"
const SHIPPING_PROFILE_ID =
  process.env.MEDUSA_SHIPPING_PROFILE_ID || "sp_01KZ5PKRPE4S023W52F7DPWY10"

async function req(path, { method = "GET", token, body } = {}) {
  const headers = { "Content-Type": "application/json" }
  if (token) headers.Authorization = `Bearer ${token}`
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let data
  try {
    data = JSON.parse(text)
  } catch {
    data = text
  }
  if (!res.ok) {
    throw new Error(
      `${method} ${path} ${res.status}: ${
        typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data)
      }`
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

  await req(`/admin/regions/${REGION_ID}`, {
    method: "POST",
    token,
    body: { payment_providers: ["pp_system_default"] },
  })
  console.log("OK region payment provider pp_system_default")

  try {
    await req(`/admin/stock-locations/${SLOC_ID}/fulfillment-providers`, {
      method: "POST",
      token,
      body: { add: ["manual_manual"] },
    })
  } catch (e) {
    console.log("fulfillment provider link:", e.message)
  }

  let loc = await req(
    `/admin/stock-locations/${SLOC_ID}?fields=*fulfillment_sets`,
    { token }
  )
  let fsId = loc.stock_location.fulfillment_sets?.[0]?.id
  if (!fsId) {
    await req(`/admin/stock-locations/${SLOC_ID}/fulfillment-sets`, {
      method: "POST",
      token,
      body: { name: "India Shipping", type: "shipping" },
    })
    loc = await req(
      `/admin/stock-locations/${SLOC_ID}?fields=*fulfillment_sets`,
      { token }
    )
    fsId = loc.stock_location.fulfillment_sets?.[0]?.id
  }
  console.log("fulfillment_set", fsId)

  // Create service zone if none (POST returns set with zones)
  let szId
  try {
    const created = await req(
      `/admin/fulfillment-sets/${fsId}/service-zones`,
      {
        method: "POST",
        token,
        body: {
          name: "India",
          geo_zones: [{ type: "country", country_code: "in" }],
        },
      }
    )
    szId = created.fulfillment_set.service_zones?.slice(-1)[0]?.id
  } catch (e) {
    // may already exist — list via stock location is awkward; try shipping options
    console.log("service zone create note:", e.message)
  }

  const existing = await req(`/admin/shipping-options?limit=20`, { token })
  let optionId = existing.shipping_options?.[0]?.id
  if (!optionId) {
    if (!szId) throw new Error("Need service zone id to create shipping option")
    const so = await req(`/admin/shipping-options`, {
      method: "POST",
      token,
      body: {
        name: "Standard Delivery",
        service_zone_id: szId,
        shipping_profile_id: SHIPPING_PROFILE_ID,
        provider_id: "manual_manual",
        price_type: "flat",
        type: {
          label: "Standard",
          description: "3-5 business days",
          code: "standard",
        },
        prices: [{ currency_code: "inr", amount: 0 }],
      },
    })
    optionId = so.shipping_option.id
  }
  console.log("shipping_option", optionId)
  console.log("COD + free India shipping ready")
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
