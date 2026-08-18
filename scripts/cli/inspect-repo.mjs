import { currentBranch, isGitRepo, localBranchExists, remoteBranchExists, workingTreeStatus } from '../lib/git.mjs';
import { cliProjectRoot, fail } from './args.mjs';

const projectRoot = cliProjectRoot();
if (!isGitRepo(projectRoot)) fail('Not a git repository.');

const branch = currentBranch(projectRoot);
const tree = workingTreeStatus(projectRoot);
process.stdout.write(JSON.stringify({
  branch,
  dirty: tree.dirty,
  entries: tree.entries,
  localBranchExists: localBranchExists(projectRoot, branch),
  remoteMainExists: remoteBranchExists(projectRoot, 'main'),
}, null, 2));
process.stdout.write('\n');
