import { basename } from 'node:path';
import { parseHookPayload, writeJson } from '../lib/respond.mjs';
import { loadGovernanceContext, recordSuccessfulWrite } from '../lib/runtime.mjs';
import { extractWritePath, isWriteTool } from '../lib/tool-input.mjs';

export function handlePostToolUse(payload) {
  try {
    const gov = loadGovernanceContext(payload);
    if (!gov.ok) return {};
    if (!isWriteTool(payload.tool_name)) return {};
    const absPath = extractWritePath(payload.tool_input);
    if (!absPath) return {};
    recordSuccessfulWrite(gov, absPath);
  } catch {
    return {};
  }
  return {};
}

function main() {
  const parsed = parseHookPayload();
  if (!parsed.ok) {
    writeJson({});
    return;
  }
  writeJson(handlePostToolUse(parsed.payload));
}

if (basename(process.argv[1] || '') === 'post-tool-use.mjs') {
  main();
}
