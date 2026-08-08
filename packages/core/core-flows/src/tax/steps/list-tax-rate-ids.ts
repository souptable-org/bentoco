import {
  FilterableTaxRateProps,
  ITaxModuleService,
} from "@bentoco/framework/types"
import { Modules } from "@bentoco/framework/utils"
import { StepResponse, createStep } from "@bentoco/framework/workflows-sdk"

/**
 * The data to retrieve the tax rate IDs.
 */
export type ListTaxRateIdsStepInput = {
  /**
   * The filters to select the tax rates.
   */
  selector: FilterableTaxRateProps
}

export const listTaxRateIdsStepId = "list-tax-rate-ids"
/**
 * This step retrieves the IDs of tax rates matching the specified filters.
 * 
 * @example
 * const data = listTaxRateIdsStep({
 *   selector: {
 *     tax_region_id: "txreg_123"
 *   }
 * })
 */
export const listTaxRateIdsStep = createStep(
  listTaxRateIdsStepId,
  async (input: ListTaxRateIdsStepInput, { container }) => {
    const service = container.resolve<ITaxModuleService>(Modules.TAX)

    const rates = await service.listTaxRates(input.selector, {
      select: ["id"],
    })

    return new StepResponse(rates.map((r) => r.id))
  }
)
