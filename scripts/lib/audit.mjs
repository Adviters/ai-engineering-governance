import { appendFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { AI_DIR, AUDIT_FILE } from './constants.mjs';

function sanitizeMetadata(metadata) {
  if (metadata == null || typeof metadata !== 'object' || Array.isArray(metadata)) return {};
  const out = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value == null) continue;
    const type = typeof value;
    if (type === 'string' || type === 'number' || type === 'boolean') {
      out[key] = value;
      continue;
    }
    if (Array.isArray(value) && value.every((item) => typeof item === 'string')) {
      out[key] = value.slice(0, 50);
    }
  }
  return out;
}

export function appendAudit(projectRoot, { event, taskId = null, actor = null, metadata = {} }) {
  if (!projectRoot || !event) return false;
  try {
    const filePath = join(projectRoot, AI_DIR, AUDIT_FILE);
    mkdirSync(dirname(filePath), { recursive: true });
    const record = {
      timestamp: new Date().toISOString(),
      event,
      taskId,
      actor,
      metadata: sanitizeMetadata(metadata),
    };
    appendFileSync(filePath, `${JSON.stringify(record)}\n`, 'utf8');
    return true;
  } catch {
    return false;
  }
}
