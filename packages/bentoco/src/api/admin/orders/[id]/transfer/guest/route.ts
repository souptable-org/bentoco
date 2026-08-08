import { transferOrderToGuestWorkflow } from "@bentoco/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@bentoco/framework/http"
import { HttpTypes } from "@bentoco/framework/types"
import {
  ContainerRegistrationKeys,
  remoteQueryObjectFromString,
} from "@bentoco/framework/utils"

export const POST = async (
  req: AuthenticatedMedusaRequest<
    HttpTypes.AdminTransferOrderToGuest,
    HttpTypes.AdminGetOrderParams
  >,
  res: MedusaResponse<HttpTypes.AdminOrderResponse>
) => {
  const remoteQuery = req.scope.resolve(ContainerRegistrationKeys.REMOTE_QUERY)

  const variables = { id: req.params.id }

  await transferOrderToGuestWorkflow(req.scope).run({
    input: {
      order_id: req.params.id,
      email: req.validatedBody.email,
      logged_in_user: req.auth_context.actor_id,
      description: req.validatedBody.description,
      internal_note: req.validatedBody.internal_note,
    },
  })

  const queryObject = remoteQueryObjectFromString({
    entryPoint: "order",
    variables,
    fields: req.queryConfig.fields,
  })

  const [order] = await remoteQuery(queryObject)
  res.status(200).json({ order })
}
