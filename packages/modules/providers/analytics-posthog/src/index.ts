import { ModuleProvider, Modules } from "@bentoco/framework/utils"
import { PosthogAnalyticsService } from "./services/posthog-analytics"

const services = [PosthogAnalyticsService]

export default ModuleProvider(Modules.ANALYTICS, {
  services,
})
