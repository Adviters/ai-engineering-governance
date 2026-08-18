import { readFileSync } from 'node:fs';

export function readStdinJson() {
  const text = readFileSync(0, 'utf8');
  if (!text || !text.trim()) return {};
  return JSON.parse(text);
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
