import { isInternalGovPath, isPathInside } from '../paths.mjs';
import { allowResult, denyResult } from './result.mjs';

const MESSAGE = 'The task has exceeded simple-change scope.\n\nCreate an implementation plan before continuing.';

export function countableModifiedFiles(modifiedFiles = []) {
  return modifiedFiles.filter((file) => file && !isInternalGovPath(file));
}

export function evaluateFileThresholdGuard({
  relPath,
  absPath,
  pluginRoot,
  classification,
  modifiedFiles = [],
  planRequiredFileThreshold = 2,
}) {
  if (isInternalGovPath(relPath)) return allowResult();
  if (pluginRoot && absPath && isPathInside(absPath, pluginRoot)) return allowResult();

  const kind = classification || 'SIMPLE';
  if (kind !== 'SIMPLE') return allowResult();

  const counted = countableModifiedFiles(modifiedFiles);
  if (counted.includes(relPath)) return allowResult();
  if (counted.length < planRequiredFileThreshold) return allowResult();

  return denyResult({
    reason: 'simple-threshold-exceeded',
    userMessage: MESSAGE,
    agentMessage: MESSAGE,
    event: 'WRITE_BLOCKED',
  });
}

export function evaluateReadOnlyGuard({ relPath, absPath, pluginRoot, classification }) {
  if (isInternalGovPath(relPath)) return allowResult();
  if (pluginRoot && absPath && isPathInside(absPath, pluginRoot)) return allowResult();
  if (classification !== 'READ_ONLY') return allowResult();

  const message = 'This task is classified READ_ONLY. Reclassify it before modifying project files.';
  return denyResult({
    reason: 'read-only-task',
    userMessage: message,
    agentMessage: message,
    event: 'WRITE_BLOCKED',
  });
}
