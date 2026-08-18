import { isInternalGovPath, isPathInside, matchAnyGlob } from '../paths.mjs';
import { findStage, parsePlan } from '../plan.mjs';
import { allowResult, denyResult } from './result.mjs';

const OUT_OF_SCOPE_MESSAGE = 'This file is outside the scope of the current implementation stage.\n\nUpdate the plan and request approval again if this change is required.';

function requiresStages(classification) {
  return classification === 'PLAN_REQUIRED' || classification === 'HIGH_RISK';
}

export function evaluateStagePathGuard({
  relPath,
  absPath,
  pluginRoot,
  classification,
  planMarkdown,
  progress,
}) {
  if (isInternalGovPath(relPath)) return allowResult();
  if (pluginRoot && absPath && isPathInside(absPath, pluginRoot)) return allowResult();
  if (!requiresStages(classification) && progress?.currentStage == null) return allowResult();

  if (progress?.currentStage == null) {
    const message = 'No implementation stage is active. Start the current stage with execute-approved-plan before modifying project files.';
    return denyResult({
      reason: 'no-active-stage',
      userMessage: message,
      agentMessage: message,
      event: 'WRITE_BLOCKED',
    });
  }

  const parsed = parsePlan(planMarkdown);
  if (!parsed.ok) {
    const message = 'The plan is missing a valid stages JSON block. Update the plan and request approval again.';
    return denyResult({
      reason: parsed.error,
      userMessage: message,
      agentMessage: message,
      event: 'WRITE_BLOCKED',
    });
  }

  const stage = findStage(parsed.plan, progress.currentStage);
  if (!stage) {
    const message = `Stage ${progress.currentStage} is not defined in the plan.`;
    return denyResult({
      reason: 'unknown-stage',
      userMessage: message,
      agentMessage: message,
      event: 'WRITE_BLOCKED',
    });
  }

  const status = progress.stageStatus?.[String(progress.currentStage)];
  if (status && status !== 'IN_PROGRESS' && status !== 'VERIFYING') {
    const message = `Stage ${progress.currentStage} is ${status}. It is not open for implementation.`;
    return denyResult({
      reason: 'stage-not-active',
      userMessage: message,
      agentMessage: message,
      event: 'WRITE_BLOCKED',
    });
  }

  if (!matchAnyGlob(relPath, stage.allowed_paths)) {
    return denyResult({
      reason: 'path-outside-stage',
      userMessage: OUT_OF_SCOPE_MESSAGE,
      agentMessage: OUT_OF_SCOPE_MESSAGE,
      event: 'WRITE_BLOCKED',
    });
  }

  return allowResult();
}
