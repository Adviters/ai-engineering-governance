import { hashesMatch, planHashFromContent } from '../hash.mjs';
import { isInternalGovPath, isPathInside } from '../paths.mjs';
import { allowResult, denyResult } from './result.mjs';

function requiresPlan(classification) {
  return classification === 'PLAN_REQUIRED' || classification === 'HIGH_RISK';
}

export function evaluatePlanApprovalGuard({
  relPath,
  absPath,
  pluginRoot,
  classification,
  planMarkdown,
  approval,
  requirePlanApproval = true,
}) {
  if (isInternalGovPath(relPath)) return allowResult();
  if (pluginRoot && absPath && isPathInside(absPath, pluginRoot)) return allowResult();
  if (!requiresPlan(classification)) return allowResult();

  if (!planMarkdown) {
    const message = 'This task requires an implementation plan before changing project files.';
    return denyResult({
      reason: 'missing-plan',
      userMessage: message,
      agentMessage: message,
      event: 'WRITE_BLOCKED',
    });
  }

  const status = approval?.status || 'DRAFT';
  if (status === 'INVALIDATED') {
    const message = 'The plan approval is invalidated. Update the plan and request approval again.';
    return denyResult({
      reason: 'plan-invalidated',
      userMessage: message,
      agentMessage: message,
      event: 'WRITE_BLOCKED',
    });
  }

  if (requirePlanApproval && status !== 'APPROVED') {
    const message = 'The implementation plan is not approved. A human must run approve-plan before implementation.';
    return denyResult({
      reason: 'plan-not-approved',
      userMessage: message,
      agentMessage: message,
      event: 'WRITE_BLOCKED',
    });
  }

  if (requirePlanApproval || status === 'APPROVED') {
    const currentHash = planHashFromContent(planMarkdown);
    if (!hashesMatch(currentHash, approval?.planHash)) {
      const message = 'The plan changed after approval. The approval is now invalid. Request approval again.';
      return denyResult({
        reason: 'plan-hash-mismatch',
        userMessage: message,
        agentMessage: message,
        invalidateApproval: true,
        event: 'PLAN_INVALIDATED',
      });
    }
  }

  return allowResult();
}
