import { MedusaContainer } from "@bentoco/framework/types"
import { ContainerRegistrationKeys } from "@bentoco/framework/utils"

export const refetchShippingOptionType = async (
  shippingOptionTypeId: string,
  scope: MedusaContainer,
  fields: string[]
) => {
  const query = scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: shippingOptionTypes } = await query.graph({
    entity: "shipping_option_type",
    fields: fields,
    filters: { id: shippingOptionTypeId },
  })
  return shippingOptionTypes[0]
}
