import {
  WorkflowData,
  WorkflowResponse,
  createWorkflow,
} from "@bentoco/framework/workflows-sdk"
import { UpdateRbacPolicyDTO } from "@bentoco/types"
import { updateRbacPoliciesStep } from "../steps/update-rbac-policies"

/**
 * @ignore
 * @featureFlag rbac
 */
export type UpdateRbacPoliciesWorkflowInput = {
  selector: Record<string, any>
  update: Omit<UpdateRbacPolicyDTO, "id">
}

/**
 * @ignore
 * @featureFlag rbac
 */
export const updateRbacPoliciesWorkflowId = "update-rbac-policies"

/**
 * @ignore
 * @featureFlag rbac
 */
export const updateRbacPoliciesWorkflow = createWorkflow(
  updateRbacPoliciesWorkflowId,
  (input: WorkflowData<UpdateRbacPoliciesWorkflowInput>) => {
    return new WorkflowResponse(updateRbacPoliciesStep(input))
  }
)
