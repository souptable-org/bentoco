import { StoreModuleService } from "@services"
import { Module, Modules } from "@bentoco/framework/utils"

export default Module(Modules.STORE, {
  service: StoreModuleService,
})
