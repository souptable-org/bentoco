import type { LucideIcon } from "lucide-react"
import {
  BadgeCheck,
  CheckCircle2,
  Clock,
  Gift,
  Globe,
  Heart,
  IndianRupee,
  Package,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Zap,
} from "lucide-react"

/** Keys mirror admin PROMISE_ICONS in promises-inspector.tsx */
export const PROMISE_ICON_MAP: Record<string, LucideIcon> = {
  truck: Truck,
  "hand-truck": Package,
  shield: ShieldCheck,
  check: CheckCircle2,
  badge: BadgeCheck,
  star: Star,
  sparkles: Sparkles,
  heart: Heart,
  gift: Gift,
  globe: Globe,
  clock: Clock,
  bolt: Zap,
  rupee: IndianRupee,
}

export function resolvePromiseIcon(iconKey?: string): LucideIcon {
  if (!iconKey) return CheckCircle2
  return PROMISE_ICON_MAP[iconKey] || CheckCircle2
}

export function isCustomPromiseIcon(item: {
  icon_mode?: string
  icon_url?: string
  icon?: string
}): boolean {
  // Prefer explicit custom mode; any uploaded URL is treated as custom art
  return item.icon_mode === "custom" || Boolean(item.icon_url)
}
