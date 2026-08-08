import type { ReactNode } from "react"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { CommandPalette } from "@/components/shared/command-palette"

/**
 * Agency app shell (Efferd inset):
 * - SidebarProvider from @/components/ui/sidebar (required by useSidebar)
 * - Recessed canvas + flush sidebar; elevated main panel only
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="agency-canvas overflow-hidden text-foreground">
      <SidebarProvider className="agency-canvas relative h-svh">
        <AppSidebar />
        <SidebarInset className="agency-main-panel min-h-0 border border-border">
          <AppHeader />
          <div className="agency-main-panel agency-scroll flex flex-1 flex-col gap-4 overflow-y-auto overflow-x-hidden p-4 md:p-6">
            {children}
          </div>
        </SidebarInset>
        <CommandPalette />
      </SidebarProvider>
    </div>
  )
}
