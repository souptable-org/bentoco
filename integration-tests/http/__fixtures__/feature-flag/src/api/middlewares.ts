import {
  defineMiddlewares,
  validateAndTransformBody,
} from "@bentoco/framework/http"
import { z } from "@bentoco/framework/zod"

const CustomPostSchema = z.object({
  foo: z.string(),
})

export default defineMiddlewares({
  routes: [
    {
      method: ["POST"],
      matcher: "/custom",
      middlewares: [validateAndTransformBody(CustomPostSchema)],
    },
  ],
})
