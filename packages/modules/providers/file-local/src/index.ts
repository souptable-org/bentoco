import { ModuleProvider, Modules } from "@bentoco/framework/utils"
import { LocalFileService } from "./services/local-file"
export { LocalFileService }

const services = [LocalFileService]

export default ModuleProvider(Modules.FILE, {
  services,
})
