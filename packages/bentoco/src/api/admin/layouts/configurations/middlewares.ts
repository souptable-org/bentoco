import { validateAndTransformQuery } from "@bentoco/framework"
import { MiddlewareRoute } from "@bentoco/framework/http"
import * as QueryConfig from "./query-config"
import { AdminGetLayoutConfigurationsParams } from "./validators"

export const layoutConfigurationListRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/layouts/configurations",
    middlewares: [
      validateAndTransformQuery(
        AdminGetLayoutConfigurationsParams,
        QueryConfig.retrieveLayoutConfigurationList
      ),
    ],
  },
]
