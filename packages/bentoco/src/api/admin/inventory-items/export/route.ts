import { exportInventoryItemsWorkflow } from "@bentoco/core-flows"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@bentoco/framework/http"
import { HttpTypes } from "@bentoco/framework/types"

export const POST = async (
  req: AuthenticatedMedusaRequest<{}, HttpTypes.AdminInventoryItemExportParams>,
  res: MedusaResponse<HttpTypes.AdminExportInventoryItemResponse>
) => {
  const input = {
    select: req.queryConfig.fields ?? [],
    filter: req.filterableFields,
  }

  const { transaction } = await exportInventoryItemsWorkflow(req.scope).run({
    input,
  })

  res.status(202).json({ transaction_id: transaction.transactionId })
}
