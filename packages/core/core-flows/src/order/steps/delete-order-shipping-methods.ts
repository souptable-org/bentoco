import type { IOrderModuleService } from "@bentoco/framework/types"
import { Modules } from "@bentoco/framework/utils"
import { StepResponse, createStep } from "@bentoco/framework/workflows-sdk"

/**
 * The details of deleting order shipping methods.
 */
export interface DeleteOrderShippingMethodsStepInput {
  /**
   * The IDs of the order shipping methods to delete.
   */
  ids: string[]
}

/**
 * This step deletes order shipping methods.
 */
export const deleteOrderShippingMethods = createStep(
  "delete-order-shipping-methods",
  async (input: DeleteOrderShippingMethodsStepInput, { container }) => {
    const service = container.resolve<IOrderModuleService>(Modules.ORDER)

    const deleted = await service.softDeleteOrderShippingMethods(input.ids)

    return new StepResponse(deleted, input.ids)
  },
  async (ids, { container }) => {
    if (!ids) {
      return
    }

    const service = container.resolve<IOrderModuleService>(Modules.ORDER)

    await service.restoreOrderShippingMethods(ids)
  }
)
