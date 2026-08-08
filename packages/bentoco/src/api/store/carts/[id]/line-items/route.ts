import { addToCartWorkflowId } from "@bentoco/core-flows"
import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { HttpTypes } from "@bentoco/framework/types"
import { AdditionalData } from "@bentoco/types"
import { Modules } from "@bentoco/utils"
import { refetchCart } from "../../helpers"

export const POST = async (
  req: MedusaRequest<
    HttpTypes.StoreAddCartLineItem & AdditionalData,
    HttpTypes.SelectParams
  >,
  res: MedusaResponse<HttpTypes.StoreCartResponse>
) => {
  const we = req.scope.resolve(Modules.WORKFLOW_ENGINE)
  await we.run(addToCartWorkflowId, {
    input: {
      cart_id: req.params.id,
      items: [req.validatedBody],
      additional_data: req.validatedBody.additional_data,
    },
  })

  const cart = await refetchCart(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ cart })
}
