import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { HttpTypes } from "@bentoco/framework/types"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@bentoco/framework/utils"

export const GET = async (
  req: MedusaRequest<HttpTypes.StoreReturnReasonsParams>,
  res: MedusaResponse<HttpTypes.StoreReturnReasonListResponse>
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  const queryObject = remoteQueryObjectFromString({
    entryPoint: "return_reason",
    variables: {
      filters: {
        ...req.filterableFields,
      },
      ...req.queryConfig.pagination,
    },
    fields: req.queryConfig.fields,
  })

  const { rows: return_reasons, metadata } = await remoteQuery(queryObject)

  res.json({
    return_reasons,
    count: metadata.count,
    offset: metadata.skip,
    limit: metadata.take,
  })
}
