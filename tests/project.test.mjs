import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getPluginRoot, getProjectRoot } from '../scripts/lib/project.mjs';

describe('project', () => {
  it('prefers CURSOR_PROJECT_DIR over the hook payload', () => {
    const previous = process.env.CURSOR_PROJECT_DIR;
    process.env.CURSOR_PROJECT_DIR = '/tmp/consumer';
    try {
      assert.equal(getProjectRoot({ workspace_roots: ['/tmp/other'] }), '/tmp/consumer');
    } finally {
      if (previous == null) delete process.env.CURSOR_PROJECT_DIR;
      else process.env.CURSOR_PROJECT_DIR = previous;
    }
  });

  it('falls back to workspace_roots and then null', () => {
    const previous = process.env.CURSOR_PROJECT_DIR;
    const previousClaude = process.env.CLAUDE_PROJECT_DIR;
    delete process.env.CURSOR_PROJECT_DIR;
    delete process.env.CLAUDE_PROJECT_DIR;
    try {
      assert.equal(getProjectRoot({ workspace_roots: ['/tmp/ws'] }), '/tmp/ws');
      assert.equal(getProjectRoot({}), null);
    } finally {
      if (previous != null) process.env.CURSOR_PROJECT_DIR = previous;
      if (previousClaude != null) process.env.CLAUDE_PROJECT_DIR = previousClaude;
    }
  });

  it('resolves plugin root from env or this repo', () => {
    const previous = process.env.CURSOR_PLUGIN_ROOT;
    process.env.CURSOR_PLUGIN_ROOT = '/plugins/aeg';
    try {
      assert.equal(getPluginRoot(), '/plugins/aeg');
    } finally {
      if (previous == null) delete process.env.CURSOR_PLUGIN_ROOT;
      else process.env.CURSOR_PLUGIN_ROOT = previous;
    }
  });
});
