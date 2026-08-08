import { ModuleProvider, Modules } from "@bentoco/framework/utils"
import { AccountHolderPaymentProvider } from "./services/account-holder-payment"

const services = [AccountHolderPaymentProvider]

export default ModuleProvider(Modules.PAYMENT, {
  services,
})
