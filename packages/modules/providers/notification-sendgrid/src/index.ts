import { ModuleProvider, Modules } from "@bentoco/framework/utils"
import { SendgridNotificationService } from "./services/sendgrid"

const services = [SendgridNotificationService]

export default ModuleProvider(Modules.NOTIFICATION, {
  services,
})
