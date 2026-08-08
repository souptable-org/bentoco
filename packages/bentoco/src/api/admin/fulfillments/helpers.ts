import { MedusaContainer } from "@bentoco/framework/types"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@bentoco/framework/utils"

export const refetchFulfillment = async (
  fulfillmentId: string,
  scope: MedusaContainer,
  fields: string[]
) => {
  const remoteQuery = scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const queryObject = remoteQueryObjectFromString({
    entryPoint: "fulfillments",
    variables: {
      filters: { id: fulfillmentId },
    },
    fields: fields,
  })

  const [fulfillment] = await remoteQuery(queryObject)

  return fulfillment
}
