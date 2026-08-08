import { markPaymentCollectionAsPaid } from "@bentoco/core-flows"
import { HttpTypes } from "@bentoco/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity,
} from "@bentoco/framework/http"

export const POST = async (
  req: AuthenticatedMedusaRequest<
    HttpTypes.AdminMarkPaymentCollectionAsPaid,
    HttpTypes.AdminGetPaymentCollectionParams
  >,
  res: MedusaResponse<HttpTypes.AdminPaymentCollectionResponse>
) => {
  const { id } = req.params

  await markPaymentCollectionAsPaid(req.scope).run({
    input: {
      ...req.body,
      payment_collection_id: id,
      captured_by: req.auth_context.actor_id,
    },
  })

  const paymentCollection = await refetchEntity({
    entity: "payment_collection",
    idOrFilter: id,
    scope: req.scope,
    fields: req.queryConfig.fields,
  })

  res.status(200).json({ payment_collection: paymentCollection })
}
