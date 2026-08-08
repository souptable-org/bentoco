import { MedusaService, Module } from "@bentoco/framework/utils"

export default Module("module2", {
  service: class Module2Service extends MedusaService({}) {},
})

