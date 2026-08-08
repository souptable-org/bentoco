import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@bentoco/framework/http"
import { HttpTypes } from "@bentoco/framework/types"
import { MedusaError } from "@bentoco/framework/utils"
import { importProductsWorkflow } from "@bentoco/core-flows"

/**
 * @deprecated use `POST /admin/products/imports` instead.
 */
export const POST = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminImportProductRequest>,
  res: MedusaResponse<HttpTypes.AdminImportProductResponse>
) => {
  const input = req.file as Express.Multer.File

  if (!input) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "No file was uploaded for importing"
    )
  }

  const { result, transaction } = await importProductsWorkflow(req.scope).run({
    input: {
      filename: input.originalname,
      fileContent: input.buffer.toString("utf-8"),
    },
  })

  res
    .status(202)
    .json({ transaction_id: transaction.transactionId, summary: result })
}
