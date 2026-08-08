import {
  MiddlewareRoute,
  validateAndTransformBody,
} from "@bentoco/framework/http"
import { z } from "@bentoco/framework/zod"

const CreateOrderBody = z.object({
  cart_id: z.string().min(1),
  tenant_id: z.string().optional(),
})

const ConfirmBody = z.object({
  cart_id: z.string().min(1),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  tenant_id: z.string().optional(),
})

export const storeRazorpayMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/store/razorpay/create-order",
    middlewares: [validateAndTransformBody(CreateOrderBody)],
  },
  {
    method: ["POST"],
    matcher: "/store/razorpay/confirm",
    middlewares: [validateAndTransformBody(ConfirmBody)],
  },
]
