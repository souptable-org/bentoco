import { batchLinkProductsToCollectionWorkflow } from "@bentoco/core-flows"
import { HttpTypes } from "@bentoco/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@bentoco/framework/http"
import { refetchCollection } from "../../helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest<
    HttpTypes.AdminBatchLink,
    HttpTypes.AdminCollectionParams
  >,
  res: MedusaResponse<HttpTypes.AdminCollectionResponse>
) => {
  const id = req.params.id
  const { add = [], remove = [] } = req.validatedBody

  const workflow = batchLinkProductsToCollectionWorkflow(req.scope)
  await workflow.run({
    input: {
      id,
      add,
      remove,
    },
  })

  const collection = await refetchCollection(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({
    collection,
  })
}
