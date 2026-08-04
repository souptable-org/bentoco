import { Link } from "react-router-dom"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CreditCardIcon,
  LogOutIcon,
  StoreIcon,
  MoonIcon,
  SunIcon,
  MonitorIcon,
  CommandIcon,
} from "lucide-react"
import { useTheme } from "@/providers/theme-provider"
import type { ThemeOption } from "@/providers/theme-provider/theme-context"
import { cn } from "@/lib/utils"
import { useAppDispatch } from "@/redux/hooks"
import { setCommandPaletteOpen } from "@/redux/slices/uiSlice"
import { openMerchantLogin } from "@/lib/agency-store-url"
import { useModKey } from "@/hooks/use-mod-key"
import { useMe } from "@/hooks/api/users"
import { useLogout } from "@/hooks/api/auth"
import { clearAgencySession, getAgencyUid } from "@/lib/agency-session"
import { useNavigate } from "react-router-dom"

const themeOptions: {
  value: ThemeOption
  label: string
  icon: React.ReactNode
}[] = [
  { value: "system", label: "System", icon: <MonitorIcon className="size-4" /> },
  { value: "light", label: "Light", icon: <SunIcon className="size-4" /> },
  { value: "dark", label: "Dark", icon: <MoonIcon className="size-4" /> },
]

export function NavUser() {
  const { theme, setTheme } = useTheme()
  const dispatch = useAppDispatch()
  const modKey = useModKey()
  const navigate = useNavigate()
  const { user: me } = useMe()
  const { mutateAsync: logout } = useLogout()

  const displayName =
    [me?.first_name, me?.last_name].filter(Boolean).join(" ") ||
    me?.email?.split("@")[0] ||
    "Agency user"
  const displayEmail = me?.email || "—"
  const agencyId = getAgencyUid() || "—"
  const initials = displayName.slice(0, 2).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        className="agency-touch-target rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="User menu"
      >
        <Avatar className="size-8 cursor-pointer">
          {me?.avatar_url ? (
            <AvatarImage src={me.avatar_url} alt={displayName} />
          ) : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <Avatar className="size-10">
            {me?.avatar_url ? (
              <AvatarImage src={me.avatar_url} alt={displayName} />
            ) : null}
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <DropdownMenuLabel className="p-0 font-medium text-foreground">
              {displayName}
            </DropdownMenuLabel>
            <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
            <p className="text-xs text-muted-foreground">{agencyId}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <MoonIcon className="size-4" />
              Theme
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-40">
              {themeOptions.map((option) => (
                <DropdownMenuItem
                  key={option.value}
                  className={cn(
                    "cursor-pointer gap-2",
                    theme === option.value && "bg-accent text-accent-foreground"
                  )}
                  onSelect={(event) => {
                    event.preventDefault()
                    setTheme(option.value)
                  }}
                >
                  {option.icon}
                  {option.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem
            className="cursor-pointer gap-2"
            onSelect={(e) => {
              e.preventDefault()
              dispatch(setCommandPaletteOpen(true))
            }}
          >
            <CommandIcon />
            Command palette
            <span className="ml-auto text-xs text-muted-foreground">
              {modKey}+K
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer gap-2">
            <Link to="/agency/billing">
              <CreditCardIcon />
              Billing
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className="w-full cursor-pointer gap-2"
            onSelect={(e) => {
              e.preventDefault()
              openMerchantLogin()
            }}
          >
            <StoreIcon />
            Merchant login
            <span className="ml-auto text-xs text-muted-foreground">
              opens new tab
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="w-full cursor-pointer gap-2 text-destructive focus:text-destructive"
            onSelect={async (e) => {
              e.preventDefault()
              try {
                await logout()
              } catch {
                // still clear local agency hints
              }
              clearAgencySession()
              navigate("/login", { replace: true })
            }}
          >
            <LogOutIcon />
            Log out
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
