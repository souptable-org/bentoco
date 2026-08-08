import { HttpTypes } from "@bentoco/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@bentoco/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@bentoco/framework/http"

/**
 * @since 2.16.0
 */
export const GET = async (
  req: AuthenticatedMedusaRequest<{}, HttpTypes.SelectParams>,
  res: MedusaResponse<HttpTypes.StoreProductOptionResponse>
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "product_option",
    filters: {
      id: req.params.id,
    },
    fields: req.queryConfig.fields,
  })

  if (!data.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product option with id: ${req.params.id} was not found`
    )
  }

  res.json({ product_option: data[0] })
}
