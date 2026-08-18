import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { planHashFromContent, sha256Text } from '../scripts/lib/hash.mjs';

describe('hash', () => {
  it('returns a stable sha256 for the same plan content', () => {
    const plan = '# Task\n\nGoal: demo\n';
    assert.equal(planHashFromContent(plan), planHashFromContent(plan));
    assert.equal(planHashFromContent(plan), sha256Text(plan));
  });

  it('changes when the plan changes', () => {
    const original = '# Task\n\nGoal: demo\n';
    const modified = '# Task\n\nGoal: demo changed\n';
    assert.notEqual(planHashFromContent(original), planHashFromContent(modified));
  });

  it('treats trailing whitespace as a real change', () => {
    assert.notEqual(planHashFromContent('stage 1'), planHashFromContent('stage 1\n'));
  });
});
