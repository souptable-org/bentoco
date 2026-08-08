import {
  deletePricePreferencesWorkflow,
  updatePricePreferencesWorkflow,
} from "@bentoco/core-flows"

import { HttpTypes } from "@bentoco/framework/types"
import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
  refetchEntity,
} from "@bentoco/framework/http"

export const GET = async (
  req: AuthenticatedMedusaRequest<HttpTypes.AdminGetPricePreferenceParams>,
  res: MedusaResponse<HttpTypes.AdminPricePreferenceResponse>
) => {
  const price_preference = await refetchEntity({
    entity: "price_preference",
    idOrFilter: req.params.id,
    scope: req.scope,
    fields: req.queryConfig.fields,
  })

  res.status(200).json({ price_preference })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<
    HttpTypes.AdminUpdatePricePreference,
    HttpTypes.AdminGetPricePreferenceParams
  >,
  res: MedusaResponse<HttpTypes.AdminPricePreferenceResponse>
) => {
  const id = req.params.id
  const workflow = updatePricePreferencesWorkflow(req.scope)

  await workflow.run({
    input: { selector: { id: [id] }, update: req.body },
  })

  const price_preference = await refetchEntity({
    entity: "price_preference",
    idOrFilter: id,
    scope: req.scope,
    fields: req.queryConfig.fields,
  })

  res.status(200).json({ price_preference })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse<HttpTypes.AdminPricePreferenceDeleteResponse>
) => {
  const id = req.params.id
  const workflow = deletePricePreferencesWorkflow(req.scope)

  await workflow.run({
    input: [id],
  })

  res.status(200).json({
    id,
    object: "price_preference",
    deleted: true,
  })
}
