import { MedusaService, Module } from "@bentoco/framework/utils"

export const module1 = Module("module1", {
  service: class Module1Service extends MedusaService({}) {},
})
