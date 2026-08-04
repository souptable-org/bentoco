import { Spinner } from "@bentoco/icons"
import { useEffect, useMemo, useState } from "react"
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useMePermissions } from "../../../hooks/api/rbac-roles"
import { useMe } from "../../../hooks/api/users"
import type { Permission, UserPolicy } from "../../../lib/permissions"
import {
  fetchAgencyMe,
  isAgencyMode,
  persistAgencySession,
} from "../../../lib/agency-session"
import { useFeatureFlag } from "../../../providers/feature-flag-provider"
import { PermissionsProvider } from "../../../providers/permissions-provider"
import { SearchProvider } from "../../../providers/search-provider"
import { SidebarProvider } from "../../../providers/sidebar-provider"

export const ProtectedRoute = () => {
  const location = useLocation()
  const isRbacEnabled = useFeatureFlag("rbac")

  const { user, isLoading: isLoadingUser } = useMe()
  const { data: permissionsResponse, isLoading: isLoadingPermissions } =
    useMePermissions({
      // Don't fetch permissions until we know the user is authenticated.
      enabled: !!user && isRbacEnabled,
    })

  const [agencyGate, setAgencyGate] = useState<"loading" | "agency" | "merchant">(
    "loading"
  )

  useEffect(() => {
    let cancelled = false

    async function resolveMode() {
      if (isLoadingUser) {
        return
      }
      if (!user?.email) {
        setAgencyGate("merchant")
        return
      }
      if (isAgencyMode()) {
        setAgencyGate("agency")
        return
      }
      try {
        const me = await fetchAgencyMe(user.email)
        if (cancelled) return
        persistAgencySession(me)
        setAgencyGate(me.isAgency ? "agency" : "merchant")
      } catch {
        if (!cancelled) {
          setAgencyGate("merchant")
        }
      }
    }

    void resolveMode()
    return () => {
      cancelled = true
    }
  }, [user?.email, isLoadingUser])

  const policy: UserPolicy | null = useMemo(() => {
    if (!permissionsResponse) {
      return null
    }
    return {
      permissions: permissionsResponse.permissions as Permission[],
    }
  }, [permissionsResponse])

  if (isLoadingUser || (user && agencyGate === "loading")) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="text-ui-fg-interactive animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Agency members use the agency shell, not merchant MainLayout
  if (agencyGate === "agency") {
    return <Navigate to="/agency/dashboard" replace />
  }

  return (
    <PermissionsProvider
      policy={policy}
      isLoading={isLoadingPermissions}
      isRbacEnabled={isRbacEnabled}
    >
      <SidebarProvider>
        <SearchProvider>
          <Outlet />
        </SearchProvider>
      </SidebarProvider>
    </PermissionsProvider>
  )
}
