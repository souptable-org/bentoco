import { createSelectParams } from "@bentoco/medusa/api/utils/validators";
import { z } from "@bentoco/framework/zod";

export type StoreGetGiftCardsParamsType = z.infer<
  typeof StoreGetGiftCardParams
>;
export const StoreGetGiftCardParams = createSelectParams();

export type StoreRedeemGiftCardType = z.infer<typeof StoreRedeemGiftCard>;
export const StoreRedeemGiftCard = z.strictObject({});
