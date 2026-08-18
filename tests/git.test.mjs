import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import {
  currentBranch,
  isGitRepo,
  isProtectedBranch,
  localBranchExists,
  workingTreeStatus,
} from '../scripts/lib/git.mjs';

function git(args, cwd) {
  execFileSync('git', args, { cwd, stdio: 'ignore', windowsHide: true });
}

describe('git', () => {
  it('reads the current branch and preserves a dirty tree', () => {
    const root = mkdtempSync(join(tmpdir(), 'aeg-git-'));
    git(['init'], root);
    git(['config', 'user.email', 'dev@example.com'], root);
    git(['config', 'user.name', 'Dev'], root);
    git(['config', 'commit.gpgsign', 'false'], root);
    writeFileSync(join(root, 'README.md'), 'hello\n', 'utf8');
    git(['add', 'README.md'], root);
    git(['commit', '-m', 'init'], root);
    git(['branch', '-M', 'main'], root);

    assert.equal(isGitRepo(root), true);
    assert.equal(currentBranch(root), 'main');
    assert.equal(isProtectedBranch(currentBranch(root), ['main', 'master']), true);
    assert.equal(localBranchExists(root, 'main'), true);

    writeFileSync(join(root, 'dirty.txt'), 'do not lose me\n', 'utf8');
    const status = workingTreeStatus(root);
    assert.equal(status.dirty, true);
    assert.equal(readFileSync(join(root, 'dirty.txt'), 'utf8'), 'do not lose me\n');
  });

  it('does not treat feature branches as protected', () => {
    assert.equal(isProtectedBranch('feat/login', ['main', 'master', 'develop', 'qa']), false);
  });
});
