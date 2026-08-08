import { requestDraftOrderEditWorkflow } from "@bentoco/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@bentoco/framework/http"
import { HttpTypes } from "@bentoco/types"

export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { id } = req.params

  const { result } = await requestDraftOrderEditWorkflow(req.scope).run({
    input: {
      order_id: id,
      requested_by: req.auth_context.actor_id,
    },
  })

  res.json({
    draft_order_preview: result as unknown as HttpTypes.AdminOrderPreview,
  })
}
