import { ModuleProvider, Modules } from "@bentoco/framework/utils"
import { PendingAuthorizationPaymentProvider } from "./provider"

const services = [PendingAuthorizationPaymentProvider]

export default ModuleProvider(Modules.PAYMENT, {
  services,
})
