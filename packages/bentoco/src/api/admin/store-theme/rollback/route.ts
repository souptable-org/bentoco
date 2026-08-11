import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@bentoco/framework/http"
import { MedusaError } from "@bentoco/framework/utils"
import {
  rollbackTenantTheme,
} from "../../../../utils/theme-engine"
import { resolveAdminThemeTenantId } from "../route"

export const POST = async (
  req: AuthenticatedMedusaRequest<{ tenant_id?: string }>,
  res: MedusaResponse
) => {
  const body = (req.validatedBody || req.body || {}) as { tenant_id?: string }
  const tenantId = resolveAdminThemeTenantId(req, body.tenant_id)

  try {
    const payload = await rollbackTenantTheme(tenantId)
    res.status(200).json(payload)
  } catch (err: any) {
    throw new MedusaError(
      MedusaError.Types.UNEXPECTED_STATE,
      err?.message || "Failed to rollback theme"
    )
  }
}
