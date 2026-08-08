import type { ITaxModuleService } from "@bentoco/framework/types"
import { Modules } from "@bentoco/framework/utils"
import { createStep, StepResponse } from "@bentoco/framework/workflows-sdk"

/**
 * The IDs of the tax rates to delete.
 */
export type DeleteTaxRatesStepInput = string[]

export const deleteTaxRatesStepId = "delete-tax-rates"
/**
 * This step deletes one or more tax rates.
 */
export const deleteTaxRatesStep = createStep(
  deleteTaxRatesStepId,
  async (ids: DeleteTaxRatesStepInput, { container }) => {
    const service = container.resolve<ITaxModuleService>(Modules.TAX)

    await service.softDeleteTaxRates(ids)

    return new StepResponse(void 0, ids)
  },
  async (prevIds, { container }) => {
    if (!prevIds?.length) {
      return
    }

    const service = container.resolve<ITaxModuleService>(Modules.TAX)

    await service.restoreTaxRates(prevIds)
  }
)
