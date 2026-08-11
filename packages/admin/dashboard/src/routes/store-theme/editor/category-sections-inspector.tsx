import { useMemo, useState } from "react"
import {
  Button,
  Input,
  Label,
  Select,
  Switch,
  Text,
  clx,
} from "@bentoco/ui"
import { useQuery } from "@tanstack/react-query"
import {
  useProductCategories,
  useProducts,
  usePromotions,
} from "../../../hooks/api"
import { sdk } from "../../../lib/client"
import { XMarkMini } from "@bentoco/icons"

/** How products are chosen for a homepage section — mutually exclusive. */
export type CategorySectionSource = "category" | "manual" | "offer"

export type DraftCategorySection = {
  /** Stable client key (not persisted) */
  key: string
  title: string
  /** category | manual | offer */
  source: CategorySectionSource
  /** Medusa category id when source === "category" */
  category_id: string
  /** Medusa promotion id when source === "offer" */
  promotion_id: string
  /** Curated product ids (order preserved) */
  product_ids: string[]
  /**
   * Max products in this section (category / offer sources only).
   * Manual (one-by-one) lists use the full curated product_ids list.
   */
  limit: number
  sort: number
}

const DEFAULT_LIMIT = 8
const MAX_LIMIT = 48

const PRODUCT_ATTRS = new Set([
  "items.product.id",
  "product_id",
  "product.id",
  "items.product",
])

const CATEGORY_ATTRS = new Set([
  "items.product.categories.id",
  "items.product.category.id",
  "product_category_id",
  "category_id",
])

function ruleValues(
  values: Array<{ value?: string } | string> | undefined
): string[] {
  if (!values?.length) return []
  return values
    .map((v) => (typeof v === "string" ? v : v?.value || ""))
    .filter(Boolean)
}

/** Pull product / category targets from a promotion's application method rules. */
export function extractTargetsFromPromotion(promotion: {
  application_method?: {
    target_rules?: Array<{
      attribute?: string
      values?: Array<{ value?: string } | string>
    }>
    buy_rules?: Array<{
      attribute?: string
      values?: Array<{ value?: string } | string>
    }>
  }
  rules?: Array<{
    attribute?: string
    values?: Array<{ value?: string } | string>
  }>
}): { productIds: string[]; categoryIds: string[] } {
  const productIds = new Set<string>()
  const categoryIds = new Set<string>()

  const allRules = [
    ...(promotion.application_method?.target_rules || []),
    ...(promotion.application_method?.buy_rules || []),
    ...(promotion.rules || []),
  ]

  for (const rule of allRules) {
    const attr = (rule.attribute || "").toLowerCase()
    const vals = ruleValues(rule.values as any)
    if (
      PRODUCT_ATTRS.has(rule.attribute || "") ||
      attr.includes("product.id") ||
      attr === "product_id"
    ) {
      vals.forEach((id) => productIds.add(id))
    } else if (
      CATEGORY_ATTRS.has(rule.attribute || "") ||
      attr.includes("categor")
    ) {
      vals.forEach((id) => categoryIds.add(id))
    }
  }

  return {
    productIds: Array.from(productIds),
    categoryIds: Array.from(categoryIds),
  }
}

export function newCategorySection(sort = 0): DraftCategorySection {
  return {
    key: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    source: "category",
    category_id: "",
    promotion_id: "",
    product_ids: [],
    limit: DEFAULT_LIMIT,
    sort,
  }
}

export function normalizeCategorySections(
  raw?: Array<{
    title?: string
    source?: string
    category_id?: string
    promotion_id?: string
    product_ids?: string[]
    limit?: number
    sort?: number
  }>
): DraftCategorySection[] {
  if (!raw?.length) return []
  return raw.map((s, i) => {
    let source: CategorySectionSource = "manual"
    if (s.source === "category" || s.source === "manual" || s.source === "offer") {
      source = s.source
    } else if (s.promotion_id) {
      source = "offer"
    } else if (s.category_id) {
      source = "category"
    }

    return {
      key: `sec_${i}_${s.category_id || s.promotion_id || s.title || "x"}`,
      title: s.title || "",
      source,
      category_id: source === "category" ? s.category_id || "" : "",
      promotion_id: source === "offer" ? s.promotion_id || "" : "",
      product_ids: Array.isArray(s.product_ids) ? [...s.product_ids] : [],
      limit:
        typeof s.limit === "number" && s.limit > 0
          ? Math.min(MAX_LIMIT, Math.floor(s.limit))
          : DEFAULT_LIMIT,
      sort: typeof s.sort === "number" ? s.sort : i,
    }
  })
}

