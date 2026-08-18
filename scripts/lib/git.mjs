import { execFileSync } from 'node:child_process';

function runGit(args, cwd) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  }).trim();
}

export function isGitRepo(cwd) {
  try {
    runGit(['rev-parse', '--is-inside-work-tree'], cwd);
    return true;
  } catch {
    return false;
  }
}

export function currentBranch(cwd) {
  try {
    const branch = runGit(['rev-parse', '--abbrev-ref', 'HEAD'], cwd);
    return branch || null;
  } catch {
    return null;
  }
}

export function workingTreeStatus(cwd) {
  try {
    const output = runGit(['status', '--porcelain'], cwd);
    const lines = output === '' ? [] : output.split(/\r?\n/).filter(Boolean);
    return {
      dirty: lines.length > 0,
      entries: lines,
    };
  } catch {
    return { dirty: false, entries: [], error: 'GIT_STATUS_FAILED' };
  }
}

export function localBranchExists(cwd, branchName) {
  try {
    runGit(['show-ref', '--verify', '--quiet', `refs/heads/${branchName}`], cwd);
    return true;
  } catch {
    return false;
  }
}

export function remoteBranchExists(cwd, branchName, remote = 'origin') {
  try {
    runGit(['show-ref', '--verify', '--quiet', `refs/remotes/${remote}/${branchName}`], cwd);
    return true;
  } catch {
    return false;
  }
}

export function gitUserEmail(cwd) {
  try {
    const email = runGit(['config', 'user.email'], cwd);
    return email || null;
  } catch {
    return null;
  }
}

export function isProtectedBranch(branch, protectedBranches) {
  if (!branch || !Array.isArray(protectedBranches)) return false;
  return protectedBranches.includes(branch);
}
