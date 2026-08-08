import {
  MiddlewareRoute,
  validateAndTransformBody,
} from "@bentoco/framework/http"
import { z } from "@bentoco/framework/zod"

const PostBody = z.object({
  tenant_id: z.string().optional(),
  key_id: z.string().min(1),
  key_secret: z.string().min(1),
  webhook_secret: z.string().optional(),
  business_name: z.string().optional(),
  test_connection: z.boolean().optional(),
})

export const adminByogRazorpayMiddlewares: MiddlewareRoute[] = [
  {
    method: ["GET"],
    matcher: "/admin/byog/razorpay",
    middlewares: [],
  },
  {
    method: ["POST"],
    matcher: "/admin/byog/razorpay",
    middlewares: [validateAndTransformBody(PostBody)],
  },
]
