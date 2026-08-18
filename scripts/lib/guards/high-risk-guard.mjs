import { isInternalGovPath, isPathInside, matchAnyGlob } from '../paths.mjs';
import { allowResult, denyResult } from './result.mjs';

function hasApprovedPlan(approval) {
  return approval?.status === 'APPROVED' && Boolean(approval.planHash);
}

export function evaluateHighRiskGuard({
  relPath,
  absPath,
  pluginRoot,
  highRiskPaths = [],
  approval,
}) {
  if (isInternalGovPath(relPath)) return allowResult();
  if (pluginRoot && absPath && isPathInside(absPath, pluginRoot)) return allowResult();
  if (!matchAnyGlob(relPath, highRiskPaths)) return allowResult();
  if (hasApprovedPlan(approval)) return allowResult();

  const message = 'This path is high risk. Create an implementation plan and get it approved before changing it.';
  return denyResult({
    reason: 'high-risk-unapproved',
    userMessage: message,
    agentMessage: message,
    event: 'WRITE_BLOCKED',
  });
}
