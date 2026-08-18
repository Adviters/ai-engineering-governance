import { isProtectedBranch } from '../git.mjs';
import { isInternalGovPath, isPathInside } from '../paths.mjs';
import { allowResult, denyResult } from './result.mjs';

const START_TASK_MESSAGE = 'Protected branch writes are blocked. Run the start-task workflow before modifying project files.';

export function evaluateBranchGuard({
  relPath,
  absPath,
  branch,
  protectedBranches,
  pluginRoot,
  dirty = false,
}) {
  if (isInternalGovPath(relPath)) return allowResult();
  if (pluginRoot && absPath && isPathInside(absPath, pluginRoot)) return allowResult();
  if (!isProtectedBranch(branch, protectedBranches)) return allowResult({ dirty });

  return denyResult({
    reason: 'protected-branch',
    userMessage: START_TASK_MESSAGE,
    agentMessage: START_TASK_MESSAGE,
    event: 'WRITE_BLOCKED',
  });
}
