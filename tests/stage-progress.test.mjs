import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  evaluateStageStart,
  markStageApproved,
  markStageStarted,
  markStageVerified,
} from '../scripts/lib/guards/stage-progress.mjs';
import { parsePlan } from '../scripts/lib/plan.mjs';

const parsed = parsePlan(`# Task\n\n\`\`\`json\n${JSON.stringify({
  stages: [
    { id: 1, allowed_paths: ['src/a/**'] },
    { id: 2, allowed_paths: ['src/b/**'] },
  ],
})}\n\`\`\`\n`);

describe('stage-progress', () => {
  it('allows starting a pending first stage', () => {
    const result = evaluateStageStart({
      plan: parsed.plan,
      progress: { stageStatus: { 1: 'PENDING' } },
      stageId: 1,
      stageApprovalMode: 'manual',
    });
    assert.equal(result.allow, true);
  });

  it('does not advance after verification until a manual stage approval exists', () => {
    let progress = markStageStarted({ stageStatus: {}, verificationStatus: {}, stageApprovals: {}, completedStages: [] }, 1);
    progress = markStageVerified(progress, 1, true);
    const result = evaluateStageStart({
      plan: parsed.plan,
      progress,
      stageId: 2,
      stageApprovalMode: 'manual',
    });
    assert.equal(result.allow, false);
    assert.equal(result.reason, 'previous-stage-not-approved');
  });

  it('allows the next stage after human approval in manual mode', () => {
    let progress = markStageStarted({ stageStatus: {}, verificationStatus: {}, stageApprovals: {}, completedStages: [] }, 1);
    progress = markStageVerified(progress, 1, true);
    progress = markStageApproved(progress, 1);
    const result = evaluateStageStart({
      plan: parsed.plan,
      progress,
      stageId: 2,
      stageApprovalMode: 'manual',
    });
    assert.equal(result.allow, true);
  });

  it('advances automatically when verification passed and mode is automatic', () => {
    let progress = markStageStarted({ stageStatus: {}, verificationStatus: {}, stageApprovals: {}, completedStages: [] }, 1);
    progress = markStageVerified(progress, 1, true);
    const result = evaluateStageStart({
      plan: parsed.plan,
      progress,
      stageId: 2,
      stageApprovalMode: 'automatic',
    });
    assert.equal(result.allow, true);
  });
});
