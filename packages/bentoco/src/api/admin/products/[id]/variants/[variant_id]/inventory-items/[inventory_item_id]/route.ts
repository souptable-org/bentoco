import { dismissLinksWorkflow, updateLinksWorkflow } from "@bentoco/core-flows"
import { Modules } from "@bentoco/framework/utils"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@bentoco/framework/http"
import { refetchVariant } from "../../../../../helpers"
import { HttpTypes } from "@bentoco/framework/types"

export const POST = async (
  req: AuthenticatedMedusaRequest<
    HttpTypes.AdminUpdateVariantInventoryItem,
    HttpTypes.SelectParams
  >,
  res: MedusaResponse<HttpTypes.AdminProductVariantResponse>
) => {
  const variantId = req.params.variant_id
  const inventoryItemId = req.params.inventory_item_id

  await updateLinksWorkflow(req.scope).run({
    input: [
      {
        [Modules.PRODUCT]: { variant_id: variantId },
        [Modules.INVENTORY]: { inventory_item_id: inventoryItemId },
        data: { required_quantity: req.validatedBody.required_quantity },
      },
    ],
  })

  const variant = await refetchVariant(
    variantId,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({ variant })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest<{}, HttpTypes.SelectParams>,
  res: MedusaResponse<HttpTypes.AdminProductVariantInventoryLinkDeleteResponse>
) => {
  const variantId = req.params.variant_id
  const inventoryItemId = req.params.inventory_item_id

  const {
    result: [deleted],
  } = await dismissLinksWorkflow(req.scope).run({
    input: [
      {
        [Modules.PRODUCT]: { variant_id: variantId },
        [Modules.INVENTORY]: { inventory_item_id: inventoryItemId },
      },
    ],
  })

  const parent = await refetchVariant(
    variantId,
    req.scope,
    req.queryConfig.fields
  )

  res.status(200).json({
    id: deleted as unknown as HttpTypes.AdminProductVariantInventoryLink,
    object: "variant-inventory-item-link",
    deleted: true,
    parent,
  })
}
