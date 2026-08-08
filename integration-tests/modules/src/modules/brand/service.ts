import { MedusaService } from "@bentoco/utils"
import { Brand } from "./models/brand"

export class BrandModuleService extends MedusaService({
  Brand,
}) {}
