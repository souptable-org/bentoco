import React from "react"
import { useNavigate } from "react-router-dom"
import { Check, ChevronsUpDown, ExternalLink } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"
import {
  DEMO_MANAGED_STORES,
  type DemoManagedStore,
} from "@/lib/agency-demo"
import {
  merchantOpenAriaLabel,
  openMerchantStore,
} from "@/lib/agency-store-url"
import { agencyStatusBadgeClass } from "@/lib/agency-status-styles"

export type ManagedStoreOption = {
  id: string
  name: string
  status: string
  subdomain?: string
}

export interface AgencyStoreSwitcherProps {
  currentStoreId?: string
  managedStores?: ManagedStoreOption[]
  agencyName?: string
  onSelectStore?: (storeId: string) => void
  onReturnToAgencyDashboard?: () => void
  className?: string
  /** Sidebar layout: full-width trigger that collapses to an icon */
  variant?: "sidebar" | "header"
}

function storeInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return "?"
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
}

/** Current-store monogram — distinct from nav “Stores” (LayoutGrid). */
function StoreMonogram({
  name,
  status,
  className,
}: {
  name?: string
  status?: string
  className?: string
}) {
  return (
    <span
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-semibold uppercase leading-none tracking-tight",
        agencyStatusBadgeClass(status ?? "archived"),
        className
      )}
      aria-hidden
    >
      {name ? storeInitials(name) : "?"}
    </span>
  )
}

export const AgencyStoreSwitcher: React.FC<AgencyStoreSwitcherProps> = ({
  currentStoreId,
  managedStores = DEMO_MANAGED_STORES,
  agencyName = "BentoCo Agency",
  onSelectStore,
  onReturnToAgencyDashboard,
  className,
  variant = "sidebar",
}) => {
  const navigate = useNavigate()

  const stores =
    managedStores && managedStores.length > 0
      ? managedStores
      : DEMO_MANAGED_STORES
  const activeStore = stores.find((s) => s.id === currentStoreId) || stores[0]

  const handleSelect = (store: ManagedStoreOption) => {
    if (onSelectStore) {
      onSelectStore(store.id)
      return
    }
    // id is tenant UUID when fed from live API
    void openMerchantStore({
      tenantId: store.id,
      subdomain: store.subdomain,
      storeName: store.name,
    })
  }

  const menu = (
    <DropdownMenuContent
      align="start"
      side={variant === "sidebar" ? "right" : "bottom"}
      sideOffset={variant === "sidebar" ? 8 : 4}
      className="w-64"
    >
      <DropdownMenuLabel className="font-normal">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-semibold text-foreground">
            {agencyName}
          </span>
          <span className="text-[11px] text-muted-foreground">
            Managed stores · click to open merchant dashboard
          </span>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />

      {stores.map((store) => {
        const isSelected = store.id === activeStore?.id
        return (
          <DropdownMenuItem
            key={store.id}
            onClick={() => handleSelect(store)}
            className="cursor-pointer gap-2 py-2"
            aria-label={merchantOpenAriaLabel(store.name)}
            title={merchantOpenAriaLabel(store.name)}
          >
            {isSelected ? (
              <Check className="size-4 shrink-0 text-primary" />
            ) : (
              <span className="size-4 shrink-0" aria-hidden />
            )}
            <StoreMonogram name={store.name} status={store.status} />
            <div className="grid min-w-0 flex-1 gap-0.5">
              <span className="truncate text-sm font-medium">{store.name}</span>
              <span className="truncate text-[11px] text-muted-foreground capitalize">
                {store.status}
              </span>
            </div>
            <ExternalLink
              className="size-3.5 shrink-0 text-muted-foreground opacity-70"
              aria-hidden
            />
          </DropdownMenuItem>
        )
      })}

      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() =>
          onReturnToAgencyDashboard
            ? onReturnToAgencyDashboard()
            : navigate("/agency/dashboard")
        }
        className="cursor-pointer text-xs text-muted-foreground"
      >
        Agency overview
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => navigate("/agency/stores")}
        className="cursor-pointer text-xs text-muted-foreground"
      >
        View all stores
      </DropdownMenuItem>
    </DropdownMenuContent>
  )

  if (variant === "sidebar") {
    return (
      <SidebarMenu className={cn(className)}>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size="lg"
                tooltip={
                  activeStore
                    ? `${activeStore.name} (${activeStore.status}) — managed stores`
                    : "Managed stores"
                }
                aria-label={
                  activeStore
                    ? `Selected store: ${activeStore.name}, ${activeStore.status}. Open menu to choose a store. Opening a store launches merchant admin in a new tab.`
                    : "Open managed stores menu. Opening a store launches merchant admin in a new tab."
                }
                className="h-auto min-h-11 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              >
                <StoreMonogram
                  name={activeStore?.name}
                  status={activeStore?.status}
                />
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="truncate font-medium">
                    {activeStore?.name ?? "Select store"}
                  </span>
                  <span className="truncate text-[11px] capitalize text-muted-foreground">
                    {activeStore?.status ?? "No store"}
                  </span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 shrink-0 opacity-50 group-data-[collapsible=icon]:hidden" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            {menu}
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label={
          activeStore
            ? `Store menu: ${activeStore.name}. Choose a store to open merchant admin in a new tab.`
            : "Store menu. Choose a store to open merchant admin in a new tab."
        }
        className={cn(
          "agency-touch-target inline-flex h-auto w-full min-w-0 items-center gap-2 rounded-lg border border-border bg-secondary px-3 text-sm font-medium outline-none",
          "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
      >
        <StoreMonogram
          name={activeStore?.name}
          status={activeStore?.status}
        />
        <span className="min-w-0 flex-1 truncate text-left">
          {activeStore ? activeStore.name : "Select store"}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      {menu}
    </DropdownMenu>
  )
}
