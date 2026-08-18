import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { evaluateStagePathGuard } from '../scripts/lib/guards/stage-path-guard.mjs';

const plan = `# Task\n\n\`\`\`json\n${JSON.stringify({
  stages: [
    { id: 1, allowed_paths: ['src/auth/**'] },
    { id: 2, allowed_paths: ['src/ui/**'] },
  ],
})}\n\`\`\`\n`;

describe('stage-path-guard', () => {
  it('allows a path inside the current stage', () => {
    const result = evaluateStagePathGuard({
      relPath: 'src/auth/login.ts',
      classification: 'PLAN_REQUIRED',
      planMarkdown: plan,
      progress: { currentStage: 1, stageStatus: { 1: 'IN_PROGRESS' } },
    });
    assert.equal(result.allow, true);
  });

  it('blocks a path outside the current stage', () => {
    const result = evaluateStagePathGuard({
      relPath: 'src/ui/button.ts',
      classification: 'PLAN_REQUIRED',
      planMarkdown: plan,
      progress: { currentStage: 1, stageStatus: { 1: 'IN_PROGRESS' } },
    });
    assert.equal(result.allow, false);
    assert.equal(result.reason, 'path-outside-stage');
  });

  it('allows internal .ai paths even when they are not in allowed_paths', () => {
    const result = evaluateStagePathGuard({
      relPath: '.ai/tasks/feat-login/progress.json',
      classification: 'PLAN_REQUIRED',
      planMarkdown: plan,
      progress: { currentStage: 1, stageStatus: { 1: 'IN_PROGRESS' } },
    });
    assert.equal(result.allow, true);
  });
});
