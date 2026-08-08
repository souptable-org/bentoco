import { PencilSquare } from "@bentoco/icons"
import { HttpTypes } from "@bentoco/types"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { ActionMenu } from "../../../../../components/common/action-menu"

export const UserListTableActions = ({
  user,
}: {
  user: HttpTypes.AdminUser
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <ActionMenu
      groups={[
        {
          actions: [
            {
              icon: <PencilSquare />,
              label: t("actions.edit"),
              onClick: () => navigate(`/settings/users/${user.id}/edit`),
            },
          ],
        },
      ]}
    />
  )
}
