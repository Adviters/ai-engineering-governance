import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import {
  isInternalGovPath,
  isPathInside,
  matchAnyGlob,
  matchGlob,
  toProjectRelPath,
} from '../scripts/lib/paths.mjs';

describe('paths', () => {
  it('marks .ai files as internal governance paths', () => {
    assert.equal(isInternalGovPath('.ai/config.json'), true);
    assert.equal(isInternalGovPath('.ai/tasks/abc/PLAN.md'), true);
    assert.equal(isInternalGovPath('src/index.ts'), false);
    assert.equal(isInternalGovPath('scripts/app.js'), false);
  });

  it('matches high-risk defaults without treating them as exact substrings', () => {
    assert.equal(matchGlob('.github/workflows/ci.yml', '.github/workflows/**'), true);
    assert.equal(matchGlob('migrations/001.sql', 'migrations/**'), true);
    assert.equal(matchGlob('apps/api/migrations/002.sql', '**/migrations/**'), true);
    assert.equal(matchGlob('Dockerfile', 'Dockerfile*'), true);
    assert.equal(matchGlob('backend/Dockerfile.prod', '**/Dockerfile*'), true);
    assert.equal(matchGlob('package.json', 'package.json'), true);
    assert.equal(matchGlob('apps/web/package.json', '**/package.json'), true);
    assert.equal(matchGlob('src/index.ts', 'package.json'), false);
    assert.equal(matchGlob('README.md', '.github/workflows/**'), false);
  });

  it('resolves absolute writes back to a project-relative path', () => {
    const root = resolve('/tmp/aeg-proj');
    const abs = resolve(root, 'src', 'main.ts');
    assert.equal(toProjectRelPath(root, abs), 'src/main.ts');
    assert.equal(toProjectRelPath(root, resolve('/tmp/other/secret.ts')), null);
  });

  it('detects paths inside the plugin root without using consumer folder names', () => {
    const pluginRoot = '/home/user/.cursor/plugins/local/ai-engineering-governance';
    assert.equal(isPathInside(`${pluginRoot}/scripts/hooks/pre-tool-use.mjs`, pluginRoot), true);
    assert.equal(isPathInside('/home/user/project/scripts/app.js', pluginRoot), false);
  });

  it('matches any glob in a list', () => {
    assert.equal(matchAnyGlob('infra/main.tf', ['terraform/**', 'infra/**']), true);
    assert.equal(matchAnyGlob('src/app.ts', ['terraform/**', 'infra/**']), false);
  });
});
