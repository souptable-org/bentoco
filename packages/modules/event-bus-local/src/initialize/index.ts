import { MedusaModule } from "@bentoco/framework/modules-sdk"
import { IEventBusService } from "@bentoco/framework/types"
import { Modules } from "@bentoco/framework/utils"

export const initialize = async (): Promise<IEventBusService> => {
  const serviceKey = Modules.EVENT_BUS
  const loaded = await MedusaModule.bootstrap<IEventBusService>({
    moduleKey: serviceKey,
    defaultPath: "@bentoco/event-bus-local",
  })

  return loaded[serviceKey]
}
