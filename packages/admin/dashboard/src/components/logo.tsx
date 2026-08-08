import { Boxes } from "lucide-react"
import { cn } from "@/lib/utils"

export function LogoIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "bg-primary text-primary-foreground flex size-6 shrink-0 items-center justify-center rounded-md p-1",
        className
      )}
    >
      <Boxes className="size-full" />
    </span>
  )
}

export function Logo({ className }: { className?: string }) {
  return <LogoIcon className={className} />
}
