import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { CONFIG_ERRORS, DEFAULT_CONFIG, loadConfig, mergeConfig } from '../scripts/lib/config.mjs';

function tempProject() {
  return mkdtempSync(join(tmpdir(), 'aeg-config-'));
}

describe('config', () => {
  it('uses safe defaults when .ai/config.json is missing', () => {
    const root = tempProject();
    const result = loadConfig(root);
    assert.equal(result.ok, true);
    assert.equal(result.source, 'defaults');
    assert.deepEqual(result.config.protectedBranches, DEFAULT_CONFIG.protectedBranches);
    assert.equal(result.config.planRequiredFileThreshold, 2);
    assert.equal(result.config.stageApprovalMode, 'manual');
    assert.equal(result.config.requirePlanApproval, true);
    assert.equal(result.config.qaDeployCommand, null);
  });

  it('overrides only the keys present in the project config', () => {
    const merged = mergeConfig({
      planRequiredFileThreshold: 4,
      protectedBranches: ['main', 'release'],
    });
    assert.equal(merged.planRequiredFileThreshold, 4);
    assert.deepEqual(merged.protectedBranches, ['main', 'release']);
    assert.equal(merged.stageApprovalMode, 'manual');
  });

  it('fails closed when project root is missing', () => {
    const result = loadConfig(null);
    assert.equal(result.ok, false);
    assert.equal(result.error, CONFIG_ERRORS.MISSING_PROJECT_ROOT);
  });

  it('fails closed on invalid JSON', () => {
    const root = tempProject();
    mkdirSync(join(root, '.ai'));
    writeFileSync(join(root, '.ai', 'config.json'), '{not json', 'utf8');
    const result = loadConfig(root);
    assert.equal(result.ok, false);
    assert.equal(result.error, CONFIG_ERRORS.INVALID_JSON);
  });

  it('fails closed on invalid schema', () => {
    const root = tempProject();
    mkdirSync(join(root, '.ai'));
    writeFileSync(
      join(root, '.ai', 'config.json'),
      JSON.stringify({ planRequiredFileThreshold: 0 }),
      'utf8',
    );
    const result = loadConfig(root);
    assert.equal(result.ok, false);
    assert.equal(result.error, CONFIG_ERRORS.INVALID_SCHEMA);
  });

  it('loads a valid project override', () => {
    const root = tempProject();
    mkdirSync(join(root, '.ai'));
    writeFileSync(
      join(root, '.ai', 'config.json'),
      JSON.stringify({
        stageApprovalMode: 'automatic',
        qaDeployCommand: 'npm run deploy:qa',
      }),
      'utf8',
    );
    const result = loadConfig(root);
    assert.equal(result.ok, true);
    assert.equal(result.source, 'project');
    assert.equal(result.config.stageApprovalMode, 'automatic');
    assert.equal(result.config.qaDeployCommand, 'npm run deploy:qa');
    assert.equal(result.config.planRequiredFileThreshold, 2);
  });
});
