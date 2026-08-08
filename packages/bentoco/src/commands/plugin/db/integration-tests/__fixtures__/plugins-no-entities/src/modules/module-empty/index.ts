import { MedusaService, Module } from "@bentoco/framework/utils"

export default Module("moduleEmpty", {
  service: class ModuleEmptyService extends MedusaService({}) {},
})

