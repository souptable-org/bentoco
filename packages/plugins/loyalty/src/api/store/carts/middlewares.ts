import {
  authenticate,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@bentoco/framework";
import { MiddlewareRoute } from "@bentoco/medusa";
import { StoreGetCartsCart } from "@bentoco/medusa/api/store/carts/validators";
import { retrieveTransformQueryConfig } from "./query-config";
import {
  StoreAddGiftCardToCart,
  StoreAddStoreCreditsToCart,
  StoreRemoveGiftCardFromCart,
} from "./validators";

export const storeCartMiddlewares: MiddlewareRoute[] = [
  {
    method: ["POST"],
    matcher: "/store/carts/:id/gift-cards",
    middlewares: [
      validateAndTransformBody(StoreAddGiftCardToCart),
      validateAndTransformQuery(
        StoreGetCartsCart,
        retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["DELETE"],
    matcher: "/store/carts/:id/gift-cards",
    middlewares: [
      validateAndTransformBody(StoreRemoveGiftCardFromCart),
      validateAndTransformQuery(
        StoreGetCartsCart,
        retrieveTransformQueryConfig
      ),
    ],
  },
  {
    method: ["POST"],
    matcher: "/store/carts/:id/store-credits",
    middlewares: [
      authenticate("customer", ["session", "bearer"]),
      validateAndTransformBody(StoreAddStoreCreditsToCart),
      validateAndTransformQuery(
        StoreGetCartsCart,
        retrieveTransformQueryConfig
      ),
    ],
  },
];
