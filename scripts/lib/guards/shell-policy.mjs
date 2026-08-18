import { evaluateDangerousCommandGuard } from './dangerous-command-guard.mjs';
import { evaluateDependencyGuard } from './dependency-guard.mjs';
import { evaluateSelfApprovalGuard } from './self-approval-guard.mjs';
import { allowResult } from './result.mjs';

export function evaluateShellGuards(ctx) {
  const shellCtx = {
    ...ctx,
    extraPatterns: ctx.extraPatterns || ctx.config?.dangerousCommands || [],
  };
  const checks = [
    evaluateSelfApprovalGuard,
    evaluateDangerousCommandGuard,
    evaluateDependencyGuard,
  ];

  for (const check of checks) {
    const result = check(shellCtx);
    if (result.allow === false) return result;
  }
  return allowResult();
}
