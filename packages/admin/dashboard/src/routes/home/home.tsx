import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Badge, Container, Text, clx } from "@bentoco/ui"
import { sdk } from "../../lib/client"
import {
  getActiveTenantId,
  getActiveTenantLabel,
} from "../../lib/agency-store-url"
import { isAgencyMode, ensureModeFromHost } from "../../lib/agency-session"
import {
  hasValidStoreSession,
  getStoreSessionMeta,
  leaveStoreSession,
} from "../../lib/agency-store-session"
import {
  ShoppingBag,
  Plus,
  Package,
  Users,
  Tag,
  ArrowRight,
  IndianRupee,
  CreditCard,
  Banknote,
  RefreshCw,
} from "lucide-react"

type OrderRow = {
  id: string
  display_id?: number
  email?: string | null
  status?: string
  total?: number
  currency_code?: string
  created_at?: string
  metadata?: Record<string, unknown> | null
  items?: { id?: string; title?: string; quantity?: number; product_title?: string }[]
}

type ProductRow = {
  id: string
  title?: string
  status?: string
  handle?: string
}

type DashboardData = {
  orders: OrderRow[]
  orderCount: number
  products: ProductRow[]
  productCount: number
  customersCount: number | null
  loading: boolean
  error?: string
}

function formatInr(amount: number | undefined | null) {
  if (amount == null || Number.isNaN(Number(amount))) return "—"
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(amount))
}

