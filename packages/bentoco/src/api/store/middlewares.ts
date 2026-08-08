import { MiddlewareRoute } from "@bentoco/framework/http"
import { storeLocalesRoutesMiddlewares } from "./locales/middlewares"
import { storeReturnsRoutesMiddlewares } from "./returns/middlewares"

export const storeRoutesMiddlewares: MiddlewareRoute[] = [
  ...storeLocalesRoutesMiddlewares,
  ...storeReturnsRoutesMiddlewares,
]
