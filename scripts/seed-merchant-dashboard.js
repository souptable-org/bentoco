/**
 * Seed merchant commerce data so the admin dashboard has real rows to show.
 *
 * Prerequisites:
 *   - Medusa running on :9000
 *   - admin@bentoco.com / supersecret (Stage 1)
 *
 * Usage:
 *   node scripts/seed-merchant-dashboard.js
 */
const BASE = process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
const EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@bentoco.com"
const PASSWORD = process.env.SEED_ADMIN_PASSWORD || "supersecret"

async function request(method, path, { token, body, publishableKey } = {}) {
  const headers = { "Content-Type": "application/json" }
  if (token) headers.Authorization = `Bearer ${token}`
  if (publishableKey) headers["x-publishable-api-key"] = publishableKey

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch {
    data = { raw: text }
  }

  if (!res.ok) {
    const msg =
      data?.message ||
      data?.error ||
      data?.type ||
      text?.slice(0, 400) ||
      res.statusText
    const err = new Error(`${method} ${path} -> ${res.status}: ${msg}`)
    err.status = res.status
    err.data = data
    throw err
  }
  return data
}

function log(step, detail) {
  console.log(`✓ ${step}${detail ? `: ${detail}` : ""}`)
}

async function main() {
  console.log(`Seeding merchant data against ${BASE} as ${EMAIL}`)

  // 1) Auth
  const auth = await request("POST", "/auth/user/emailpass", {
    body: { email: EMAIL, password: PASSWORD },
  })
  const token = auth.token
  if (!token) throw new Error("No auth token returned")
  log("Authenticated admin")

  // 2) Store + sales channel
  const stores = await request("GET", "/admin/stores", { token })
  const store = stores.stores?.[0]
  if (!store) throw new Error("No store found — run Stage 1 first")
  log("Store", `${store.name} (${store.id})`)

  const scId =
    store.default_sales_channel_id ||
    (
      await request("GET", "/admin/sales-channels?limit=1", { token })
    ).sales_channels?.[0]?.id

  // 3) Region (India / INR) — create if missing
  let regions = (await request("GET", "/admin/regions?limit=50", { token }))
    .regions
  let region = regions.find(
    (r) => r.currency_code === "inr" || r.name?.toLowerCase().includes("india")
  )
  if (!region) {
    region = (
      await request("POST", "/admin/regions", {
        token,
        body: {
          name: "India",
          currency_code: "inr",
          countries: ["in"],
          automatic_taxes: true,
        },
      })
    ).region
    log("Created region", `${region.name} / ${region.currency_code}`)
  } else {
    log("Region exists", `${region.name} / ${region.currency_code}`)
  }

  // 3b) India tax region — default GST 18% (Medusa system tax provider)
  const taxRegions = (
    await request("GET", "/admin/tax-regions?limit=50", { token })
  ).tax_regions
  const indiaTax = taxRegions?.find((t) => t.country_code === "in" && !t.province_code)
  if (!indiaTax) {
    try {
      const created = await request("POST", "/admin/tax-regions", {
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
      log("Tax region India", `GST 18% (${created.tax_region?.id})`)
    } catch (e) {
      // merchant vs agency auth may fail; log and continue
      console.warn("! Tax region seed skipped:", e.message)
    }
  } else {
    log("Tax region exists", indiaTax.id)
  }

  // Also ensure a USD region for multi-currency demos if missing
  regions = (await request("GET", "/admin/regions?limit=50", { token })).regions
  let usdRegion = regions.find((r) => r.currency_code === "usd")
  if (!usdRegion) {
    try {
      usdRegion = (
        await request("POST", "/admin/regions", {
          token,
          body: {
            name: "United States",
            currency_code: "usd",
            countries: ["us"],
          },
        })
      ).region
      log("Created region", "United States / usd")
    } catch (e) {
      console.warn("USD region skipped:", e.message)
    }
  }

  // 4) Update store defaults (INR default for Bentoco)
  try {
    await request("POST", `/admin/stores/${store.id}`, {
      token,
      body: {
        name: "Bentoco Demo Store",
        default_region_id: region.id,
        default_sales_channel_id: scId,
        supported_currencies: [
          { currency_code: "inr", is_default: true },
          { currency_code: "usd", is_default: false },
        ],
      },
    })
    log("Updated store defaults", "INR + India region")
  } catch (e) {
    console.warn("Store update warning:", e.message)
  }

  // 5) Shipping profile
  let shippingProfiles = (
    await request("GET", "/admin/shipping-profiles?limit=20", { token })
  ).shipping_profiles
  let shippingProfile = shippingProfiles?.[0]
  if (!shippingProfile) {
    shippingProfile = (
      await request("POST", "/admin/shipping-profiles", {
        token,
        body: { name: "Default Shipping", type: "default" },
      })
    ).shipping_profile
    log("Created shipping profile")
  } else {
    log("Shipping profile", shippingProfile.name)
  }

  // 6) Stock location (for inventory UI)
  let stockLocation
  try {
    const locs = (
      await request("GET", "/admin/stock-locations?limit=5", { token })
    ).stock_locations
    stockLocation = locs?.[0]
    if (!stockLocation) {
      stockLocation = (
        await request("POST", "/admin/stock-locations", {
          token,
          body: {
            name: "Mumbai Warehouse",
            address: {
              address_1: "12 Andheri East",
              city: "Mumbai",
              country_code: "in",
              province: "MH",
              postal_code: "400069",
            },
          },
        })
      ).stock_location
      log("Created stock location", stockLocation.name)
    } else {
      log("Stock location", stockLocation.name)
    }

    // Link sales channel ↔ location if endpoint exists
    if (stockLocation?.id && scId) {
      try {
        await request(
          "POST",
          `/admin/stock-locations/${stockLocation.id}/sales-channels`,
          {
            token,
            body: { add: [scId] },
          }
        )
        log("Linked stock location to sales channel")
      } catch (e) {
        // alternate payload shape
        try {
          await request(
            "POST",
            `/admin/stock-locations/${stockLocation.id}/sales-channels`,
            {
              token,
              body: { sales_channel_ids: [scId] },
            }
          )
        } catch {
          console.warn("Stock location sales-channel link skipped")
        }
      }
    }
  } catch (e) {
    console.warn("Stock location skipped:", e.message)
  }

  // 7) Collections & tags
  async function ensureCollection(title) {
    const list = (
      await request("GET", `/admin/collections?q=${encodeURIComponent(title)}&limit=5`, {
        token,
      })
    ).collections
    const found = list?.find((c) => c.title === title)
    if (found) return found
    return (
      await request("POST", "/admin/collections", {
        token,
        body: { title },
      })
    ).collection
  }

  const collectionApparel = await ensureCollection("Apparel")
  const collectionHome = await ensureCollection("Home & Living")
  log("Collections", "Apparel, Home & Living")

  async function ensureTag(value) {
    const list = (
      await request("GET", `/admin/product-tags?q=${encodeURIComponent(value)}&limit=10`, {
        token,
      })
    ).product_tags
    const found = list?.find((t) => t.value === value)
    if (found) return found
    return (
      await request("POST", "/admin/product-tags", {
        token,
        body: { value },
      })
    ).product_tag
  }

  const tagNew = await ensureTag("new-arrival")
  const tagBestseller = await ensureTag("bestseller")
  const tagOrganic = await ensureTag("organic")

  // 8) Products (skip if handle already exists)
  async function productExists(handle) {
    const list = (
      await request(
        "GET",
        `/admin/products?handle=${encodeURIComponent(handle)}&limit=1`,
        { token }
      )
    ).products
    return list?.length > 0
  }

  const productDefs = [
    {
      title: "Khadi Cotton Kurta",
      handle: "khadi-cotton-kurta",
      description:
        "Handloom khadi kurta — breathable everyday wear for Indian summers.",
      status: "published",
      collection_id: collectionApparel.id,
      shipping_profile_id: shippingProfile.id,
      tags: [{ id: tagNew.id }, { id: tagOrganic.id }],
      options: [
        { title: "Size", values: ["S", "M", "L", "XL"] },
        { title: "Color", values: ["Indigo", "Ivory"] },
      ],
      variants: [
        {
          title: "M / Indigo",
          sku: "KURTA-M-IND",
          options: { Size: "M", Color: "Indigo" },
          prices: [
            // Medusa v2 amounts are major currency units (rupees), not paisa
            { currency_code: "inr", amount: 1499 },
            { currency_code: "usd", amount: 18 },
          ],
          manage_inventory: false,
        },
        {
          title: "L / Ivory",
          sku: "KURTA-L-IVY",
          options: { Size: "L", Color: "Ivory" },
          prices: [
            { currency_code: "inr", amount: 1499 },
            { currency_code: "usd", amount: 18 },
          ],
          manage_inventory: false,
        },
      ],
      sales_channels: scId ? [{ id: scId }] : undefined,
    },
    {
      title: "Banarasi Silk Stole",
      handle: "banarasi-silk-stole",
      description: "Lightweight Banarasi silk stole with zari border.",
      status: "published",
      collection_id: collectionApparel.id,
      shipping_profile_id: shippingProfile.id,
      tags: [{ id: tagBestseller.id }],
      options: [{ title: "Color", values: ["Ruby", "Emerald"] }],
      variants: [
        {
          title: "Ruby",
          sku: "STOLE-RUBY",
          options: { Color: "Ruby" },
          prices: [
            { currency_code: "inr", amount: 2499 },
            { currency_code: "usd", amount: 30 },
          ],
          manage_inventory: false,
        },
        {
          title: "Emerald",
          sku: "STOLE-EMR",
          options: { Color: "Emerald" },
          prices: [
            { currency_code: "inr", amount: 2499 },
            { currency_code: "usd", amount: 30 },
          ],
          manage_inventory: false,
        },
      ],
      sales_channels: scId ? [{ id: scId }] : undefined,
    },
    {
      title: "Brass Diya Set (Pack of 4)",
      handle: "brass-diya-set",
      description: "Hand-finished brass diyas for pooja and festive decor.",
      status: "published",
      collection_id: collectionHome.id,
      shipping_profile_id: shippingProfile.id,
      tags: [{ id: tagNew.id }],
      options: [{ title: "Pack", values: ["4-pack"] }],
      variants: [
        {
          title: "4-pack",
          sku: "DIYA-4PK",
          options: { Pack: "4-pack" },
          prices: [
            { currency_code: "inr", amount: 899 },
            { currency_code: "usd", amount: 11 },
          ],
          manage_inventory: false,
        },
      ],
      sales_channels: scId ? [{ id: scId }] : undefined,
    },
    {
      title: "Terracotta Planter",
      handle: "terracotta-planter",
      description: "Medium terracotta planter — unglazed, outdoor safe.",
      status: "published",
      collection_id: collectionHome.id,
      shipping_profile_id: shippingProfile.id,
      tags: [{ id: tagBestseller.id }],
      options: [{ title: "Size", values: ["Medium"] }],
      variants: [
        {
          title: "Medium",
          sku: "PLANTER-M",
          options: { Size: "Medium" },
          prices: [
            { currency_code: "inr", amount: 599 },
            { currency_code: "usd", amount: 8 },
          ],
          manage_inventory: false,
        },
      ],
      sales_channels: scId ? [{ id: scId }] : undefined,
    },
    {
      title: "Organic Coconut Oil (500ml)",
      handle: "organic-coconut-oil-500",
      description: "Cold-pressed virgin coconut oil — kitchen & skin.",
      status: "draft",
      collection_id: collectionHome.id,
      shipping_profile_id: shippingProfile.id,
      tags: [{ id: tagOrganic.id }],
      options: [{ title: "Volume", values: ["500ml"] }],
      variants: [
        {
          title: "500ml",
          sku: "CNOIL-500",
          options: { Volume: "500ml" },
          prices: [
            { currency_code: "inr", amount: 449 },
            { currency_code: "usd", amount: 5.49 },
          ],
          manage_inventory: false,
        },
      ],
      sales_channels: scId ? [{ id: scId }] : undefined,
    },
  ]

  let productsCreated = 0
  for (const def of productDefs) {
    if (await productExists(def.handle)) {
      log("Product exists", def.handle)
      continue
    }
    try {
      const created = (
        await request("POST", "/admin/products", { token, body: def })
      ).product
      productsCreated++
      log("Created product", `${created.title} (${created.id})`)
    } catch (e) {
      console.warn(`Product ${def.handle} failed:`, e.message)
    }
  }
  log("Products created this run", String(productsCreated))

  // 9) Customers
  const customerDefs = [
    {
      email: "priya.sharma@example.com",
      first_name: "Priya",
      last_name: "Sharma",
      phone: "+919876543210",
    },
    {
      email: "rahul.mehta@example.com",
      first_name: "Rahul",
      last_name: "Mehta",
      phone: "+919811122233",
    },
    {
      email: "ananya.iyer@example.com",
      first_name: "Ananya",
      last_name: "Iyer",
    },
    {
      email: "vikram.singh@example.com",
      first_name: "Vikram",
      last_name: "Singh",
      phone: "+919900112233",
    },
  ]

  let customersCreated = 0
  for (const c of customerDefs) {
    const existing = (
      await request(
        "GET",
        `/admin/customers?q=${encodeURIComponent(c.email)}&limit=5`,
        { token }
      )
    ).customers
    if (existing?.some((x) => x.email === c.email)) {
      log("Customer exists", c.email)
      continue
    }
    try {
      const created = (
        await request("POST", "/admin/customers", { token, body: c })
      ).customer
      customersCreated++
      log("Created customer", `${created.first_name} ${created.last_name}`)
    } catch (e) {
      console.warn(`Customer ${c.email} failed:`, e.message)
    }
  }
  log("Customers created this run", String(customersCreated))

  // 10) Customer group
  try {
    const groups = (
      await request("GET", "/admin/customer-groups?limit=20", { token })
    ).customer_groups
    let vip = groups?.find((g) => g.name === "VIP")
    if (!vip) {
      vip = (
        await request("POST", "/admin/customer-groups", {
          token,
          body: { name: "VIP" },
        })
      ).customer_group
      log("Created customer group", "VIP")
    }
  } catch (e) {
    console.warn("Customer group skipped:", e.message)
  }

  // 11) Product category (optional)
  try {
    const cats = (
      await request("GET", "/admin/product-categories?limit=20", { token })
    ).product_categories
    if (!cats?.some((c) => c.name === "Festive")) {
      await request("POST", "/admin/product-categories", {
        token,
        body: { name: "Festive", is_active: true, is_internal: false },
      })
      log("Created category", "Festive")
    }
  } catch (e) {
    console.warn("Category skipped:", e.message)
  }

  // 12) Summary snapshot
  const summary = {
    products: (
      await request("GET", "/admin/products?limit=1", { token })
    ).count,
    customers: (
      await request("GET", "/admin/customers?limit=1", { token })
    ).count,
    regions: (await request("GET", "/admin/regions?limit=1", { token })).count,
    collections: (
      await request("GET", "/admin/collections?limit=1", { token })
    ).count,
  }

  console.log("\n=== Merchant seed complete ===")
  console.log(JSON.stringify(summary, null, 2))
  console.log("\nOpen http://localhost:7001 and log in as:")
  console.log(`  ${EMAIL} / ${PASSWORD}`)
  console.log("Try: Products, Customers, Regions, Collections, Orders (empty until checkout).")
}

main().catch((e) => {
  console.error("\nSeed failed:", e.message)
  if (e.data) console.error(JSON.stringify(e.data, null, 2).slice(0, 800))
  process.exit(1)
})