export function serializeCategorySections(
  sections: DraftCategorySection[]
): Array<{
  title: string
  source: CategorySectionSource
  category_id?: string
  promotion_id?: string
  product_ids: string[]
  limit: number
  sort: number
}> {
  return sections
    .filter(
      (s) =>
        s.title.trim() ||
        s.product_ids.length > 0 ||
        (s.source === "category" && s.category_id.trim()) ||
        (s.source === "offer" && s.promotion_id.trim())
    )
    .map((s, i) => {
      const usesLimit = s.source === "category" || s.source === "offer"
      return {
        title: s.title.trim() || "Untitled section",
        source: s.source,
        category_id:
          s.source === "category" && s.category_id.trim()
            ? s.category_id.trim()
            : undefined,
        promotion_id:
          s.source === "offer" && s.promotion_id.trim()
            ? s.promotion_id.trim()
            : undefined,
        product_ids: s.product_ids,
        // Cap only applies when browsing category or offer
        limit: usesLimit
          ? Math.max(1, Math.min(MAX_LIMIT, s.limit || DEFAULT_LIMIT))
          : s.product_ids.length || DEFAULT_LIMIT,
        sort: i,
      }
    })
}

type ProductRow = {
  id: string
  title: string
  thumbnail?: string | null
}

function productThumb(url?: string | null) {
  if (!url) {
    return (
      <div className="bg-ui-bg-subtle text-ui-fg-muted flex h-8 w-8 shrink-0 items-center justify-center rounded border text-[9px]">
        —
      </div>
    )
  }
  return (
    <img
      src={url}
      alt=""
      className="border-ui-border-base h-8 w-8 shrink-0 rounded border object-cover"
    />
  )
}

function SourcePill({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clx(
        "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
        active
          ? "border-ui-fg-base bg-ui-bg-base text-ui-fg-base"
          : "border-ui-border-base text-ui-fg-muted hover:text-ui-fg-base"
      )}
    >
      {label}
    </button>
  )
}

function ProductToggleList({
  products,
  loading,
  emptyText,
  selectedIdSet,
  onToggle,
}: {
  products: Array<{ id: string; title?: string | null; thumbnail?: string | null }>
  loading?: boolean
  emptyText: string
  selectedIdSet: Set<string>
  onToggle: (id: string, on: boolean) => void
}) {
  if (loading) {
    return (
      <Text size="xsmall" className="text-ui-fg-muted px-1 py-2">
        Loading products…
      </Text>
    )
  }
  if (!products.length) {
    return (
      <Text size="xsmall" className="text-ui-fg-muted px-1 py-2">
        {emptyText}
      </Text>
    )
  }
  return (
    <>
      {products.map((p) => {
        const on = selectedIdSet.has(p.id)
        return (
          <div
            key={p.id}
            className="hover:bg-ui-bg-base-hover flex items-center gap-2 rounded-md px-1.5 py-1.5"
          >
            {productThumb(p.thumbnail)}
            <Text size="small" className="min-w-0 flex-1 truncate">
              {p.title || p.id}
            </Text>
            <Switch
              checked={on}
              onCheckedChange={(checked) => onToggle(p.id, checked)}
              aria-label={
                on ? `Remove ${p.title}` : `Add ${p.title} to section`
              }
            />
          </div>
        )
      })}
    </>
  )
}

