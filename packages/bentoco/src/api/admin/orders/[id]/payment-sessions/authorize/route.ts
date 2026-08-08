import {
  authorizePaymentSessionForOrderWorkflow,
  getOrderDetailWorkflow,
} from "@bentoco/core-flows"
import { HttpTypes } from "@bentoco/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@bentoco/framework/http"

/**
 * @since 2.17.0
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminAuthorizeOrderPaymentSession>,
  res: MedusaResponse<HttpTypes.AdminAuthorizeOrderPaymentSessionResponse>
) => {
  const { id } = req.params
  const { payment_session_id } = req.validatedBody

  const { result: payment } = await authorizePaymentSessionForOrderWorkflow(
    req.scope
  ).run({
    input: { payment_session_id },
  })

  const order = await getOrderDetailWorkflow(req.scope).run({
    input: { order_id: id, fields: req.queryConfig.fields },
  })

  res.status(200).json({
    order: order.result as HttpTypes.AdminOrder,
    is_authorized: !!payment,
  })
}
