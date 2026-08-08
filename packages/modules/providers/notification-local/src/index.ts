import { ModuleProvider, Modules } from "@bentoco/framework/utils"
import { LocalNotificationService } from "./services/local"

const services = [LocalNotificationService]

export default ModuleProvider(Modules.NOTIFICATION, {
  services,
})
