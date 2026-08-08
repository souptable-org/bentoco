import type { IFulfillmentModuleService } from "@bentoco/framework/types"
import { Modules } from "@bentoco/framework/utils"
import { StepResponse, createStep } from "@bentoco/framework/workflows-sdk"

/**
 * The IDs of the shipping profiles to delete.
 */
export type DeleteShippingProfilesStepInput = string[]

export const deleteShippingProfilesStepId = "delete-shipping-profile"
/**
 * This step deletes one or more shipping profiles.
 */
export const deleteShippingProfilesStep = createStep(
  deleteShippingProfilesStepId,
  async (ids: DeleteShippingProfilesStepInput, { container }) => {
    const service = container.resolve<IFulfillmentModuleService>(
      Modules.FULFILLMENT
    )

    await service.softDeleteShippingProfiles(ids)

    return new StepResponse(void 0, ids)
  },
  async (prevIds, { container }) => {
    if (!prevIds?.length) {
      return
    }

    const service = container.resolve<IFulfillmentModuleService>(
      Modules.FULFILLMENT
    )

    await service.restoreShippingProfiles(prevIds)
  }
)
