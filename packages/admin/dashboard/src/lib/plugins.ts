import { HttpTypes } from "@bentoco/types"

export const LOYALTY_PLUGIN_NAME = "@bentoco/loyalty-plugin"

export const getLoyaltyPlugin = (plugins: HttpTypes.AdminPlugin[]) => {
  return plugins?.find((plugin) => plugin.name === LOYALTY_PLUGIN_NAME)
}
