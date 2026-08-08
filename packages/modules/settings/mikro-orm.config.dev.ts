import * as entities from "./src/models"
import { defineMikroOrmCliConfig, Modules } from "@bentoco/framework/utils"

export default defineMikroOrmCliConfig(Modules.SETTINGS, {
  entities: Object.values(entities),
})
