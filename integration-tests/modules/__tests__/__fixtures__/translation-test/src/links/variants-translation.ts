import ProductModule from "@bentoco/medusa/product"
import { defineLink } from "@bentoco/utils"
import Translation from "../modules/translation"

export default defineLink(
  ProductModule.linkable.productVariant.id,
  Translation.linkable.translation.id
)
