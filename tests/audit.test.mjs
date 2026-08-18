import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { appendAudit } from '../scripts/lib/audit.mjs';
import { AUDIT_EVENTS } from '../scripts/lib/constants.mjs';

describe('audit', () => {
  it('appends a compact JSONL event without nested code or secrets', () => {
    const root = mkdtempSync(join(tmpdir(), 'aeg-audit-'));
    const ok = appendAudit(root, {
      event: AUDIT_EVENTS.WRITE_BLOCKED,
      taskId: 'feat-login',
      actor: 'hook',
      metadata: {
        path: 'src/a.ts',
        secret: undefined,
        code: { contents: 'not allowed' },
        reason: 'protected-branch',
      },
    });
    assert.equal(ok, true);
    const line = readFileSync(join(root, '.ai', 'audit.jsonl'), 'utf8').trim();
    const parsed = JSON.parse(line);
    assert.equal(parsed.event, 'WRITE_BLOCKED');
    assert.equal(parsed.taskId, 'feat-login');
    assert.equal(parsed.metadata.path, 'src/a.ts');
    assert.equal(parsed.metadata.reason, 'protected-branch');
    assert.equal(parsed.metadata.code, undefined);
    assert.ok(parsed.timestamp);
  });

  it('fails open when project root is missing', () => {
    assert.equal(appendAudit(null, { event: 'TASK_CREATED' }), false);
  });
});