function isToday(iso?: string) {
  if (!iso) return false
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function paymentLabel(o: OrderRow): { label: string; tone: "prepaid" | "cod" | "unknown" } {
  const meta = o.metadata || {}
  if (meta.prepaid === true || meta.payment_provider === "razorpay") {
    return { label: "Prepaid", tone: "prepaid" }
  }
  if (
    meta.payment_provider === "cod" ||
    meta.indian_status === "COD_VERIFIED" ||
    meta.fulfillment_payment === "COD"
  ) {
    return { label: "COD", tone: "cod" }
  }
  // Heuristic: system complete without razorpay metadata → likely COD for our storefront
  if (!meta.razorpay_payment_id && !meta.prepaid) {
    return { label: "COD / Manual", tone: "cod" }
  }
  return { label: "—", tone: "unknown" }
}

function indianStatus(o: OrderRow): string {
  const meta = o.metadata || {}
  if (typeof meta.indian_status === "string") return meta.indian_status
  if (meta.prepaid === true || meta.payment_provider === "razorpay") {
    return "PREPAID"
  }
  return (o.status || "pending").toUpperCase()
}

const Card = ({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) => (
  <div
    className={clx(
      "bg-ui-bg-base rounded-xl border border-ui-border-base p-5",
      className
    )}
  >
    {children}
  </div>
)

const Kpi = ({
  label,
  value,
  hint,
  to,
  icon: Icon,
}: {
  label: string
  value: React.ReactNode
  hint?: string
  to: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}) => (
  <Link
    to={to}
    className="bg-ui-bg-base hover:bg-ui-bg-subtle-hover block rounded-xl border border-ui-border-base p-5 transition-colors"
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-ui-fg-subtle text-xs font-medium uppercase tracking-wider">
          {label}
        </p>
        <p className="text-ui-fg-base mt-2 text-2xl font-semibold tracking-tight">
          {value}
        </p>
        {hint && (
          <p className="text-ui-fg-muted mt-1 text-xs">{hint}</p>
        )}
      </div>
      <div className="bg-ui-bg-subtle text-ui-fg-subtle rounded-lg p-2">
        <Icon size={18} />
      </div>
    </div>
  </Link>
)

export const Home = () => {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData>({
    orders: [],
    orderCount: 0,
    products: [],
    productCount: 0,
    customersCount: null,
    loading: true,
  })
  const [tenantLabel, setTenantLabel] = useState<string | null>(null)
  const [agencySession, setAgencySession] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [isGatewayConfigured, setIsGatewayConfigured] = useState<boolean | null>(null)

  useEffect(() => {
    ensureModeFromHost()
    if (typeof window === "undefined") return

    const host = window.location.hostname.toLowerCase()
    if (host.startsWith("agency.") && !hasValidStoreSession()) {
      window.location.replace("/agency/dashboard")
      return
    }

    if (isAgencyMode() && !hasValidStoreSession()) {
      navigate("/agency/dashboard", { replace: true })
      return
    }

    setAgencySession(hasValidStoreSession())
    const meta = getStoreSessionMeta()
    setTenantLabel(meta?.storeName || getActiveTenantLabel())

    let isSubscribed = true
    sdk.client
      .fetch<{ configured: boolean }>("/admin/byog/razorpay")
      .then((res) => {
        if (isSubscribed) setIsGatewayConfigured(Boolean(res?.configured))
      })
      .catch(() => {
        if (isSubscribed) setIsGatewayConfigured(false)
      })

    return () => {
      isSubscribed = false
    }
  }, [navigate])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setData((d) => ({ ...d, loading: true, error: undefined }))
      try {
        const [ordersRes, productsRes, customersRes] = await Promise.all([
          sdk.admin.order
            .list({
              limit: 50,
              order: "-created_at",
              fields:
                "id,display_id,email,status,total,currency_code,created_at,metadata,*items",
            } as any)
            .catch(() => ({ orders: [], count: 0 })),
          sdk.admin.product
            .list({
              limit: 10,
              order: "-created_at",
              fields: "id,title,status,handle",
            } as any)
            .catch(() => ({ products: [], count: 0 })),
          sdk.admin.customer
            .list({ limit: 1 })
            .catch(() => ({ count: null as number | null })),
        ])

        if (cancelled) return

        setData({
          orders: ((ordersRes as any).orders || []) as OrderRow[],
          orderCount:
            typeof (ordersRes as any).count === "number"
              ? (ordersRes as any).count
              : ((ordersRes as any).orders || []).length,
          products: ((productsRes as any).products || []) as ProductRow[],
          productCount:
            typeof (productsRes as any).count === "number"
              ? (productsRes as any).count
              : ((productsRes as any).products || []).length,
          customersCount:
            typeof (customersRes as any).count === "number"
              ? (customersRes as any).count
              : null,
          loading: false,
        })
      } catch (e: any) {
        if (!cancelled) {
          setData((d) => ({
            ...d,
            loading: false,
            error: e?.message || "Failed to load dashboard",
          }))
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  const stats = useMemo(() => {
    const orders = data.orders
    const todayOrders = orders.filter((o) => isToday(o.created_at))
    const salesTotal = orders.reduce((s, o) => s + (Number(o.total) || 0), 0)
    const salesToday = todayOrders.reduce(
      (s, o) => s + (Number(o.total) || 0),
      0
    )
    let prepaid = 0
    let cod = 0
    for (const o of orders) {
      const p = paymentLabel(o)
      if (p.tone === "prepaid") prepaid++
      else if (p.tone === "cod") cod++
    }
    const pending = orders.filter(
      (o) => (o.status || "").toLowerCase() === "pending"
    ).length

    // Units sold by product title from recent order line items
    const unitMap = new Map<string, number>()
    for (const o of orders) {
      for (const item of o.items || []) {
        const name =
          item.product_title || item.title || "Item"
        unitMap.set(name, (unitMap.get(name) || 0) + (item.quantity || 0))
      }
    }
    const topProducts = Array.from(unitMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)

    return {
      salesTotal,
      salesToday,
      ordersToday: todayOrders.length,
      prepaid,
      cod,
      pending,
      topProducts,
      recent: orders.slice(0, 8),
    }
  }, [data.orders])

  const tenantId = getActiveTenantId()

  return (
    <div className="text-ui-fg-subtle pb-12">
      <div className="mx-auto max-w-7xl space-y-6">
        {isGatewayConfigured === false && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-600 dark:text-amber-400 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg shrink-0 text-amber-600 dark:text-amber-400">
                <CreditCard size={20} />
              </div>
              <div>
                <p className="font-semibold text-sm">Payment Gateway Disconnected</p>
                <p className="text-xs opacity-90">
                  Your store does not have an active Razorpay payment gateway configured. Customers will not be able to complete online prepaid checkouts.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/settings/store")}
              className="px-4 py-2 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition-colors shrink-0 shadow-sm"
            >
              Configure Razorpay Gateway
            </button>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-ui-fg-base text-3xl font-semibold tracking-tight">
              Overview
            </h1>
            <p className="text-ui-fg-muted mt-1 text-sm">
              Live store metrics from Medusa — orders, catalog, customers
            </p>
            {(tenantLabel || tenantId) && (
              <div className="text-ui-fg-muted mt-1 flex items-center gap-1.5 font-mono text-xs">
                <span>Active store:</span>
                <span className="text-ui-fg-subtle">
                  {tenantLabel || tenantId}
                </span>
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {agencySession && (
              <button
                className="border-ui-border-base bg-ui-bg-base hover:bg-ui-bg-subtle-hover rounded-lg border px-3 py-1.5 text-xs font-medium"
                onClick={async () => {
                  await leaveStoreSession()
                  navigate("/agency/dashboard", { replace: true })
                }}
              >
                Leave store → Agency
              </button>
            )}
            <button
              type="button"
              onClick={() => setRefreshKey((k) => k + 1)}
              className="border-ui-border-base bg-ui-bg-base hover:bg-ui-bg-subtle-hover inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium"
            >
              <RefreshCw size={14} className={data.loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <Link
              to="/products/create"
              className="border-ui-border-base bg-ui-bg-base hover:bg-ui-bg-subtle-hover inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium"
            >
              <Plus size={14} />
              Add product
            </Link>
            <Link
              to="/orders"
              className="bg-ui-button-neutral text-ui-fg-on-color hover:bg-ui-button-neutral-hover inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium"
            >
              <ShoppingBag size={14} />
              All orders
            </Link>
          </div>
        </div>

        {agencySession && (
          <Container className="border-ui-border-interactive bg-ui-bg-highlight mb-6 p-4">
            <Text size="small" weight="plus">
              Agency session active
            </Text>
            <Text size="xsmall" className="text-ui-fg-subtle mt-1">
              You opened this store from the Agency console. Actions are audited
              under your agency membership
              {getStoreSessionMeta()?.authMethod === "temp_code"
                ? ` (temp code issued by ${
                    getStoreSessionMeta()?.publishedByEmail || "unknown"
                  })`
                : ""}
              .
            </Text>
          </Container>
        )}

        {data.error && (
          <Container className="border-ui-border-error mb-6 p-4">
            <Text size="small" className="text-ui-fg-error">
              {data.error}
            </Text>
          </Container>
        )}

        {/* KPI row — all link to live pages */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            label="Total sales"
            value={data.loading ? "…" : formatInr(stats.salesTotal)}
            hint={
              data.loading
                ? "Loading…"
                : `${stats.ordersToday} order(s) today · ${formatInr(stats.salesToday)}`
            }
            to="/orders"
            icon={IndianRupee}
          />
          <Kpi
            label="Orders"
            value={data.loading ? "…" : data.orderCount}
            hint={`${stats.pending} pending · ${stats.prepaid} prepaid · ${stats.cod} COD`}
            to="/orders"
            icon={ShoppingBag}
          />
          <Kpi
            label="Products"
            value={data.loading ? "…" : data.productCount}
            hint="Catalog in admin"
            to="/products"
            icon={Package}
          />
          <Kpi
            label="Customers"
            value={
              data.loading
                ? "…"
                : data.customersCount != null
                  ? data.customersCount
                  : "—"
            }
            hint="Customer list"
            to="/customers"
            icon={Users}
          />
        </div>

        {/* Quick links */}
        <div className="mb-8 flex flex-wrap gap-2">
          {[
            { to: "/orders", label: "Orders" },
            { to: "/products", label: "Products" },
            { to: "/products/create", label: "New product" },
            { to: "/inventory", label: "Inventory" },
            { to: "/customers", label: "Customers" },
            { to: "/promotions", label: "Promotions" },
            { to: "/collections", label: "Collections" },
            { to: "/settings/store", label: "Store settings" },
          ].map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="border-ui-border-base bg-ui-bg-subtle hover:bg-ui-bg-subtle-hover text-ui-fg-subtle inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium"
            >
              {l.label}
              <ArrowRight size={12} />
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent orders */}
          <Card className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-ui-fg-base text-base font-semibold">
                Recent orders
              </h2>
              <Link
                to="/orders"
                className="text-ui-fg-interactive text-sm hover:underline"
              >
                View all
              </Link>
            </div>
            {data.loading ? (
              <p className="text-ui-fg-muted text-sm">Loading orders…</p>
            ) : stats.recent.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-ui-fg-muted text-sm">No orders yet</p>
                <Link
                  to="/products"
                  className="text-ui-fg-interactive mt-2 inline-block text-sm hover:underline"
                >
                  Add products and take a storefront order
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-ui-fg-muted border-ui-border-base border-b text-xs uppercase tracking-wide">
                      <th className="pb-2 pr-3 font-medium">Order</th>
                      <th className="pb-2 pr-3 font-medium">Customer</th>
                      <th className="pb-2 pr-3 font-medium">Payment</th>
                      <th className="pb-2 pr-3 font-medium">Status</th>
                      <th className="pb-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recent.map((o) => {
                      const pay = paymentLabel(o)
                      return (
                        <tr
                          key={o.id}
                          className="border-ui-border-base hover:bg-ui-bg-subtle-hover border-b last:border-0"
                        >
                          <td className="py-2.5 pr-3">
                            <Link
                              to={`/orders/${o.id}`}
                              className="text-ui-fg-interactive font-medium hover:underline"
                            >
                              #{o.display_id ?? o.id.slice(-6)}
                            </Link>
                            <div className="text-ui-fg-muted text-[11px]">
                              {o.created_at
                                ? new Date(o.created_at).toLocaleString("en-IN")
                                : ""}
                            </div>
                          </td>
                          <td className="text-ui-fg-subtle max-w-[140px] truncate py-2.5 pr-3">
                            {o.email || "—"}
                          </td>
                          <td className="py-2.5 pr-3">
                            <span
                              className={clx(
                                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
                                pay.tone === "prepaid" &&
                                  "bg-emerald-500/10 text-emerald-600",
                                pay.tone === "cod" &&
                                  "bg-amber-500/10 text-amber-700",
                                pay.tone === "unknown" &&
                                  "bg-ui-bg-subtle text-ui-fg-muted"
                              )}
                            >
                              {pay.tone === "prepaid" ? (
                                <CreditCard size={11} />
                              ) : (
                                <Banknote size={11} />
                              )}
                              {pay.label}
                            </span>
                          </td>
                          <td className="py-2.5 pr-3">
                            <Badge size="2xsmall">{indianStatus(o)}</Badge>
                          </td>
                          <td className="text-ui-fg-base py-2.5 text-right font-medium tabular-nums">
                            {formatInr(o.total)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {/* Side column */}
          <div className="space-y-6">
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-ui-fg-base text-base font-semibold">
                  Payment mix
                </h2>
                <Link
                  to="/orders"
                  className="text-ui-fg-interactive text-sm hover:underline"
                >
                  Orders
                </Link>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ui-fg-subtle flex items-center gap-2">
                    <CreditCard size={14} /> Prepaid (Razorpay)
                  </span>
                  <span className="text-ui-fg-base font-semibold">
                    {data.loading ? "…" : stats.prepaid}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ui-fg-subtle flex items-center gap-2">
                    <Banknote size={14} /> COD / Manual
                  </span>
                  <span className="text-ui-fg-base font-semibold">
                    {data.loading ? "…" : stats.cod}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ui-fg-subtle">Pending status</span>
                  <span className="text-ui-fg-base font-semibold">
                    {data.loading ? "…" : stats.pending}
                  </span>
                </div>
              </div>
            </Card>

            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-ui-fg-base text-base font-semibold">
                  Top products (units)
                </h2>
                <Link
                  to="/products"
                  className="text-ui-fg-interactive text-sm hover:underline"
                >
                  Catalog
                </Link>
              </div>
              {data.loading ? (
                <p className="text-ui-fg-muted text-sm">Loading…</p>
              ) : stats.topProducts.length === 0 ? (
                <p className="text-ui-fg-muted text-sm">
                  No line items yet.{" "}
                  <Link to="/products" className="text-ui-fg-interactive hover:underline">
                    Manage products
                  </Link>
                </p>
              ) : (
                <ul className="space-y-2">
                  {stats.topProducts.map(([name, qty]) => (
                    <li
                      key={name}
                      className="border-ui-border-base flex items-center justify-between border-b py-2 text-sm last:border-0"
                    >
                      <span className="text-ui-fg-subtle line-clamp-1 pr-2">
                        {name}
                      </span>
                      <span className="text-ui-fg-base font-medium tabular-nums">
                        {qty}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-ui-fg-base text-base font-semibold">
                  Catalog
                </h2>
                <Link
                  to="/products"
                  className="text-ui-fg-interactive text-sm hover:underline"
                >
                  View all
                </Link>
              </div>
              {data.loading ? (
                <p className="text-ui-fg-muted text-sm">Loading…</p>
              ) : data.products.length === 0 ? (
                <Link
                  to="/products/create"
                  className="text-ui-fg-interactive text-sm hover:underline"
                >
                  Create your first product
                </Link>
              ) : (
                <ul className="space-y-2">
                  {data.products.map((p) => (
                    <li key={p.id}>
                      <Link
                        to={`/products/${p.id}`}
                        className="border-ui-border-base hover:bg-ui-bg-subtle-hover flex items-center justify-between gap-2 rounded-md border-b py-2 text-sm last:border-0"
                      >
                        <span className="text-ui-fg-base line-clamp-1 font-medium">
                          {p.title || p.id}
                        </span>
                        <Badge size="2xsmall">{p.status || "—"}</Badge>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <Link
                to="/products/create"
                className="text-ui-fg-interactive mt-3 inline-flex items-center gap-1 text-sm hover:underline"
              >
                <Tag size={14} />
                Add product
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
