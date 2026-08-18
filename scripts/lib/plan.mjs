export function parsePlan(markdown) {
  if (markdown == null || String(markdown).trim() === '') {
    return { ok: false, error: 'MISSING_PLAN' };
  }

  const fence = /```json\s*([\s\S]*?)```/i;
  const match = String(markdown).match(fence);
  if (!match) {
    return { ok: false, error: 'MISSING_STAGES_JSON' };
  }

  let data;
  try {
    data = JSON.parse(match[1]);
  } catch {
    return { ok: false, error: 'INVALID_STAGES_JSON' };
  }

  if (!data || typeof data !== 'object' || Array.isArray(data) || !Array.isArray(data.stages) || data.stages.length === 0) {
    return { ok: false, error: 'NO_STAGES' };
  }

  const stages = [];
  for (const stage of data.stages) {
    if (stage == null || typeof stage !== 'object') {
      return { ok: false, error: 'INVALID_STAGE' };
    }
    if (stage.id == null || String(stage.id).trim() === '') {
      return { ok: false, error: 'STAGE_MISSING_ID' };
    }
    if (!Array.isArray(stage.allowed_paths)) {
      return { ok: false, error: 'STAGE_MISSING_ALLOWED_PATHS' };
    }
    stages.push({
      id: stage.id,
      objective: stage.objective || '',
      allowed_paths: stage.allowed_paths.slice(),
      verification: Array.isArray(stage.verification) ? stage.verification.slice() : [],
      completion_criteria: stage.completion_criteria || '',
      allowsDependencyChanges: Boolean(stage.allowsDependencyChanges),
    });
  }

  return {
    ok: true,
    plan: {
      allowsDependencyChanges: Boolean(data.allowsDependencyChanges),
      stages,
    },
  };
}

export function findStage(plan, stageId) {
  if (!plan?.stages || stageId == null) return null;
  const key = String(stageId);
  return plan.stages.find((stage) => String(stage.id) === key) || null;
}

export function previousStageId(plan, stageId) {
  if (!plan?.stages) return null;
  const index = plan.stages.findIndex((stage) => String(stage.id) === String(stageId));
  if (index <= 0) return null;
  return plan.stages[index - 1].id;
}
