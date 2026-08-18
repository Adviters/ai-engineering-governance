import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { evaluateFileThresholdGuard } from '../scripts/lib/guards/file-threshold-guard.mjs';

describe('file-threshold-guard', () => {
  it('allows SIMPLE writes within the threshold', () => {
    const first = evaluateFileThresholdGuard({
      relPath: 'src/a.ts',
      classification: 'SIMPLE',
      modifiedFiles: [],
      planRequiredFileThreshold: 2,
    });
    const second = evaluateFileThresholdGuard({
      relPath: 'src/b.ts',
      classification: 'SIMPLE',
      modifiedFiles: ['src/a.ts'],
      planRequiredFileThreshold: 2,
    });
    const same = evaluateFileThresholdGuard({
      relPath: 'src/a.ts',
      classification: 'SIMPLE',
      modifiedFiles: ['src/a.ts', 'src/b.ts'],
      planRequiredFileThreshold: 2,
    });
    assert.equal(first.allow, true);
    assert.equal(second.allow, true);
    assert.equal(same.allow, true);
  });

  it('blocks SIMPLE writes after the threshold and ignores .ai files', () => {
    const result = evaluateFileThresholdGuard({
      relPath: 'src/c.ts',
      classification: 'SIMPLE',
      modifiedFiles: ['src/a.ts', 'src/b.ts', '.ai/tasks/t1/progress.json'],
      planRequiredFileThreshold: 2,
    });
    assert.equal(result.allow, false);
    assert.equal(result.reason, 'simple-threshold-exceeded');
    assert.match(result.agentMessage, /exceeded simple-change scope/);
  });
});
