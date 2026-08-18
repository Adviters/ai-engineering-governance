import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { AI_DIR, CONFIG_FILE } from './constants.mjs';

export const DEFAULT_CONFIG = Object.freeze({
  protectedBranches: Object.freeze(['main', 'master', 'develop', 'qa']),
  planRequiredFileThreshold: 2,
  highRiskPaths: Object.freeze([
    '.github/workflows/**',
    'migrations/**',
    '**/migrations/**',
    'terraform/**',
    '**/terraform/**',
    'infra/**',
    '**/infra/**',
    'Dockerfile*',
    '**/Dockerfile*',
    'docker-compose*.yml',
    'docker-compose*.yaml',
    '**/docker-compose*.yml',
    '**/docker-compose*.yaml',
    'package.json',
    '**/package.json',
    'package-lock.json',
    '**/package-lock.json',
    'pnpm-lock.yaml',
    '**/pnpm-lock.yaml',
    'yarn.lock',
    '**/yarn.lock',
    '.env',
    '.env.*',
    '**/.env',
    '**/.env.*',
    'secrets/**',
    '**/secrets/**',
  ]),
  dangerousCommands: Object.freeze([]),
  stageApprovalMode: 'manual',
  requirePlanApproval: true,
  qaDeployCommand: null,
});

export const CONFIG_ERRORS = Object.freeze({
  MISSING_PROJECT_ROOT: 'MISSING_PROJECT_ROOT',
  INVALID_JSON: 'INVALID_JSON',
  INVALID_SCHEMA: 'INVALID_SCHEMA',
});

const KNOWN_KEYS = new Set(Object.keys(DEFAULT_CONFIG));

function isStringArray(value) {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && item.length > 0);
}

function validateConfig(raw) {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) {
    return 'Config must be a JSON object.';
  }

  if ('protectedBranches' in raw && !isStringArray(raw.protectedBranches)) {
    return 'protectedBranches must be an array of non-empty strings.';
  }

  if ('planRequiredFileThreshold' in raw) {
    const n = raw.planRequiredFileThreshold;
    if (!Number.isInteger(n) || n < 1) {
      return 'planRequiredFileThreshold must be an integer >= 1.';
    }
  }

  if ('highRiskPaths' in raw && !isStringArray(raw.highRiskPaths)) {
    return 'highRiskPaths must be an array of non-empty strings.';
  }

  if ('dangerousCommands' in raw && !isStringArray(raw.dangerousCommands)) {
    return 'dangerousCommands must be an array of non-empty strings.';
  }

  if ('stageApprovalMode' in raw && raw.stageApprovalMode !== 'manual' && raw.stageApprovalMode !== 'automatic') {
    return 'stageApprovalMode must be "manual" or "automatic".';
  }

  if ('requirePlanApproval' in raw && typeof raw.requirePlanApproval !== 'boolean') {
    return 'requirePlanApproval must be a boolean.';
  }

  if ('qaDeployCommand' in raw) {
    const value = raw.qaDeployCommand;
    if (value !== null && typeof value !== 'string') {
      return 'qaDeployCommand must be a string or null.';
    }
    if (typeof value === 'string' && value.trim() === '') {
      return 'qaDeployCommand must be null or a non-empty string.';
    }
  }

  return null;
}

export function mergeConfig(overrides = {}) {
  const merged = {
    protectedBranches: DEFAULT_CONFIG.protectedBranches.slice(),
    planRequiredFileThreshold: DEFAULT_CONFIG.planRequiredFileThreshold,
    highRiskPaths: DEFAULT_CONFIG.highRiskPaths.slice(),
    dangerousCommands: DEFAULT_CONFIG.dangerousCommands.slice(),
    stageApprovalMode: DEFAULT_CONFIG.stageApprovalMode,
    requirePlanApproval: DEFAULT_CONFIG.requirePlanApproval,
    qaDeployCommand: DEFAULT_CONFIG.qaDeployCommand,
  };

  for (const key of Object.keys(overrides)) {
    if (!KNOWN_KEYS.has(key)) continue;
    if (key === 'qaDeployCommand') {
      merged.qaDeployCommand = overrides.qaDeployCommand === '' ? null : overrides.qaDeployCommand;
      continue;
    }
    if (Array.isArray(DEFAULT_CONFIG[key])) {
      merged[key] = overrides[key].slice();
      continue;
    }
    merged[key] = overrides[key];
  }

  return merged;
}

export function loadConfig(projectRoot) {
  if (!projectRoot) {
    return {
      ok: false,
      error: CONFIG_ERRORS.MISSING_PROJECT_ROOT,
      message: 'Missing project root. Cannot load governance config.',
    };
  }

  const filePath = join(projectRoot, AI_DIR, CONFIG_FILE);
  if (!existsSync(filePath)) {
    return { ok: true, config: mergeConfig(), source: 'defaults' };
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return {
      ok: false,
      error: CONFIG_ERRORS.INVALID_JSON,
      message: `.ai/config.json is not valid JSON. Refusing to continue with an unsafe config.`,
    };
  }

  const schemaError = validateConfig(parsed);
  if (schemaError) {
    return {
      ok: false,
      error: CONFIG_ERRORS.INVALID_SCHEMA,
      message: schemaError,
    };
  }

  return { ok: true, config: mergeConfig(parsed), source: 'project' };
}
