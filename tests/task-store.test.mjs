import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import {
  createTaskRecord,
  defaultProgress,
  ensureTaskWorkspace,
  readActiveTask,
  readApproval,
  readProgress,
  readTask,
  recordModifiedFile,
  writeProgress,
} from '../scripts/lib/task-store.mjs';

describe('task-store', () => {
  it('creates a task workspace with draft approval and empty progress', () => {
    const root = mkdtempSync(join(tmpdir(), 'aeg-store-'));
    const task = createTaskRecord({
      id: 'feat-login',
      title: 'Login',
      classification: 'SIMPLE',
      branch: 'feat/login',
    });
    ensureTaskWorkspace(root, task);

    assert.equal(readActiveTask(root).id, 'feat-login');
    assert.equal(readTask(root, 'feat-login').classification, 'SIMPLE');
    assert.equal(readApproval(root, 'feat-login').status, 'DRAFT');
    assert.deepEqual(readProgress(root, 'feat-login').modifiedFiles, []);
  });

  it('rejects path-like task ids', () => {
    assert.throws(() => createTaskRecord({
      id: '../escape',
      classification: 'SIMPLE',
    }));
  });

  it('records distinct modified files only once', () => {
    let progress = defaultProgress();
    progress = recordModifiedFile(progress, 'src/a.ts');
    progress = recordModifiedFile(progress, 'src/b.ts');
    progress = recordModifiedFile(progress, 'src/a.ts');
    assert.deepEqual(progress.modifiedFiles, ['src/a.ts', 'src/b.ts']);
  });

  it('rejects an invalid stage status', () => {
    const root = mkdtempSync(join(tmpdir(), 'aeg-store-'));
    const task = createTaskRecord({ id: 't1', classification: 'PLAN_REQUIRED' });
    ensureTaskWorkspace(root, task);
    assert.throws(() => writeProgress(root, 't1', {
      ...defaultProgress(),
      stageStatus: { 1: 'DONE' },
    }));
  });
});
