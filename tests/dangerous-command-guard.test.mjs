import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { evaluateDangerousCommandGuard } from '../scripts/lib/guards/dangerous-command-guard.mjs';

describe('dangerous-command-guard', () => {
  it('blocks destructive git, filesystem, sql, infra, and publish commands', () => {
    const blocked = [
      'git reset --hard',
      'git clean -fd',
      'git checkout -- .',
      'git restore .',
      'rm -rf /tmp/app',
      'Remove-Item -Recurse -Force src',
      'del /s /q dist',
      'psql -c "DROP TABLE users"',
      'psql -c "TRUNCATE users"',
      'terraform destroy',
      'kubectl delete namespace prod',
      'npm publish',
    ];
    for (const command of blocked) {
      const result = evaluateDangerousCommandGuard({ command });
      assert.equal(result.allow, false, command);
    }
  });

  it('allows safe git and project commands', () => {
    const allowed = [
      'git status',
      'git checkout -b feat/login',
      'git switch feat/login',
      'git restore src/app.ts',
      'git log --oneline',
      'npm test',
      'npm run build',
      'echo git reset --hard',
      'kubectl delete pod web-1',
    ];
    for (const command of allowed) {
      const result = evaluateDangerousCommandGuard({ command });
      assert.equal(result.allow, true, command);
    }
  });

  it('blocks extra configured patterns without using naive false positives by default', () => {
    const result = evaluateDangerousCommandGuard({
      command: 'custom-release --prod',
      extraPatterns: ['custom-release\\s+--prod'],
    });
    assert.equal(result.allow, false);
    assert.equal(evaluateDangerousCommandGuard({ command: 'custom-release --prod' }).allow, true);
  });
});
