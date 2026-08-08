/**
 * Status / trend styles using Medusa UI tag tokens (not hard-coded Tailwind palette).
 * Maps to @bentoco/ui-preset: --tag-green|blue|orange|red|neutral-*
 */

export type AgencyStoreStatus =
  | "active"
  | "staging"
  | "suspended"
  | "archived"
  | "revoke_requested"
  | "new"
  | string

/** Full badge surface: bg + text + border from Medusa tag tokens */
export function agencyStatusBadgeClass(status: AgencyStoreStatus): string {
  switch (String(status).toLowerCase()) {
    case "active":
    case "live":
      return "border-ui-tag-green-border bg-ui-tag-green-bg text-ui-tag-green-text hover:bg-ui-tag-green-bg-hover"
    case "new":
      return "border-ui-tag-blue-border bg-ui-tag-blue-bg text-ui-tag-blue-text hover:bg-ui-tag-blue-bg-hover"
    case "staging":
      return "border-ui-tag-blue-border bg-ui-tag-blue-bg text-ui-tag-blue-text hover:bg-ui-tag-blue-bg-hover"
    case "suspended":
    case "error":
      return "border-ui-tag-red-border bg-ui-tag-red-bg text-ui-tag-red-text hover:bg-ui-tag-red-bg-hover"
    case "revoke_requested":
    case "revoke requested":
      return "border-ui-tag-orange-border bg-ui-tag-orange-bg text-ui-tag-orange-text hover:bg-ui-tag-orange-bg-hover"
    case "archived":
    case "inactive":
    case "revoked":
      return "border-ui-tag-neutral-border bg-ui-tag-neutral-bg text-ui-tag-neutral-text hover:bg-ui-tag-neutral-bg-hover"
    case "pending":
    case "warning":
      return "border-ui-tag-orange-border bg-ui-tag-orange-bg text-ui-tag-orange-text hover:bg-ui-tag-orange-bg-hover"
    default:
      return "border-ui-tag-neutral-border bg-ui-tag-neutral-bg text-ui-tag-neutral-text"
  }
}

/** Human label for store / access status badges */
export function agencyStatusLabel(status: string): string {
  const s = String(status || "").toLowerCase().replace(/_/g, " ")
  if (s === "revoke requested") return "Revoke requested"
  if (s === "staging" || s === "pending") return "Access requested"
  if (s === "new") return "New"
  if (!s) return "Unknown"
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Staff/member status (Active / Invited, etc.) */
export function agencyMemberStatusBadgeClass(status: string): string {
  const s = status.toLowerCase()
  if (s === "active") {
    return agencyStatusBadgeClass("active")
  }
  if (s === "invited" || s === "pending") {
    return agencyStatusBadgeClass("pending")
  }
  return agencyStatusBadgeClass("archived")
}

/** KPI trend / positive-negative text + icon color */
export function agencyTrendClass(isPositive: boolean): string {
  return isPositive
    ? "font-medium text-ui-tag-green-text"
    : "font-medium text-ui-tag-red-text"
}

export function agencyTrendIconClass(isPositive: boolean): string {
  return isPositive ? "text-ui-tag-green-icon" : "text-ui-tag-red-icon"
}
