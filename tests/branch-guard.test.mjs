import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { evaluateBranchGuard } from '../scripts/lib/guards/branch-guard.mjs';

const protectedBranches = ['main', 'master', 'develop', 'qa'];

describe('branch-guard', () => {
  it('blocks writes on a protected branch', () => {
    const result = evaluateBranchGuard({
      relPath: 'src/app.ts',
      branch: 'main',
      protectedBranches,
    });
    assert.equal(result.allow, false);
    assert.equal(result.reason, 'protected-branch');
    assert.match(result.agentMessage, /start-task/);
  });

  it('allows writes on a feature branch', () => {
    const result = evaluateBranchGuard({
      relPath: 'src/app.ts',
      branch: 'feat/login',
      protectedBranches,
    });
    assert.equal(result.allow, true);
  });

  it('does not discard a dirty working tree; dirty state is ignored', () => {
    const dirty = true;
    const blocked = evaluateBranchGuard({
      relPath: 'src/app.ts',
      branch: 'main',
      protectedBranches,
      dirty,
    });
    const allowed = evaluateBranchGuard({
      relPath: 'src/app.ts',
      branch: 'feat/login',
      protectedBranches,
      dirty,
    });
    assert.equal(blocked.allow, false);
    assert.equal(allowed.allow, true);
    assert.equal(allowed.dirty, true);
  });

  it('allows governance files on a protected branch', () => {
    const result = evaluateBranchGuard({
      relPath: '.ai/tasks/feat-login/task.json',
      branch: 'main',
      protectedBranches,
    });
    assert.equal(result.allow, true);
  });
});
