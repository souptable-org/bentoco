import { MedusaService, Module } from "@bentoco/framework/utils"

export default Module("module1", {
  service: class Module1Service extends MedusaService({}) {},
})

