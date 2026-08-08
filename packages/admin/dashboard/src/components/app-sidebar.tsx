import { Link, useLocation } from "react-router-dom"
import { LogoIcon } from "@/components/logo"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { NavGroup } from "@/components/nav-group"
import { getNavGroups } from "@/components/app-shared"
import { AgencyStoreSwitcher } from "@/components/layout/agency-store-switcher/agency-store-switcher"
import { PlusIcon } from "lucide-react"

export function AppSidebar() {
  const location = useLocation()
  const pathname = location.pathname
  const navGroups = getNavGroups(pathname)

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="gap-2 border-b border-sidebar-border/80 p-2">
        <SidebarMenuButton asChild tooltip="Agency home" size="lg">
          <Link to="/agency/dashboard" aria-label="Agency home">
            <LogoIcon className="size-4 shrink-0" />
            <span className="font-medium group-data-[collapsible=icon]:hidden">
              BentoCo Agency
            </span>
          </Link>
        </SidebarMenuButton>
        {/* Selected / managed store — monogram encodes active client when collapsed */}
        <AgencyStoreSwitcher variant="sidebar" />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              {/* Quieter create: outline rail control, not primary takeover */}
              <SidebarMenuButton
                asChild
                variant="outline"
                tooltip="New store"
                className="min-w-8"
              >
                <Link to="/agency/stores" aria-label="New store">
                  <PlusIcon />
                  <span>New store</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
        <SidebarSeparator className="mx-0" />
        {navGroups.map((group, index) => (
          <NavGroup key={`sidebar-group-${index}`} {...group} />
        ))}
      </SidebarContent>
    </Sidebar>
  )
}
