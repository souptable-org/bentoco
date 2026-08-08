import { defineLink } from "@bentoco/framework/utils"
import ProductModule from "@bentoco/medusa/product"
import Translation from "../modules/translation"

export default defineLink(
  ProductModule.linkable.product.id,
  Translation.linkable.translation.id
)
