import ProductModule from "@bentoco/medusa/product"
import { defineLink } from "@bentoco/utils"
import Translation from "../modules/translation"

export default defineLink(
  ProductModule.linkable.productOption.id,
  Translation.linkable.translation.id
)
