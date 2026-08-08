import { batchInventoryItemLevelsWorkflow } from "@bentoco/core-flows"
import { MedusaRequest, MedusaResponse } from "@bentoco/framework"
import { HttpTypes } from "@bentoco/types"

export const POST = async (
  req: MedusaRequest<HttpTypes.AdminBatchInventoryItemsLocationLevels>,
  res: MedusaResponse<HttpTypes.AdminBatchInventoryItemsLocationLevelsResponse>
) => {
  const body = req.validatedBody

  const output = await batchInventoryItemLevelsWorkflow(req.scope).run({
    input: body,
  })

  res.json({
    created: output.result.created as HttpTypes.AdminInventoryLevel[],
    updated: output.result.updated as HttpTypes.AdminInventoryLevel[],
    deleted: output.result.deleted,
  })
}
