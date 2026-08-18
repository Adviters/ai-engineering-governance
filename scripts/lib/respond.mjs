import { readFileSync } from 'node:fs';

const RAW_LOG_LIMIT = 500;

function extractJsonObject(text) {
  const start = text.indexOf('{');
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < text.length; i += 1) {
    const char = text[i];
    if (inString) {
      if (escape) {
        escape = false;
        continue;
      }
      if (char === '\\') {
        escape = true;
        continue;
      }
      if (char === '"') inString = false;
      continue;
    }
    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

export function parseHookPayload(rawOrReader) {
  let raw = '';
  try {
    if (typeof rawOrReader === 'function') {
      raw = rawOrReader();
    } else if (rawOrReader == null) {
      raw = readFileSync(0, 'utf8');
    } else {
      raw = rawOrReader;
    }
  } catch (err) {
    return {
      ok: false,
      error: 'STDIN_READ_FAILED',
      detail: String(err?.message || err),
      raw: '',
    };
  }

  const text = String(raw ?? '').replace(/^\uFEFF/, '').trim();
  if (!text) return { ok: true, payload: {}, raw: '' };

  try {
    return { ok: true, payload: JSON.parse(text), raw: text };
  } catch (err) {
    const extracted = extractJsonObject(text);
    if (extracted) {
      try {
        return { ok: true, payload: JSON.parse(extracted), raw: text };
      } catch {
        // fall through to INVALID_JSON
      }
    }
    return {
      ok: false,
      error: 'INVALID_JSON',
      detail: String(err?.message || err),
      raw: text.slice(0, RAW_LOG_LIMIT),
    };
  }
}

export function logHookParseFailure(result, stream = process.stderr) {
  const snippet = String(result?.raw || '').slice(0, RAW_LOG_LIMIT);
  const error = result?.error || 'INVALID_JSON';
  const detail = result?.detail || '';
  stream.write(`[ai-engineering-governance] ${error}: ${detail}\n`);
  if (snippet) stream.write(`${snippet}\n`);
}

export function denyHookParseFailure(result) {
  if (result?.error === 'STDIN_READ_FAILED') {
    return deny({
      userMessage: 'Could not read hook stdin.',
      agentMessage: 'Could not read hook stdin. Failing closed.',
    });
  }
  return deny({
    userMessage: 'Hook payload is not valid JSON.',
    agentMessage: 'Hook payload is not valid JSON. Failing closed.',
  });
}

export function writeJson(payload) {
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

export function allow(extra = {}) {
  return { permission: 'allow', ...extra };
}

export function deny({ userMessage, agentMessage } = {}) {
  const payload = { permission: 'deny' };
  if (userMessage) payload.user_message = userMessage;
  if (agentMessage) payload.agent_message = agentMessage;
  return payload;
}

export function followup(message) {
  if (!message) return {};
  return { followup_message: message };
}

export function compactWarning(message) {
  if (!message) return {};
  return { user_message: message };
}
