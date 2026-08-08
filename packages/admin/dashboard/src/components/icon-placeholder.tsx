import React from "react"
import { BuildingStorefront } from "@medusajs/icons"

export interface IconPlaceholderProps {
  hugeicons?: string
  lucide?: string
  phosphor?: string
  remixicon?: string
  tabler?: string
  className?: string
}

export const IconPlaceholder: React.FC<IconPlaceholderProps> = ({ className }) => {
  return <BuildingStorefront className={className || "w-4 h-4"} />
}
