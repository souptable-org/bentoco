import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@bentoco/framework/http"

import { addOrRemoveCampaignPromotionsWorkflow } from "@bentoco/core-flows"
import { HttpTypes } from "@bentoco/framework/types"
import { refetchCampaign } from "../../helpers"

export const POST = async (
  req: AuthenticatedMedusaRequest<
    HttpTypes.AdminBatchLink,
    HttpTypes.AdminGetCampaignParams
  >,
  res: MedusaResponse<HttpTypes.AdminCampaignResponse>
) => {
  const { id } = req.params
  const { add, remove } = req.validatedBody
  await addOrRemoveCampaignPromotionsWorkflow(req.scope).run({
    input: { id, add, remove },
  })

  const campaign = await refetchCampaign(
    req.params.id,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ campaign })
}
