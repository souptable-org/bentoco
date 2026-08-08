import { IEventBusModuleService, Logger } from "@bentoco/framework/types"

export type InitializeModuleInjectableDependencies = {
  logger?: Logger
  EventBus?: IEventBusModuleService
}
