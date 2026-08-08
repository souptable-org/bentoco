import { cancelOrderExchangeWorkflow } from "@bentoco/core-flows"
import { HttpTypes } from "@bentoco/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@bentoco/framework/http"
import { AdminPostCancelExchangeReqSchemaType } from "../../validators"

export const POST = async (
  req: AuthenticatedMedusaRequest<AdminPostCancelExchangeReqSchemaType>,
  res: MedusaResponse<HttpTypes.AdminExchangeResponse>
) => {
  const { id } = req.params

  const workflow = cancelOrderExchangeWorkflow(req.scope)
  const { result } = await workflow.run({
    input: {
      ...req.validatedBody,
      exchange_id: id,
      canceled_by: req.auth_context.actor_id,
    },
  })

  res.status(200).json({ exchange: result as HttpTypes.AdminExchange })
}
