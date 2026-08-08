import { createAndCompleteReturnOrderWorkflow } from "@bentoco/core-flows"
import { MedusaRequest, MedusaResponse } from "@bentoco/framework/http"
import { HttpTypes } from "@bentoco/framework/types"

/**
 * @since 2.8.0
 */
export const POST = async (
  req: MedusaRequest<HttpTypes.StoreCreateReturn>,
  res: MedusaResponse<HttpTypes.StoreReturnResponse>
) => {
  const input = req.validatedBody as HttpTypes.StoreCreateReturn

  const workflow = createAndCompleteReturnOrderWorkflow(req.scope)
  const { result } = await workflow.run({
    input,
  })

  res.status(200).json({ return: result as HttpTypes.StoreReturn })
}
