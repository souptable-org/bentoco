import { model } from "@bentoco/framework/utils"

const XModel1 = model.define("x_module_model_1", {
  id: model.id().primaryKey(),
  name: model.text(),
  description: model.text().nullable(),
})

export default XModel1

