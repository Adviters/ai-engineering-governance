import { parsePlan } from './plan.mjs';

const FOLLOWUP = [
  'Governance stop check: required verification is incomplete.',
  'Do not start new implementation work.',
  'Update progress.json if needed, run the declared stage/task verification, then generate a handoff if context is large.',
  'If this follow-up already ran, stop and wait for the human.',
].join(' ');

export function evaluateStopGuard({
  status,
  loopCount = 0,
  conversationId,
  task,
  progress,
  planMarkdown,
}) {
  if (status !== 'completed') return { followup: null };
  if (!task || task.status === 'COMPLETED' || task.classification === 'READ_ONLY') {
    return { followup: null };
  }
  if (loopCount >= 2) return { followup: null };

  const stopGuard = progress?.stopGuard || {};
  if (stopGuard.conversationId === conversationId && Number(stopGuard.count || 0) >= 2) {
    return { followup: null };
  }

  const needsFollowup = hasIncompleteVerification(task, progress, planMarkdown);
  if (!needsFollowup) return { followup: null };

  return {
    followup: FOLLOWUP,
    stopGuard: {
      conversationId,
      count: stopGuard.conversationId === conversationId ? Number(stopGuard.count || 0) + 1 : 1,
    },
  };
}

function hasIncompleteVerification(task, progress, planMarkdown) {
  if (!progress) return true;
  const current = progress.currentStage;
  if (current != null) {
    const status = progress.stageStatus?.[String(current)];
    const verification = progress.verificationStatus?.[String(current)];
    if (status === 'IN_PROGRESS' || status === 'VERIFYING' || verification !== 'PASSED') return true;
  }

  if (task.classification === 'PLAN_REQUIRED' || task.classification === 'HIGH_RISK') {
    const parsed = parsePlan(planMarkdown);
    if (!parsed.ok) return true;
    const completed = new Set((progress.completedStages || []).map(String));
    return parsed.plan.stages.some((stage) => !completed.has(String(stage.id)));
  }

  return false;
}
