import { HttpTypes } from "@bentoco/framework/types"
import { Modules } from "@bentoco/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@bentoco/framework/http"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminOrderPreviewResponse>
) => {
  const { id } = req.params

  // NOTE: Consider replacing with remoteQuery when possible
  const orderModuleService = req.scope.resolve(Modules.ORDER)

  const order = (await orderModuleService.previewOrderChange(
    id
  )) as unknown as HttpTypes.AdminOrderPreview

  res.status(200).json({ order })
}