function CategorySectionCard({
  section,
  onChange,
  onRemove,
}: {
  section: DraftCategorySection
  onChange: (next: DraftCategorySection) => void
  onRemove: () => void
}) {
  const [search, setSearch] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)

  const { product_categories, isPending: catsLoading } = useProductCategories({
    limit: 100,
    fields: "id,name,handle",
  })
  const categoryOptions = product_categories || []

  const { promotions, isPending: promosLoading } = usePromotions({
    limit: 100,
    fields: "id,code,status,is_automatic,type",
  })
  const promoOptions = promotions || []

  const { products: categoryProducts, isPending: catProductsLoading } =
    useProducts(
      {
        category_id: section.category_id || undefined,
        limit: 50,
        fields: "id,title,thumbnail",
      },
      { enabled: section.source === "category" && !!section.category_id }
    )

  const { data: promoDetail, isPending: promoDetailLoading } = useQuery({
    queryKey: [
      "theme-editor-promotion",
      section.promotion_id,
      "with-targets",
    ],
    queryFn: async () => {
      const res = await sdk.admin.promotion.retrieve(section.promotion_id, {
        fields:
          "id,code,status,type,*application_method,*application_method.target_rules,*application_method.target_rules.values,*application_method.buy_rules,*application_method.buy_rules.values,*rules,*rules.values",
      })
      return res.promotion
    },
    enabled: section.source === "offer" && !!section.promotion_id,
  })

  const offerTargets = useMemo(() => {
    if (!promoDetail) {
      return { productIds: [] as string[], categoryIds: [] as string[] }
    }
    return extractTargetsFromPromotion(promoDetail)
  }, [promoDetail])

  const offerProductIdList = offerTargets.productIds
  const offerCategoryId = offerTargets.categoryIds[0]

  const { products: offerProductsById, isPending: offerByIdLoading } =
    useProducts(
      {
        id: offerProductIdList,
        limit: Math.min(50, Math.max(1, offerProductIdList.length)),
        fields: "id,title,thumbnail",
      },
      {
        enabled:
          section.source === "offer" &&
          !!section.promotion_id &&
          offerProductIdList.length > 0,
      }
    )

  const { products: offerProductsByCat, isPending: offerByCatLoading } =
    useProducts(
      {
        category_id: offerCategoryId,
        limit: 50,
        fields: "id,title,thumbnail",
      },
      {
        enabled:
          section.source === "offer" &&
          !!section.promotion_id &&
          offerProductIdList.length === 0 &&
          !!offerCategoryId,
      }
    )

  const offerProducts = useMemo(() => {
    if (offerProductIdList.length) {
      const byId = new Map(
        (offerProductsById || []).map((p) => [p.id, p] as const)
      )
      // Preserve rule order
      return offerProductIdList
        .map((id) => byId.get(id))
        .filter(Boolean) as Array<{
        id: string
        title?: string | null
        thumbnail?: string | null
      }>
    }
    return offerProductsByCat || []
  }, [offerProductIdList, offerProductsById, offerProductsByCat])

  const offerProductsLoading =
    promoDetailLoading ||
    (offerProductIdList.length > 0 ? offerByIdLoading : offerByCatLoading)

  const searchQuery = search.trim()
  const { products: searchProducts, isPending: searchLoading } = useProducts(
    {
      q: searchQuery || undefined,
      limit: 12,
      fields: "id,title,thumbnail",
    },
    {
      enabled:
        section.source === "manual" &&
        searchQuery.length >= 2 &&
        searchOpen,
    }
  )

  const selectedIdSet = useMemo(
    () => new Set(section.product_ids),
    [section.product_ids]
  )

  const { products: selectedLookup } = useProducts(
    {
      id: section.product_ids,
      limit: Math.min(48, Math.max(1, section.product_ids.length)),
      fields: "id,title,thumbnail",
    },
    { enabled: section.product_ids.length > 0 }
  )

  const selectedMeta = useMemo(() => {
    const map = new Map<string, ProductRow>()
    for (const list of [
      selectedLookup,
      categoryProducts,
      offerProducts,
      searchProducts,
    ]) {
      for (const p of list || []) {
        if (!map.has(p.id)) {
          map.set(p.id, {
            id: p.id,
            title: p.title || p.id,
            thumbnail: p.thumbnail,
          })
        }
      }
    }
    return map
  }, [selectedLookup, categoryProducts, offerProducts, searchProducts])

  const setSource = (source: CategorySectionSource) => {
    if (source === section.source) return
    onChange({
      ...section,
      source,
      category_id: "",
      promotion_id: "",
      product_ids: [],
    })
    setSearch("")
    setSearchOpen(false)
  }

  const toggleProduct = (id: string, on: boolean) => {
    if (on) {
      if (selectedIdSet.has(id)) return
      onChange({
        ...section,
        product_ids: [...section.product_ids, id],
      })
    } else {
      onChange({
        ...section,
        product_ids: section.product_ids.filter((x) => x !== id),
      })
    }
  }

  const addProduct = (id: string) => {
    if (selectedIdSet.has(id)) return
    onChange({
      ...section,
      product_ids: [...section.product_ids, id],
    })
    setSearch("")
    setSearchOpen(false)
  }

  const usesLimit = section.source === "category" || section.source === "offer"
  const limit = section.limit || DEFAULT_LIMIT
  const overCap = usesLimit && section.product_ids.length > limit
  const visibleCount = usesLimit
    ? Math.min(section.product_ids.length, limit)
    : section.product_ids.length

  const offerHasNoTargets =
    section.source === "offer" &&
    !!section.promotion_id &&
    !promoDetailLoading &&
    offerProductIdList.length === 0 &&
    !offerCategoryId

  return (
    <div className="border-ui-border-base space-y-4 rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <Text size="small" weight="plus">
          Section
        </Text>
        <Button
          size="small"
          variant="transparent"
          type="button"
          onClick={onRemove}
        >
          Remove
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label>Name</Label>
        <Input
          placeholder="e.g. Summer picks"
          value={section.title}
          onChange={(e) => onChange({ ...section, title: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label>Add products</Label>
        <div className="flex flex-wrap gap-1">
          <SourcePill
            active={section.source === "category"}
            label="Browse by category"
            onClick={() => setSource("category")}
          />
          <SourcePill
            active={section.source === "offer"}
            label="By offer"
            onClick={() => setSource("offer")}
          />
          <SourcePill
            active={section.source === "manual"}
            label="One by one"
            onClick={() => setSource("manual")}
          />
        </div>
        <Text size="xsmall" className="text-ui-fg-muted">
          One method per section. You can add multiple sections on the homepage.
          Switching method clears this section’s product list.
        </Text>
      </div>

      {/* Cap only for category / offer browse modes */}
      {usesLimit && (
        <div className="space-y-1.5">
          <Label>Max products in this section</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={MAX_LIMIT}
              value={String(limit)}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10)
                onChange({
                  ...section,
                  limit: Number.isFinite(n)
                    ? Math.max(1, Math.min(MAX_LIMIT, n))
                    : DEFAULT_LIMIT,
                })
              }}
              className="w-24"
            />
            <Text size="xsmall" className="text-ui-fg-muted">
              First {limit} toggled-on products appear in this block
            </Text>
          </div>
        </div>
      )}

      {section.source === "category" && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={section.category_id || "none"}
              onValueChange={(v) =>
                onChange({
                  ...section,
                  category_id: v === "none" ? "" : v,
                  product_ids:
                    v === section.category_id ? section.product_ids : [],
                })
              }
            >
              <Select.Trigger>
                <Select.Value
                  placeholder={
                    catsLoading ? "Loading categories…" : "Select a category"
                  }
                />
              </Select.Trigger>
              <Select.Content className="z-[200]">
                <Select.Item value="none">Select a category…</Select.Item>
                {categoryOptions.map((c) => (
                  <Select.Item key={c.id} value={c.id}>
                    {c.name}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
            <Text size="xsmall" className="text-ui-fg-muted">
              Toggle products from this category onto the section list.
            </Text>
          </div>

          {section.category_id ? (
            <div className="border-ui-border-base max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
              <ProductToggleList
                products={categoryProducts || []}
                loading={catProductsLoading}
                emptyText="No products in this category yet."
                selectedIdSet={selectedIdSet}
                onToggle={toggleProduct}
              />
            </div>
          ) : (
            <Text size="xsmall" className="text-ui-fg-muted">
              Select a category to list its products.
            </Text>
          )}
        </div>
      )}

      {section.source === "offer" && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Offer (promotion)</Label>
            <Select
              value={section.promotion_id || "none"}
              onValueChange={(v) =>
                onChange({
                  ...section,
                  promotion_id: v === "none" ? "" : v,
                  product_ids:
                    v === section.promotion_id ? section.product_ids : [],
                })
              }
            >
              <Select.Trigger>
                <Select.Value
                  placeholder={
                    promosLoading ? "Loading offers…" : "Select an offer"
                  }
                />
              </Select.Trigger>
              <Select.Content className="z-[200]">
                <Select.Item value="none">Select an offer…</Select.Item>
                {promoOptions.map((p) => (
                  <Select.Item key={p.id} value={p.id}>
                    {p.code || p.id}
                    {p.status ? ` · ${p.status}` : ""}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
            <Text size="xsmall" className="text-ui-fg-muted">
              Uses Medusa promotions. Toggle products targeted by the offer.
            </Text>
          </div>

          {section.promotion_id ? (
            <div className="border-ui-border-base max-h-56 space-y-1 overflow-y-auto rounded-md border p-2">
              {offerHasNoTargets ? (
                <Text size="xsmall" className="text-ui-fg-muted px-1 py-2">
                  This offer has no product-level targets (it may be cart-wide).
                  Switch to “One by one” to pick products, or edit the promotion
                  to target specific products.
                </Text>
              ) : (
                <ProductToggleList
                  products={offerProducts}
                  loading={offerProductsLoading}
                  emptyText="No products found for this offer’s targets."
                  selectedIdSet={selectedIdSet}
                  onToggle={toggleProduct}
                />
              )}
            </div>
          ) : (
            <Text size="xsmall" className="text-ui-fg-muted">
              Select a promotion/offer to list its targeted products.
            </Text>
          )}
        </div>
      )}

      {section.source === "manual" && (
        <div className="space-y-1.5">
          <Label>Search products</Label>
          <div className="relative">
            <Input
              placeholder="Search products…"
              value={search}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setSearch(e.target.value)
                setSearchOpen(true)
              }}
              onBlur={() => {
                window.setTimeout(() => setSearchOpen(false), 150)
              }}
            />
            {searchOpen && searchQuery.length >= 2 && (
              <div className="border-ui-border-base bg-ui-bg-base absolute z-20 mt-1 max-h-48 w-full overflow-y-auto rounded-md border shadow-elevation-flyout">
                {searchLoading && (
                  <div className="text-ui-fg-muted px-3 py-2 text-sm">
                    Searching…
                  </div>
                )}
                {!searchLoading && !(searchProducts?.length) && (
                  <div className="text-ui-fg-muted px-3 py-2 text-sm">
                    No products match “{searchQuery}”
                  </div>
                )}
                {(searchProducts || []).map((p) => {
                  const already = selectedIdSet.has(p.id)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={already}
                      className={clx(
                        "hover:bg-ui-bg-base-hover flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
                        already && "opacity-50"
                      )}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addProduct(p.id)}
                    >
                      {productThumb(p.thumbnail)}
                      <span className="min-w-0 flex-1 truncate">
                        {p.title || p.id}
                      </span>
                      {already ? (
                        <span className="text-ui-fg-muted text-[10px] uppercase">
                          Added
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <Text size="xsmall" className="text-ui-fg-muted">
            Type at least 2 characters, then click a product to add it.
          </Text>
        </div>
      )}

      <div className="space-y-1.5">
        <Label>
          In this section ({section.product_ids.length}
          {overCap ? ` · showing ${visibleCount} of ${limit} max` : ""})
        </Label>
        {section.product_ids.length === 0 ? (
          <Text size="xsmall" className="text-ui-fg-muted">
            {section.source === "category"
              ? "No products yet. Select a category and toggle products on."
              : section.source === "offer"
                ? "No products yet. Select an offer and toggle products on."
                : "No products yet. Search and add them one by one."}
          </Text>
        ) : (
          <ul className="border-ui-border-base max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
            {section.product_ids.map((id, idx) => {
              const meta = selectedMeta.get(id)
              const hiddenByCap = usesLimit && idx >= limit
              return (
                <li
                  key={id}
                  className={clx(
                    "flex items-center gap-2 rounded-md px-1.5 py-1",
                    hiddenByCap && "opacity-40"
                  )}
                >
                  {productThumb(meta?.thumbnail)}
                  <div className="min-w-0 flex-1">
                    <Text size="small" className="truncate">
                      {meta?.title || id}
                    </Text>
                    {hiddenByCap ? (
                      <Text size="xsmall" className="text-ui-fg-muted">
                        Over section max — not shown in this block
                      </Text>
                    ) : null}
                  </div>
                  <Button
                    size="small"
                    variant="transparent"
                    type="button"
                    onClick={() => toggleProduct(id, false)}
                    aria-label="Remove product"
                  >
                    <XMarkMini />
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export function CategoriesInspector({
  sections,
  onChange,
}: {
  sections: DraftCategorySection[]
  onChange: (s: DraftCategorySection[]) => void
}) {
  const update = (index: number, next: DraftCategorySection) => {
    onChange(sections.map((s, i) => (i === index ? next : s)))
  }

  return (
    <div className="space-y-4">
      <Text size="small" className="text-ui-fg-subtle">
        Add as many homepage sections as you need. Each section has a name and
        one product source (category, offer, or one by one). Max product count
        applies only when browsing by category or offer.
      </Text>

      {sections.map((s, i) => (
        <CategorySectionCard
          key={s.key}
          section={s}
          onChange={(next) => update(i, next)}
          onRemove={() => onChange(sections.filter((_, j) => j !== i))}
        />
      ))}

      <Button
        size="small"
        variant="secondary"
        type="button"
        onClick={() =>
          onChange([...sections, newCategorySection(sections.length)])
        }
      >
        Add category section
      </Button>
    </div>
  )
}
