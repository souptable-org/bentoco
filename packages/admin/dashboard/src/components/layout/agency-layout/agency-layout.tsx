import React, { useEffect, useState } from "react"
import { Outlet, Navigate } from "react-router-dom"
import { AppProvider } from "@/providers/app-provider"
import { AppShell } from "@/components/app-shell"
import { useMe } from "../../../hooks/api/users"
import { Spinner } from "@bentoco/icons"
import {
  fetchAgencyMe,
  isAgencyMode,
  persistAgencySession,
} from "@/lib/agency-session"

export const AgencyLayout: React.FC = () => {
  const { user, isLoading } = useMe()
  const [agencyCheck, setAgencyCheck] = useState<
    "loading" | "allowed" | "denied"
  >("loading")

  useEffect(() => {
    let cancelled = false

    async function resolveAccess() {
      if (isLoading) {
        return
      }
      if (!user?.email) {
        setAgencyCheck("denied")
        return
      }

      // Fast path: session already marked agency after login
      if (isAgencyMode()) {
        setAgencyCheck("allowed")
        return
      }

      try {
        const me = await fetchAgencyMe(user.email)
        if (cancelled) return
        persistAgencySession(me)
        setAgencyCheck(me.isAgency ? "allowed" : "denied")
      } catch {
        if (!cancelled) {
          setAgencyCheck("denied")
        }
      }
    }

    void resolveAccess()
    return () => {
      cancelled = true
    }
  }, [user?.email, isLoading])

  if (isLoading || agencyCheck === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <Spinner className="text-ui-fg-interactive animate-spin" />
      </div>
    )
  }

  // Redirect to login if unauthenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Merchants without agency membership stay on merchant admin
  if (agencyCheck === "denied") {
    return <Navigate to="/orders" replace />
  }

  return (
    <AppProvider>
      <AppShell>
        <Outlet />
      </AppShell>
    </AppProvider>
  )
}
