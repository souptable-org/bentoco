import { MoonIcon, SunIcon, MonitorIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/providers/theme-provider"
import type { ThemeOption } from "@/providers/theme-provider/theme-context"

/**
 * Medusa admin theme control (light / dark / system).
 * Uses the same `medusa_admin_theme` localStorage key as the store admin.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme()

  const options: { value: ThemeOption; label: string; icon: React.ReactNode }[] =
    [
      { value: "system", label: "System", icon: <MonitorIcon className="size-4" /> },
      { value: "light", label: "Light", icon: <SunIcon className="size-4" /> },
      { value: "dark", label: "Dark", icon: <MoonIcon className="size-4" /> },
    ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        type="button"
        aria-label="Toggle theme"
        className={cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          // Match header search field height (h-9 / 36px)
          "h-9 w-9 shrink-0 rounded-md",
          className
        )}
      >
        {resolvedTheme === "dark" ? (
          <MoonIcon className="size-4" />
        ) : (
          <SunIcon className="size-4" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {options.map((option) => (
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
