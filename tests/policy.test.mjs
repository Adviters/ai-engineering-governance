import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { DEFAULT_CONFIG } from '../scripts/lib/config.mjs';
import { planHashFromContent } from '../scripts/lib/hash.mjs';
import { evaluateWriteGuards } from '../scripts/lib/guards/write-policy.mjs';
import { evaluateShellGuards } from '../scripts/lib/guards/shell-policy.mjs';

const plan = `# Task\n\n\`\`\`json\n${JSON.stringify({
  stages: [{ id: 1, allowed_paths: ['src/**'], allowsDependencyChanges: true }],
  allowsDependencyChanges: false,
})}\n\`\`\`\n`;

describe('composed policies', () => {
  it('blocks high-risk writes without an approved plan', () => {
    const result = evaluateWriteGuards({
      relPath: 'package.json',
      branch: 'feat/deps',
      protectedBranches: DEFAULT_CONFIG.protectedBranches,
      highRiskPaths: DEFAULT_CONFIG.highRiskPaths,
      classification: 'SIMPLE',
      approval: { status: 'DRAFT' },
      modifiedFiles: [],
      planRequiredFileThreshold: 2,
    });
    assert.equal(result.allow, false);
    assert.equal(result.reason, 'high-risk-unapproved');
  });

  it('blocks agent self-approval and unapproved dependency installs', () => {
    assert.equal(
      evaluateShellGuards({ command: 'node scripts/cli/approve-plan.mjs' }).allow,
      false,
    );
    assert.equal(
      evaluateShellGuards({ command: 'npm install lodash', planMarkdown: plan, progress: { currentStage: 1 } }).allow,
      true,
    );
    assert.equal(
      evaluateShellGuards({ command: 'npm install lodash', planMarkdown: plan, progress: { currentStage: null } }).allow,
      false,
    );
  });

  it('allows an approved matching plan to write an in-scope file', () => {
    const result = evaluateWriteGuards({
      relPath: 'src/app.ts',
      branch: 'feat/login',
      protectedBranches: DEFAULT_CONFIG.protectedBranches,
      highRiskPaths: DEFAULT_CONFIG.highRiskPaths,
      classification: 'PLAN_REQUIRED',
      planMarkdown: plan,
      approval: { status: 'APPROVED', planHash: planHashFromContent(plan) },
      progress: { currentStage: 1, stageStatus: { 1: 'IN_PROGRESS' } },
      modifiedFiles: [],
      planRequiredFileThreshold: 2,
    });
    assert.equal(result.allow, true);
  });
});
