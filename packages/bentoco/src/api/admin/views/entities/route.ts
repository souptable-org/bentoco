import { HttpTypes, SettingsTypes } from "@bentoco/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@bentoco/framework/http"
import { Modules } from "@bentoco/framework/utils"

/**
 * List all available entities that can be used for view configurations.
 * Entities are discovered from joiner configs (GraphQL schema).
 *
 * @since 2.10.3
 * @featureFlag view_configurations
 */
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminEntityListResponse>
) => {
  const settingsService =
    req.scope.resolve<SettingsTypes.ISettingsModuleService>(Modules.SETTINGS)

  const entities = await settingsService.listDiscoverableEntities()

  entities.sort((a, b) => a.name.localeCompare(b.name))

  return res.json({
    entities,
  })
}
