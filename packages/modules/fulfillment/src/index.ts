import "./types"
import { FulfillmentModuleService } from "@services"
import loadProviders from "./loaders/providers"
import { Module, Modules } from "@bentoco/framework/utils"

export default Module(Modules.FULFILLMENT, {
  service: FulfillmentModuleService,
  loaders: [loadProviders],
})

// Module options types
export { FulfillmentModuleOptions } from "./types"
