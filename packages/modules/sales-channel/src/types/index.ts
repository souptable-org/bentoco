import { Logger, UpdateSalesChannelDTO } from "@bentoco/framework/types"

export type InitializeModuleInjectableDependencies = {
  logger?: Logger
}

export type UpdateSalesChanneInput = UpdateSalesChannelDTO & { id: string }
