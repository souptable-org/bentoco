import { HttpTypes } from "@bentoco/framework/types"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@bentoco/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@bentoco/framework/http"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminOrderChangesFilters>,
  res: MedusaResponse<HttpTypes.AdminOrderChangesResponse>
) => {
  const { id } = req.params

  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)
  const queryObject = remoteQueryObjectFromString({
    entryPoint: "order_change",
    variables: {
      filters: {
        ...req.filterableFields,
        order_id: id,
      },
    },
    fields: req.queryConfig.fields,
  })

  const order_changes = await remoteQuery(queryObject)

  res.status(200).json({ order_changes })
}
