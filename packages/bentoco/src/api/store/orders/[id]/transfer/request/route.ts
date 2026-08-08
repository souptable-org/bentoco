import {
  getOrderDetailWorkflow,
  requestOrderTransferWorkflow,
} from "@bentoco/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@bentoco/framework/http"
import { HttpTypes } from "@bentoco/framework/types"

export const POST = async (
  req: AuthenticatedMedusaRequest<
    HttpTypes.StoreRequestOrderTransfer,
    HttpTypes.SelectParams
  >,
  res: MedusaResponse<HttpTypes.StoreOrderResponse>
) => {
  const orderId = req.params.id
  const customerId = req.auth_context.actor_id

  await requestOrderTransferWorkflow(req.scope).run({
    input: {
      order_id: orderId,
      customer_id: customerId,
      logged_in_user: customerId,
      description: req.validatedBody.description,
      update_order_email: req.validatedBody.update_order_email,
    },
  })

  const { result } = await getOrderDetailWorkflow(req.scope).run({
    input: {
      fields: req.queryConfig.fields,
      order_id: orderId,
    },
  })

  res.status(200).json({ order: result as HttpTypes.StoreOrder })
}
