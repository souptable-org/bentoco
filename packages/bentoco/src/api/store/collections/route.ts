import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@bentoco/framework/http"
import { HttpTypes } from "@bentoco/framework/types"

import { ContainerRegistrationKeys } from "@bentoco/framework/utils"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.StoreCollectionListParams>,
  res: MedusaResponse<HttpTypes.StoreCollectionListResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: collections, metadata } = await query.graph(
    {
      entity: "product_collection",
      filters: req.filterableFields,
      pagination: req.queryConfig.pagination,
      fields: req.queryConfig.fields,
    },
    {
      locale: req.locale,
    }
  )

  res.json({
    collections,
    count: metadata!.count,
    offset: metadata!.skip,
    limit: metadata!.take,
  })
}
