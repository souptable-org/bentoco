import { defineJoinerConfig, Modules } from "@bentoco/framework/utils"
import { AuthIdentity, ProviderIdentity } from "@models"

export const joinerConfig = defineJoinerConfig(Modules.AUTH, {
  models: [AuthIdentity, ProviderIdentity],
})
