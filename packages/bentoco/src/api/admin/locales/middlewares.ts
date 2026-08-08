import { validateAndTransformQuery } from "@bentoco/framework"
import { MiddlewareRoute } from "@bentoco/framework/http"
import { PolicyOperation } from "@bentoco/framework/utils"
import * as QueryConfig from "./query-config"
import { Entities } from "./query-config"
import { AdminGetLocaleParams, AdminGetLocalesParams } from "./validators"

export const adminLocalesRoutesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/locales/*",
    policies: [
      {
        resource: Entities.store_locale,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/locales",
    middlewares: [
      validateAndTransformQuery(
        AdminGetLocalesParams,
        QueryConfig.listTransformQueryConfig
      ),
    ],
    policies: [
      {
        resource: Entities.store_locale,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["GET"],
    matcher: "/admin/locales/:code",
    middlewares: [
      validateAndTransformQuery(
        AdminGetLocaleParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
  },
]
