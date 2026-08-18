import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { extractWritePath, isWriteTool } from '../scripts/lib/tool-input.mjs';
import { evaluateStopGuard } from '../scripts/lib/stop-guard.mjs';
import { handlePreCompact } from '../scripts/hooks/pre-compact.mjs';

describe('tool-input', () => {
  it('extracts write paths from known tool input fields', () => {
    assert.equal(extractWritePath({ path: 'src/a.ts' }), 'src/a.ts');
    assert.equal(extractWritePath({ file_path: 'src/b.ts' }), 'src/b.ts');
    assert.equal(isWriteTool('StrReplace'), true);
    assert.equal(isWriteTool('Read'), false);
  });
});

describe('stop-guard', () => {
  it('asks for verification once and then stops looping', () => {
    const task = { classification: 'SIMPLE', status: 'IN_PROGRESS' };
    const progress = { currentStage: 1, stageStatus: { 1: 'IN_PROGRESS' }, verificationStatus: { 1: 'PENDING' } };
    const first = evaluateStopGuard({
      status: 'completed',
      loopCount: 0,
      conversationId: 'c1',
      task,
      progress,
      planMarkdown: null,
    });
    assert.ok(first.followup);
    const second = evaluateStopGuard({
      status: 'completed',
      loopCount: 0,
      conversationId: 'c1',
      task,
      progress: { ...progress, stopGuard: { conversationId: 'c1', count: 2 } },
      planMarkdown: null,
    });
    assert.equal(second.followup, null);
  });
});

describe('pre-compact', () => {
  it('warns on high usage and stays quiet on low usage', () => {
    assert.equal(handlePreCompact({ context_usage_percent: 40 }).user_message, undefined);
    assert.ok(handlePreCompact({ context_usage_percent: 90 }).user_message);
  });
});
