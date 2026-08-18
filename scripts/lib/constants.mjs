export const CLASSIFICATIONS = Object.freeze([
  'READ_ONLY',
  'SIMPLE',
  'PLAN_REQUIRED',
  'HIGH_RISK',
]);

export const APPROVAL_STATUS = Object.freeze([
  'DRAFT',
  'APPROVED',
  'INVALIDATED',
]);

export const STAGE_STATUS = Object.freeze([
  'PENDING',
  'IN_PROGRESS',
  'VERIFYING',
  'PASSED',
  'BLOCKED',
]);

export const TASK_STATUS = Object.freeze([
  'OPEN',
  'IN_PROGRESS',
  'BLOCKED',
  'COMPLETED',
]);

export const AUDIT_EVENTS = Object.freeze({
  TASK_CREATED: 'TASK_CREATED',
  TASK_CLASSIFIED: 'TASK_CLASSIFIED',
  BRANCH_CREATED: 'BRANCH_CREATED',
  BRANCH_REUSED: 'BRANCH_REUSED',
  PLAN_CREATED: 'PLAN_CREATED',
  PLAN_APPROVED: 'PLAN_APPROVED',
  PLAN_INVALIDATED: 'PLAN_INVALIDATED',
  STAGE_STARTED: 'STAGE_STARTED',
  STAGE_COMPLETED: 'STAGE_COMPLETED',
  STAGE_APPROVED: 'STAGE_APPROVED',
  WRITE_BLOCKED: 'WRITE_BLOCKED',
  COMMAND_BLOCKED: 'COMMAND_BLOCKED',
  QUALITY_GATE_PASSED: 'QUALITY_GATE_PASSED',
  QUALITY_GATE_FAILED: 'QUALITY_GATE_FAILED',
  TASK_COMPLETED: 'TASK_COMPLETED',
});

export const AI_DIR = '.ai';
export const TASKS_DIR = 'tasks';
export const CONFIG_FILE = 'config.json';
export const ACTIVE_TASK_FILE = 'active-task.json';
export const AUDIT_FILE = 'audit.jsonl';
export const TASK_FILE = 'task.json';
export const PLAN_FILE = 'PLAN.md';
export const APPROVAL_FILE = 'approval.json';
export const PROGRESS_FILE = 'progress.json';
