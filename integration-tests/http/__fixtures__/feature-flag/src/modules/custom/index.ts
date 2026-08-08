import { ModuleExports } from "@bentoco/types"
import { ModuleService } from "./services/module-service"

const moduleExports: ModuleExports = {
  service: ModuleService,
}

export default moduleExports
