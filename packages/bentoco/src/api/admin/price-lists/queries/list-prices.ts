import { MedusaContainer } from "@bentoco/framework/types"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@bentoco/framework/utils"

export const listPrices = async (
  ids: string[],
  scope: MedusaContainer,
  fields: string[]
) => {
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const queryObject = remoteQueryObjectFromString({
    entryPoint: "price",
    variables: {
      filters: { id: ids },
    },
    fields,
  })

  return await remoteQuery(queryObject)
}
