import { defaultStoreCartFields } from "@bentoco/medusa/api/store/carts/query-config";

export const retrieveTransformQueryConfig = {
  defaults: [...defaultStoreCartFields, "*gift_cards"],
  isList: false,
};
