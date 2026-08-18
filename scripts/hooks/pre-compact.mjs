import { basename } from 'node:path';
import { compactWarning, parseHookPayload, writeJson } from '../lib/respond.mjs';

const MESSAGE = [
  'Context compaction is about to run. This percentage is a heuristic, not a precise measurement.',
  'Finish the current stage if possible, update progress.json, generate a handoff-task summary, and start a new conversation if needed.',
].join(' ');

export function handlePreCompact(payload) {
  const percent = Number(payload?.context_usage_percent);
  if (Number.isFinite(percent) && percent < 70) return {};
  return compactWarning(MESSAGE);
}

function main() {
  const parsed = parseHookPayload();
  if (!parsed.ok) {
    writeJson({});
    return;
  }
  writeJson(handlePreCompact(parsed.payload));
}

if (basename(process.argv[1] || '') === 'pre-compact.mjs') {
  main();
}
