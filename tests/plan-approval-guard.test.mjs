import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { planHashFromContent } from '../scripts/lib/hash.mjs';
import { evaluatePlanApprovalGuard } from '../scripts/lib/guards/approval-guard.mjs';

const plan = `# Task\n\nGoal: demo\n\n\`\`\`json\n${JSON.stringify({
  stages: [{ id: 1, allowed_paths: ['src/**'] }],
})}\n\`\`\`\n`;

describe('plan-approval-guard', () => {
  it('blocks implementation without a plan', () => {
    const result = evaluatePlanApprovalGuard({
      relPath: 'src/app.ts',
      classification: 'PLAN_REQUIRED',
      planMarkdown: null,
      approval: { status: 'DRAFT' },
    });
    assert.equal(result.allow, false);
    assert.equal(result.reason, 'missing-plan');
  });

  it('blocks a draft plan', () => {
    const result = evaluatePlanApprovalGuard({
      relPath: 'src/app.ts',
      classification: 'PLAN_REQUIRED',
      planMarkdown: plan,
      approval: { status: 'DRAFT', planHash: planHashFromContent(plan) },
    });
    assert.equal(result.allow, false);
    assert.equal(result.reason, 'plan-not-approved');
  });

  it('allows an approved plan with a matching hash', () => {
    const result = evaluatePlanApprovalGuard({
      relPath: 'src/app.ts',
      classification: 'PLAN_REQUIRED',
      planMarkdown: plan,
      approval: { status: 'APPROVED', planHash: planHashFromContent(plan) },
    });
    assert.equal(result.allow, true);
  });

  it('invalidates approval when the plan changes after approval', () => {
    const result = evaluatePlanApprovalGuard({
      relPath: 'src/app.ts',
      classification: 'PLAN_REQUIRED',
      planMarkdown: `${plan}\nchanged\n`,
      approval: { status: 'APPROVED', planHash: planHashFromContent(plan) },
    });
    assert.equal(result.allow, false);
    assert.equal(result.reason, 'plan-hash-mismatch');
    assert.equal(result.invalidateApproval, true);
  });

  it('does not require a plan for SIMPLE work', () => {
    const result = evaluatePlanApprovalGuard({
      relPath: 'src/app.ts',
      classification: 'SIMPLE',
      planMarkdown: null,
      approval: { status: 'DRAFT' },
    });
    assert.equal(result.allow, true);
  });
});
