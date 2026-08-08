import { Search } from "lucide-react"
import { useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { CustomSidebarTrigger } from "@/components/custom-sidebar-trigger"
import { AppBreadcrumbs } from "@/components/app-breadcrumbs"
import { ThemeToggle } from "@/components/theme-toggle"
import { NavUser } from "@/components/nav-user"
import { getNavLinks } from "@/components/app-shared"
import { useAppDispatch } from "@/redux/hooks"
import { setCommandPaletteOpen } from "@/redux/slices/uiSlice"
import { useModKey } from "@/hooks/use-mod-key"
import { Separator } from "@/components/ui/separator"
import { Kbd } from "@/components/ui/kbd"

export function AppHeader() {
  const location = useLocation()
  const dispatch = useAppDispatch()
  const modKey = useModKey()
  const page =
    getNavLinks(location.pathname).find((item) => item.isActive) ?? null

  const openSearch = () => dispatch(setCommandPaletteOpen(true))

  return (
    <header
      className={cn(
        "sticky top-0 z-50 flex min-h-14 shrink-0 items-center gap-2 border-b border-border agency-main-panel px-2 sm:px-4 md:px-6"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <CustomSidebarTrigger />
        <Separator orientation="vertical" className="mx-1 hidden h-4 sm:block" />
        <div className="min-w-0">
          <AppBreadcrumbs page={page} />
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {/* Field-shaped search trigger — matches shell inputs, not a loud outline chip */}
        <button
          type="button"
          onClick={openSearch}
          className={cn(
            "relative hidden h-9 w-52 items-center gap-2 rounded-md border border-border bg-muted/40 px-2.5 text-left text-sm text-muted-foreground transition-colors",
            "hover:border-border hover:bg-muted/60 hover:text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0",
            "md:inline-flex lg:w-64"
          )}
          aria-label="Open search"
        >
          <Search className="size-3.5 shrink-0 opacity-70" aria-hidden />
          <span className="min-w-0 flex-1 truncate">Search…</span>
          <Kbd className="pointer-events-none hidden h-5 min-w-0 shrink-0 border border-border bg-background px-1.5 font-mono text-[10px] font-normal text-muted-foreground lg:inline-flex">
            {modKey}K
          </Kbd>
        </button>

        {/* Compact search on small screens */}
        <button
          type="button"
          onClick={openSearch}
          className={cn(
            buttonVariants({ variant: "ghost", size: "icon" }),
            "agency-touch-target size-auto shrink-0 md:hidden"
          )}
          aria-label="Open search"
        >
          <Search className="size-4" aria-hidden />
        </button>

        <ThemeToggle className="hidden md:inline-flex" />
        <NavUser />
      </div>
    </header>
  )
}
