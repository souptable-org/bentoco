/**
 * Unit tests for shipped homepage theme helpers.
 * Run: npx tsx lib/homepage-theme.test.ts  (from apps/storefront)
 */
import assert from "node:assert/strict"
import {
  activeBanners,
  orderProductsByIds,
  promisesBarVisible,
  sectionUsesLimit,
  shouldSuppressMockCatalog,
  sliceSectionProductIds,
  sortCategorySections,
} from "./homepage-theme"
import {
  isCustomPromiseIcon,
  resolvePromiseIcon,
  PROMISE_ICON_MAP,
} from "./promise-icons"

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`ok - ${name}`)
  } catch (e) {
    console.error(`not ok - ${name}`)
    throw e
  }
}

test("sectionUsesLimit: category and offer only", () => {
  assert.equal(sectionUsesLimit({ source: "category" }), true)
  assert.equal(sectionUsesLimit({ source: "offer" }), true)
  assert.equal(sectionUsesLimit({ source: "manual" }), false)
  assert.equal(sectionUsesLimit({ category_id: "pcat_1" }), true)
  assert.equal(sectionUsesLimit({}), false)
})

test("sliceSectionProductIds: category respects limit", () => {
  const ids = ["a", "b", "c", "d", "e"]
  assert.deepEqual(
    sliceSectionProductIds(ids, { source: "category", limit: 3 }),
    ["a", "b", "c"]
  )
})

test("sliceSectionProductIds: manual returns full list", () => {
  const ids = ["a", "b", "c", "d", "e"]
  assert.deepEqual(sliceSectionProductIds(ids, { source: "manual", limit: 2 }), [
    "a",
    "b",
    "c",
    "d",
    "e",
  ])
})

test("sliceSectionProductIds: default limit 8 for category", () => {
  const ids = Array.from({ length: 12 }, (_, i) => `p${i}`)
  const sliced = sliceSectionProductIds(ids, { source: "category" })
  assert.equal(sliced.length, 8)
  assert.equal(sliced[0], "p0")
  assert.equal(sliced[7], "p7")
})

test("orderProductsByIds preserves curated order", () => {
  const products = [
    { id: "c", name: "C" },
    { id: "a", name: "A" },
    { id: "b", name: "B" },
  ]
  const ordered = orderProductsByIds(products, ["a", "b", "c"])
  assert.deepEqual(
    ordered.map((p) => p.id),
    ["a", "b", "c"]
  )
})

test("orderProductsByIds drops missing ids", () => {
  const products = [{ id: "a", name: "A" }]
  const ordered = orderProductsByIds(products, ["a", "missing"])
  assert.deepEqual(
    ordered.map((p) => p.id),
    ["a"]
  )
})

test("sortCategorySections by sort field", () => {
  const sorted = sortCategorySections([
    { title: "B", sort: 2 },
    { title: "A", sort: 0 },
    { title: "C", sort: 1 },
  ])
  assert.deepEqual(
    sorted.map((s) => s.title),
    ["A", "C", "B"]
  )
})

test("promisesBarVisible", () => {
  assert.equal(promisesBarVisible(undefined), false)
  assert.equal(promisesBarVisible({ enabled: false, items: [{ text: "x" }] }), false)
  assert.equal(promisesBarVisible({ enabled: true, items: [] }), false)
  assert.equal(
    promisesBarVisible({ enabled: true, items: [{ text: "Free delivery" }] }),
    true
  )
  assert.equal(
    promisesBarVisible({ items: [{ text: "  " }] }),
    false
  )
})

test("activeBanners filters empty urls", () => {
  assert.deepEqual(
    activeBanners([
      { url: "https://a.png", alt: "A" },
      { url: "  " },
      { url: "https://b.png" },
    ]),
    [
      { url: "https://a.png", alt: "A" },
      { url: "https://b.png", alt: undefined },
    ]
  )
})

test("shouldSuppressMockCatalog when sections have products", () => {
  assert.equal(shouldSuppressMockCatalog([]), false)
  assert.equal(shouldSuppressMockCatalog([{ products: [] }]), false)
  assert.equal(
    shouldSuppressMockCatalog([{ products: [{ id: "1" }] }]),
    true
  )
})

test("resolvePromiseIcon maps library keys", () => {
  assert.ok(PROMISE_ICON_MAP.truck)
  assert.equal(resolvePromiseIcon("truck"), PROMISE_ICON_MAP.truck)
  assert.equal(resolvePromiseIcon("unknown"), resolvePromiseIcon("check"))
})

test("isCustomPromiseIcon", () => {
  assert.equal(
    isCustomPromiseIcon({ icon_mode: "custom", icon_url: "https://x.svg" }),
    true
  )
  assert.equal(isCustomPromiseIcon({ icon_mode: "preset", icon: "truck" }), false)
})

console.log("\nAll homepage-theme unit tests passed.")
