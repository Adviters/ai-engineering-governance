import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import {
  ACTIVE_TASK_FILE,
  AI_DIR,
  APPROVAL_FILE,
  APPROVAL_STATUS,
  CLASSIFICATIONS,
  PLAN_FILE,
  PROGRESS_FILE,
  STAGE_STATUS,
  TASK_FILE,
  TASK_STATUS,
  TASKS_DIR,
} from './constants.mjs';

export function assertTaskId(taskId) {
  if (typeof taskId !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,127}$/.test(taskId)) {
    throw new Error('Invalid task id.');
  }
}

export function aiDir(projectRoot) {
  return join(projectRoot, AI_DIR);
}

export function taskDir(projectRoot, taskId) {
  assertTaskId(taskId);
  return join(projectRoot, AI_DIR, TASKS_DIR, taskId);
}

function writeJson(filePath, data) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

function readJson(filePath) {
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

export function readActiveTaskId(projectRoot) {
  const data = readJson(join(projectRoot, AI_DIR, ACTIVE_TASK_FILE));
  if (!data || typeof data.taskId !== 'string') return null;
  return data.taskId;
}

export function writeActiveTaskId(projectRoot, taskId) {
  assertTaskId(taskId);
  writeJson(join(projectRoot, AI_DIR, ACTIVE_TASK_FILE), { taskId });
}

export function createTaskRecord({ id, title = '', classification, branch = '', status = 'OPEN' }) {
  assertTaskId(id);
  if (!CLASSIFICATIONS.includes(classification)) {
    throw new Error('Invalid classification.');
  }
  if (!TASK_STATUS.includes(status)) {
    throw new Error('Invalid task status.');
  }
  return {
    id,
    title,
    classification,
    branch,
    status,
    createdAt: new Date().toISOString(),
  };
}

export function defaultProgress() {
  return {
    currentStage: null,
    completedStages: [],
    stageStatus: {},
    verificationStatus: {},
    stageApprovals: {},
    modifiedFiles: [],
    qualityGate: null,
  };
}

export function defaultApproval() {
  return {
    status: 'DRAFT',
    planPath: PLAN_FILE,
    planHash: null,
    approvedBy: null,
    approvedAt: null,
  };
}

export function readTask(projectRoot, taskId) {
  return readJson(join(taskDir(projectRoot, taskId), TASK_FILE));
}

export function writeTask(projectRoot, task) {
  if (!task || !task.id) throw new Error('Task is missing id.');
  if (!CLASSIFICATIONS.includes(task.classification)) throw new Error('Invalid classification.');
  writeJson(join(taskDir(projectRoot, task.id), TASK_FILE), task);
}

export function readPlan(projectRoot, taskId) {
  const filePath = join(taskDir(projectRoot, taskId), PLAN_FILE);
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, 'utf8');
}

export function writePlan(projectRoot, taskId, markdown) {
  const filePath = join(taskDir(projectRoot, taskId), PLAN_FILE);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, markdown, 'utf8');
}

export function readApproval(projectRoot, taskId) {
  return readJson(join(taskDir(projectRoot, taskId), APPROVAL_FILE));
}

export function writeApproval(projectRoot, taskId, approval) {
  if (approval?.status && !APPROVAL_STATUS.includes(approval.status)) {
    throw new Error('Invalid approval status.');
  }
  writeJson(join(taskDir(projectRoot, taskId), APPROVAL_FILE), approval);
}

export function readProgress(projectRoot, taskId) {
  return readJson(join(taskDir(projectRoot, taskId), PROGRESS_FILE));
}

export function writeProgress(projectRoot, taskId, progress) {
  if (progress?.stageStatus) {
    for (const status of Object.values(progress.stageStatus)) {
      if (!STAGE_STATUS.includes(status)) throw new Error('Invalid stage status.');
    }
  }
  writeJson(join(taskDir(projectRoot, taskId), PROGRESS_FILE), progress);
}

export function ensureTaskWorkspace(projectRoot, task) {
  writeTask(projectRoot, task);
  const progressPath = join(taskDir(projectRoot, task.id), PROGRESS_FILE);
  if (!existsSync(progressPath)) {
    writeProgress(projectRoot, task.id, defaultProgress());
  }
  const approvalPath = join(taskDir(projectRoot, task.id), APPROVAL_FILE);
  if (!existsSync(approvalPath)) {
    writeApproval(projectRoot, task.id, defaultApproval());
  }
  writeActiveTaskId(projectRoot, task.id);
  return taskDir(projectRoot, task.id);
}

export function readActiveTask(projectRoot) {
  const taskId = readActiveTaskId(projectRoot);
  if (!taskId) return null;
  try {
    return readTask(projectRoot, taskId);
  } catch {
    return null;
  }
}

export function recordModifiedFile(progress, relPath) {
  const files = Array.isArray(progress?.modifiedFiles) ? progress.modifiedFiles.slice() : [];
  if (relPath && !files.includes(relPath)) files.push(relPath);
  return { ...progress, modifiedFiles: files };
}
