import React, { useMemo } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Store,
  DollarSign,
  Activity,
  Users,
  ArrowUpRight,
  Plus,
  ArrowDownRight,
  ExternalLink,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import {
  useGetAgencyOverviewQuery,
  useGetAgencyStoresQuery,
} from "@/redux/api"
import {
  merchantOpenAriaLabel,
  merchantOpenTitle,
  openMerchantStore,
} from "@/lib/agency-store-url"
import {
  agencyStatusBadgeClass,
  agencyTrendClass,
  agencyTrendIconClass,
} from "@/lib/agency-status-styles"
import { getAgencyUid } from "@/lib/agency-session"
import { AddClientStoreModal } from "@/components/modals/add-client-store-modal"

function formatActivityTime(value: unknown): string {
  if (!value) {
    return "—"
  }
  try {
    const d = new Date(String(value))
    if (Number.isNaN(d.getTime())) {
      return String(value)
    }
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return String(value)
  }
}

function activityIcon(type: string) {
  const t = (type || "").toUpperCase()
  if (t.includes("INVITE") || t.includes("STAFF")) {
    return Users
  }
  if (t.includes("BILLING") || t.includes("PAYMENT")) {
    return DollarSign
  }
  if (t.includes("TRANSFER") || t.includes("OWNERSHIP")) {
    return ArrowUpRight
  }
  if (t.includes("ACCESS") || t.includes("REVOKE") || t.includes("LOGIN")) {
    return Activity
  }
  return Store
}

