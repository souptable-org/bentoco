import {
  LayoutDashboard,
  LayoutGrid,
  Users,
  CreditCard,
  Share2,
  ShieldCheck,
} from "lucide-react"

export type SidebarNavItem = {
  title: string
  path?: string
  icon?: ReactNode
  isActive?: boolean
  subItems?: SidebarNavItem[]
}

export type SidebarNavGroup = {
  label?: string
  items: SidebarNavItem[]
}

function isPathActive(pathname: string, path?: string) {
  if (!path) {
    return false
  }

  if (path === "/agency" || path === "/agency/dashboard") {
    return (
      pathname === "/agency" ||
      pathname === "/agency/" ||
      pathname === "/agency/dashboard" ||
      pathname.startsWith("/agency/dashboard/")
    )
  }

  return pathname === path || pathname.startsWith(`${path}/`)
}

/** Agency shell navigation — real routes only (no dead help links). */
export function getNavGroups(pathname: string): SidebarNavGroup[] {
  return [
    {
      items: [
        {
          title: "Overview",
          path: "/agency/dashboard",
          icon: <LayoutDashboard />,
          isActive: isPathActive(pathname, "/agency/dashboard"),
        },
        {
          // LayoutGrid = store roster (not the same as switcher’s current-store monogram)
          title: "Stores",
          path: "/agency/stores",
          icon: <LayoutGrid />,
          isActive: isPathActive(pathname, "/agency/stores"),
        },
        {
          title: "Team",
          path: "/agency/team",
          icon: <Users />,
          isActive: isPathActive(pathname, "/agency/team"),
        },
        {
          title: "Billing",
          path: "/agency/billing",
          icon: <CreditCard />,
          isActive: isPathActive(pathname, "/agency/billing"),
        },
        {
          title: "Referral",
          path: "/agency/referral",
          icon: <Share2 />,
          isActive: isPathActive(pathname, "/agency/referral"),
        },
        {
          title: "Audit Logs",
          path: "/agency/audit",
          icon: <ShieldCheck />,
          isActive: isPathActive(pathname, "/agency/audit"),
        },
      ],
    },
  ]
}

/** No fake footer destinations until real help/status surfaces exist. */
export function getFooterNavLinks(_pathname: string): SidebarNavItem[] {
  return []
}

export function getNavLinks(pathname: string): SidebarNavItem[] {
  return getNavGroups(pathname).flatMap((group) =>
    group.items.flatMap((item) =>
      item.subItems?.length ? [item, ...item.subItems] : [item]
    )
  )
}

export const navGroups: SidebarNavGroup[] = getNavGroups("/agency/dashboard")
export const footerNavLinks: SidebarNavItem[] = []
export const navLinks: SidebarNavItem[] = getNavLinks("/agency/dashboard")
