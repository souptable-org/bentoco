import { ContainerLike } from "@bentoco/framework"
import { Logger } from "@bentoco/framework/types"
import { FlowCancelOptions } from "@bentoco/framework/workflows-sdk"

export type InitializeModuleInjectableDependencies = {
  logger?: Logger
}

export type WorkflowOrchestratorCancelOptions = Omit<
  FlowCancelOptions,
  "transaction" | "transactionId" | "container"
> & {
  transactionId: string
  container?: ContainerLike
}