export function AgencyDashboardView() {
  const agencyUid = getAgencyUid() || undefined
  const { data, isLoading, isError } = useGetAgencyOverviewQuery()
  const {
    data: storesData,
    isLoading: storesLoading,
  } = useGetAgencyStoresQuery(agencyUid)

  const KPICards = data?.kpis?.length
    ? data.kpis
    : isLoading
      ? []
      : [
          {
            title: "Total Client Stores",
            value: "0",
            trend: "",
            isPositive: true,
          },
          {
            title: "Active Agency Access",
            value: "0",
            trend: "",
            isPositive: true,
          },
          {
            title: "Pending Invites",
            value: "0",
            trend: "",
            isPositive: true,
          },
          {
            title: "Combined Monthly GMV",
            value: "—",
            trend: "",
            isPositive: true,
          },
        ]

  const kpiIcons: Record<string, typeof Store> = {
    "Total Client Stores": Store,
    "Active Agency Access": Activity,
    "Pending Invites": Users,
    "Combined Monthly GMV": DollarSign,
    "Active Live Stores": Activity,
    "Suspended Stores": Users,
  }

  const stores = useMemo(() => {
    const list = Array.isArray(storesData?.stores) ? storesData.stores : []
    return list.map((s: any) => ({
      id: s.id as string,
      tenantId: (s.tenant_id || s.tenantId || s.id) as string,
      name: (s.name || "Store") as string,
      status: (s.status || "staging") as string,
      subdomain: (s.subdomain || "") as string,
      owner: (s.owner || "") as string,
      plan: (s.plan || "free") as string,
    }))
  }, [storesData])

  const byStatus = useMemo(() => {
    const active = stores.filter(
      (s) => s.status === "active" || s.status === "live"
    )
    const staging = stores.filter(
      (s) => s.status === "staging" || s.status === "pending"
    )
    const suspended = stores.filter(
      (s) =>
        s.status === "suspended" ||
        s.status === "revoked" ||
        s.status === "archived"
    )
    return { active, staging, suspended }
  }, [stores])

  const recentActivity = data?.recentActivity?.length
    ? data.recentActivity
    : []

  const renderStoreRow = (store: (typeof stores)[0]) => (
    <div
      key={store.id}
      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="h-10 w-10 shrink-0 rounded-md bg-primary/10 flex items-center justify-center">
          <Store className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm truncate">{store.name}</p>
          <p className="text-xs text-muted-foreground font-mono truncate">
            {store.subdomain
              ? `${store.subdomain}.bentoco.com`
              : store.owner || store.tenantId}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge
          variant="secondary"
          className={cn("border capitalize", agencyStatusBadgeClass(store.status))}
        >
          {store.status}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          className="agency-touch-target h-auto min-w-0 gap-1.5 px-3"
          onClick={() => {
            void openMerchantStore({
              tenantId: store.tenantId,
              subdomain: store.subdomain,
              storeName: store.name,
            })
          }}
          aria-label={merchantOpenAriaLabel(store.name)}
          title={merchantOpenTitle()}
        >
          Open
          <span className="text-xs text-muted-foreground">(new tab)</span>
          <ExternalLink className="size-3.5" aria-hidden />
        </Button>
      </div>
    </div>
  )

  const emptyTab = (label: string) => (
    <div className="text-sm text-muted-foreground py-8 text-center">
      {storesLoading ? "Loading stores…" : `No ${label} stores.`}
      {!storesLoading && (
        <div className="mt-3">
          <Link
            to="/agency/stores"
            className="text-primary text-sm font-medium hover:underline"
          >
            Manage all stores
          </Link>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isLoading
              ? "Fetching live agency metrics…"
              : isError
                ? "Could not load overview — showing empty state."
                : "Manage your agency performance and client stores."}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/agency/audit">Audit logs</Link>
          </Button>
          <AddClientStoreModal
            trigger={
              <Button className="bg-primary hover:bg-primary/90 text-white font-semibold">
                <Plus className="mr-2 h-4 w-4 text-white" /> New Store
              </Button>
            }
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {(KPICards.length ? KPICards : []).map((kpi: any, index: number) => {
          const Icon = kpiIcons[kpi.title] || Store
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle as="div" className="text-sm font-medium">
                  {kpi.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                {kpi.trend ? (
                  <p className="text-xs text-muted-foreground flex items-center mt-1">
                    {kpi.isPositive ? (
                      <ArrowUpRight
                        className={cn("mr-1 h-3 w-3", agencyTrendIconClass(true))}
                      />
                    ) : (
                      <ArrowDownRight
                        className={cn(
                          "mr-1 h-3 w-3",
                          agencyTrendIconClass(false)
                        )}
                      />
                    )}
                    <span className={agencyTrendClass(!!kpi.isPositive)}>
                      {kpi.trend}
                    </span>
                    <span className="ml-1 text-muted-foreground">
                      from last month
                    </span>
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">Live from DB</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle as="h2">Quick store switcher</CardTitle>
              <CardDescription>
                Open merchant admin for a client store. Agency tab stays open to
                return.
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/agency/stores">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="active">
                  Active ({byStatus.active.length})
                </TabsTrigger>
                <TabsTrigger value="staging">
                  Staging ({byStatus.staging.length})
                </TabsTrigger>
                <TabsTrigger value="suspended">
                  Suspended ({byStatus.suspended.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="active" className="space-y-4">
                {byStatus.active.length
                  ? byStatus.active.map(renderStoreRow)
                  : emptyTab("active")}
              </TabsContent>
              <TabsContent value="staging" className="space-y-4">
                {byStatus.staging.length
                  ? byStatus.staging.map(renderStoreRow)
                  : emptyTab("staging")}
              </TabsContent>
              <TabsContent value="suspended" className="space-y-4">
                {byStatus.suspended.length
                  ? byStatus.suspended.map(renderStoreRow)
                  : emptyTab("suspended")}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle as="h2">Recent activity</CardTitle>
            <CardDescription>
              Latest access and store events for your agency.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentActivity.length === 0 && (
                <div className="text-sm text-muted-foreground py-6 text-center flex flex-col items-center gap-2">
                  <Clock className="h-5 w-5 opacity-50" />
                  {isLoading ? "Loading…" : "No recent activity yet."}
                </div>
              )}
              {recentActivity.map((activity: any) => {
                const Icon = activityIcon(String(activity.type || ""))
                return (
                  <div key={activity.id} className="flex items-start gap-4">
                    <div className="bg-secondary p-2 rounded-full mt-0.5">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">
                        {String(activity.type || "EVENT").replace(/_/g, " ")}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {activity.user} · {activity.store}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatActivityTime(activity.time)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-6">
              <Button variant="outline" className="w-full" asChild>
                <Link to="/agency/audit">View all activity</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AgencyDashboardView
