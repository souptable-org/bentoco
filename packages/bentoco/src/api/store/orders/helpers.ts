import { MedusaContainer } from "@bentoco/framework/types"
import { refetchEntity } from "@bentoco/framework/http"

export const refetchOrder = async (
  idOrFilter: string | object,
  scope: MedusaContainer,
  fields: string[]
) => {
  return await refetchEntity({ entity: "order", idOrFilter, scope, fields })
}
