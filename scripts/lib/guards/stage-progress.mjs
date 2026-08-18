import { findStage, previousStageId } from '../plan.mjs';
import { allowResult, denyResult } from './result.mjs';

function statusOf(map, stageId, fallback = 'PENDING') {
  if (!map) return fallback;
  return map[String(stageId)] || fallback;
}

export function evaluateStageStart({ plan, progress, stageId, stageApprovalMode = 'manual' }) {
  const stage = findStage(plan, stageId);
  if (!stage) {
    return denyResult({
      reason: 'unknown-stage',
      userMessage: `Stage ${stageId} is not defined in the plan.`,
      agentMessage: `Stage ${stageId} is not defined in the plan.`,
    });
  }

  const current = statusOf(progress?.stageStatus, stageId);
  if (current === 'IN_PROGRESS') return allowResult();
  if (current === 'PASSED') {
    return denyResult({
      reason: 'stage-already-completed',
      userMessage: `Stage ${stageId} is already completed.`,
      agentMessage: `Stage ${stageId} is already completed.`,
    });
  }

  const previousId = previousStageId(plan, stageId);
  if (previousId != null) {
    const previousStatus = statusOf(progress?.stageStatus, previousId);
    const previousVerification = statusOf(progress?.verificationStatus, previousId);
    if (previousStatus !== 'PASSED' || previousVerification !== 'PASSED') {
      return denyResult({
        reason: 'previous-stage-incomplete',
        userMessage: `Stage ${previousId} is not verified. Complete and verify it before starting stage ${stageId}.`,
        agentMessage: `Stage ${previousId} is not verified. Complete and verify it before starting stage ${stageId}.`,
      });
    }

    if (stageApprovalMode === 'manual' && progress?.stageApprovals?.[String(previousId)] !== true) {
      return denyResult({
        reason: 'previous-stage-not-approved',
        userMessage: `Stage ${previousId} is waiting for human stage approval before the next stage can start.`,
        agentMessage: `Stage ${previousId} is waiting for human stage approval before the next stage can start.`,
      });
    }
  }

  return allowResult();
}

export function markStageStarted(progress, stageId) {
  const key = String(stageId);
  return {
    ...progress,
    currentStage: stageId,
    stageStatus: { ...(progress.stageStatus || {}), [key]: 'IN_PROGRESS' },
    verificationStatus: { ...(progress.verificationStatus || {}), [key]: progress.verificationStatus?.[key] || 'PENDING' },
  };
}

export function markStageVerified(progress, stageId, passed) {
  const key = String(stageId);
  return {
    ...progress,
    stageStatus: { ...(progress.stageStatus || {}), [key]: passed ? 'PASSED' : 'BLOCKED' },
    verificationStatus: { ...(progress.verificationStatus || {}), [key]: passed ? 'PASSED' : 'BLOCKED' },
    completedStages: passed
      ? Array.from(new Set([...(progress.completedStages || []), stageId]))
      : progress.completedStages || [],
  };
}

export function markStageApproved(progress, stageId) {
  const key = String(stageId);
  return {
    ...progress,
    stageApprovals: { ...(progress.stageApprovals || {}), [key]: true },
  };
}
