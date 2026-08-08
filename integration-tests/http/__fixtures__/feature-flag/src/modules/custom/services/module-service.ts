import { IModuleService } from "@bentoco/types"
import { MedusaContext } from "@bentoco/utils"

// @ts-expect-error
export class ModuleService implements IModuleService {
  public property = "value"

  constructor() {}
  async methodName(input, @MedusaContext() context) {
    return input + " called"
  }
}
