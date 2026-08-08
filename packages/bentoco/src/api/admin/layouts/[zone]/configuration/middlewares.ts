import { validateAndTransformBody } from "@bentoco/framework"
import { MiddlewareRoute } from "@bentoco/framework/http"
import { AdminSetLayoutConfiguration } from "./validators"

export const layoutConfigurationRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/admin/layouts/:zone/configuration",
    middlewares: [validateAndTransformBody(AdminSetLayoutConfiguration)],
  },
]
