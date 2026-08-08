import * as entities from "./src/models"
import { defineMikroOrmCliConfig, Modules } from "@bentoco/framework/utils"

export default defineMikroOrmCliConfig(Modules.USER, {
  entities: Object.values(entities),
})
