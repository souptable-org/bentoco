import {
  MedusaContainer,
  PaymentCollectionDTO,
} from "@bentoco/framework/types"
import { refetchEntity } from "@bentoco/framework/http"

export const refetchPaymentCollection = async (
  id: string,
  scope: MedusaContainer,
  fields: string[]
): Promise<PaymentCollectionDTO> => {
  return refetchEntity({
    entity: "payment_collection",
    idOrFilter: id,
    scope,
    fields,
  })
}
