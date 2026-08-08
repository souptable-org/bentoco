import {
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@bentoco/framework"
import { MiddlewareRoute } from "@bentoco/framework/http"
import { PolicyOperation } from "@bentoco/framework/utils"
import * as QueryConfig from "./query-config"
import { Entities } from "./query-config"
import {
  AdminOrderChangeParams,
  AdminPostOrderChangesReqSchema,
} from "./validators"

export const adminOrderChangesRoutesMiddlewares: MiddlewareRoute[] = [
  {
    matcher: "/admin/order-changes/*",
    policies: [
      {
        resource: Entities.order_change,
        operation: PolicyOperation.read,
      },
    ],
  },
  {
    method: ["POST"],
    matcher: "/admin/order-changes/:id",
    middlewares: [
      validateAndTransformBody(AdminPostOrderChangesReqSchema),
      validateAndTransformQuery(
        AdminOrderChangeParams,
        QueryConfig.retrieveTransformQueryConfig
      ),
    ],
    policies: [
      {
        resource: Entities.order_change,
        operation: PolicyOperation.update,
      },
    ],
  },
]
