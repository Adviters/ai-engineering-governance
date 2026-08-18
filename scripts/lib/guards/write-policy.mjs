import { evaluatePlanApprovalGuard } from './approval-guard.mjs';
import { evaluateBranchGuard } from './branch-guard.mjs';
import { evaluateFileThresholdGuard, evaluateReadOnlyGuard } from './file-threshold-guard.mjs';
import { evaluateHighRiskGuard } from './high-risk-guard.mjs';
import { evaluateStagePathGuard } from './stage-path-guard.mjs';
import { allowResult } from './result.mjs';

export function evaluateWriteGuards(ctx) {
  const checks = [
    evaluateBranchGuard,
    evaluateReadOnlyGuard,
    evaluateHighRiskGuard,
    evaluatePlanApprovalGuard,
    evaluateFileThresholdGuard,
    evaluateStagePathGuard,
  ];

  for (const check of checks) {
    const result = check(ctx);
    if (result.allow === false) return result;
  }
  return allowResult();
}
