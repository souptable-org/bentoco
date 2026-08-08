import { CORE_LAYOUT_IDS } from "@bentoco/admin-shared"

import { LayoutComposer } from "../../../components/layout-composer"
import { useFeatureFlag } from "../../../providers/feature-flag-provider"
import { UserListTable } from "./components/user-list-table"
import { ConfigurableUserListTable } from "./components/user-list-table/configurable-user-list-table"
import { AgencyPartnersTable } from "./components/agency-partners-table"

export const UserList = () => {
  const isViewConfigEnabled = useFeatureFlag("view_configurations")

  return (
    <div className="flex flex-col gap-y-4">
      <LayoutComposer
        widgetsZonePrefix="user.list"
        preferredLayoutId={CORE_LAYOUT_IDS.SINGLE_COLUMN}
        sections={{
          main: (
            <LayoutComposer.Entry id="UserListTable">
              {isViewConfigEnabled ? (
                <ConfigurableUserListTable />
              ) : (
                <UserListTable />
              )}
            </LayoutComposer.Entry>
          ),
        }}
      />
      {/* Merchant partners — agencies with store access (not Medusa user rows) */}
      <AgencyPartnersTable />
    </div>
  )
}
