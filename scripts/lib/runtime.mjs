import { loadConfig } from './config.mjs';
import { AUDIT_EVENTS } from './constants.mjs';
import { appendAudit } from './audit.mjs';
import { currentBranch, isGitRepo, workingTreeStatus } from './git.mjs';
import { isInternalGovPath, toProjectRelPath } from './paths.mjs';
import {
  readActiveTask,
  readActiveTaskId,
  readApproval,
  readPlan,
  readProgress,
  recordModifiedFile,
  writeApproval,
  writeProgress,
} from './task-store.mjs';
import { evaluateWriteGuards } from './guards/write-policy.mjs';
import { evaluateShellGuards } from './guards/shell-policy.mjs';
import { getPluginRoot, getProjectRoot } from './project.mjs';

export function loadGovernanceContext(payload = {}) {
  const projectRoot = getProjectRoot(payload);
  if (!projectRoot) {
    return { ok: false, error: 'MISSING_PROJECT_ROOT', message: 'Missing project root. Cannot enforce governance.' };
  }

  const loaded = loadConfig(projectRoot);
  if (!loaded.ok) return loaded;

  const task = readActiveTask(projectRoot);
  const taskId = task?.id || readActiveTaskId(projectRoot);
  const approval = taskId ? readApproval(projectRoot, taskId) : null;
  const planMarkdown = taskId ? readPlan(projectRoot, taskId) : null;
  const progress = taskId ? readProgress(projectRoot, taskId) : { modifiedFiles: [] };
  const branch = currentBranch(projectRoot);
  const tree = workingTreeStatus(projectRoot);

  return {
    ok: true,
    projectRoot,
    pluginRoot: getPluginRoot(),
    config: loaded.config,
    task,
    taskId,
    approval,
    planMarkdown,
    progress: progress || { modifiedFiles: [] },
    branch,
    dirty: Boolean(tree.dirty),
    gitRepo: isGitRepo(projectRoot),
  };
}

export function buildWriteContext(gov, relPath, absPath) {
  return {
    relPath,
    absPath,
    branch: gov.branch,
    protectedBranches: gov.config.protectedBranches,
    pluginRoot: gov.pluginRoot,
    dirty: gov.dirty,
    classification: gov.task?.classification || 'SIMPLE',
    highRiskPaths: gov.config.highRiskPaths,
    approval: gov.approval,
    planMarkdown: gov.planMarkdown,
    requirePlanApproval: gov.config.requirePlanApproval,
    modifiedFiles: gov.progress?.modifiedFiles || [],
    planRequiredFileThreshold: gov.config.planRequiredFileThreshold,
    progress: gov.progress,
  };
}

export function decideWrite(gov, absPath) {
  if (!gov.gitRepo || !gov.branch) {
    const relPath = toProjectRelPath(gov.projectRoot, absPath);
    if (relPath && isInternalGovPath(relPath)) {
      return { allow: true, relPath };
    }
    return {
      allow: false,
      reason: 'unknown-branch',
      userMessage: 'Cannot determine the current git branch. Governance fails closed for project writes.',
      agentMessage: 'Cannot determine the current git branch. Run start-task inside a git repository.',
      event: AUDIT_EVENTS.WRITE_BLOCKED,
      relPath,
    };
  }

  const relPath = toProjectRelPath(gov.projectRoot, absPath);
  if (!relPath) {
    return {
      allow: false,
      reason: 'path-outside-project',
      userMessage: 'Writes outside the project root are blocked.',
      agentMessage: 'Writes outside the project root are blocked.',
      event: AUDIT_EVENTS.WRITE_BLOCKED,
      relPath,
    };
  }

  const result = evaluateWriteGuards(buildWriteContext(gov, relPath, absPath));
  return { ...result, relPath };
}

export function decideShell(gov, command) {
  return evaluateShellGuards({
    command,
    config: gov.config,
    extraPatterns: gov.config.dangerousCommands,
    planMarkdown: gov.planMarkdown,
    progress: gov.progress,
  });
}

export function persistDecision(gov, result) {
  if (!gov.projectRoot) return;
  if (result.invalidateApproval && gov.taskId && gov.approval) {
    writeApproval(gov.projectRoot, gov.taskId, {
      ...gov.approval,
      status: 'INVALIDATED',
    });
    appendAudit(gov.projectRoot, {
      event: AUDIT_EVENTS.PLAN_INVALIDATED,
      taskId: gov.taskId,
      actor: 'hook',
      metadata: { reason: result.reason },
    });
  }
  if (result.allow === false) {
    appendAudit(gov.projectRoot, {
      event: result.event || AUDIT_EVENTS.WRITE_BLOCKED,
      taskId: gov.taskId,
      actor: 'hook',
      metadata: { reason: result.reason, path: result.relPath || undefined },
    });
  }
}

export function recordSuccessfulWrite(gov, absPath) {
  if (!gov.taskId) return;
  const relPath = toProjectRelPath(gov.projectRoot, absPath);
  if (!relPath || isInternalGovPath(relPath)) return;
  const progress = recordModifiedFile(gov.progress || { modifiedFiles: [] }, relPath);
  writeProgress(gov.projectRoot, gov.taskId, progress);
}
