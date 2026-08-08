import { deleteFulfillmentSetsWorkflow } from "@bentoco/core-flows"
import { HttpTypes } from "@bentoco/framework/types"

import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@bentoco/framework/http"

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminFulfillmentSetDeleteResponse>
) => {
  const { id } = req.params

  await deleteFulfillmentSetsWorkflow(req.scope).run({
    input: { ids: [id] },
  })

  res.status(200).json({
    id,
    object: "fulfillment_set",
    deleted: true,
  })
}
