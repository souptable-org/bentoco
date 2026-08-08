import { ModuleProvider, Modules } from "@bentoco/framework/utils"
import { LocalAnalyticsService } from "./services/local-analytics"

const services = [LocalAnalyticsService]

export default ModuleProvider(Modules.ANALYTICS, {
  services,
})
