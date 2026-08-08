import { defineJoinerConfig, Modules } from "@bentoco/framework/utils"

export const joinerConfig = defineJoinerConfig(Modules.FILE, {
  models: [{ name: "File" }],
})
