import { MiddlewareRoute } from "@bentoco/framework/http"

export const storeLocalesRoutesMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/store/locales",
    middlewares: [],
  },
]
