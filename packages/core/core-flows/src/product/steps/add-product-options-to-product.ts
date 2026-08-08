import type {
  IProductModuleService,
  ProductTypes,
} from "@bentoco/framework/types"
import { Modules } from "@bentoco/framework/utils"
import { StepResponse, createStep } from "@bentoco/framework/workflows-sdk"

/**
 * The data to add one or more product options to products.
 */
export type AddProductOptionsToProductStepInput =
  ProductTypes.ProductOptionProductPair[]

export const addProductOptionsToProductStepId = "add-product-options-to-product"
/**
 * This step adds product options to products.
 */
export const addProductOptionsToProductStep = createStep(
  addProductOptionsToProductStepId,
  async (pairs: AddProductOptionsToProductStepInput, { container }) => {
    if (!pairs.length) {
      return new StepResponse(void 0, [])
    }

    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)

    await service.addProductOptionToProduct(pairs)

    return new StepResponse(void 0, pairs)
  },
  async (pairs: AddProductOptionsToProductStepInput | void, { container }) => {
    if (!pairs?.length) {
      return
    }

    const service = container.resolve<IProductModuleService>(Modules.PRODUCT)

    await service.removeProductOptionFromProduct(pairs)
  }
)
