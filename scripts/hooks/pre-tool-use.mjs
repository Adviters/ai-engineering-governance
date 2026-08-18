import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { deny, writeJson } from '../lib/respond.mjs';
import { decideShell, decideWrite, loadGovernanceContext, persistDecision } from '../lib/runtime.mjs';
import { extractShellCommand, extractWritePath, isShellTool, isWriteTool } from '../lib/tool-input.mjs';

export function handlePreToolUse(payload) {
  const gov = loadGovernanceContext(payload);
  if (!gov.ok) {
    return deny({ userMessage: gov.message, agentMessage: gov.message });
  }

  if (isWriteTool(payload.tool_name)) {
    const absPath = extractWritePath(payload.tool_input);
    if (!absPath) {
      return deny({
        userMessage: 'Write tool is missing a file path.',
        agentMessage: 'Write tool is missing a file path. Provide a path inside the project.',
      });
    }
    const result = decideWrite(gov, absPath);
    persistDecision(gov, result);
    if (result.allow === false) {
      return deny({ userMessage: result.userMessage, agentMessage: result.agentMessage });
    }
    return { permission: 'allow' };
  }

  if (isShellTool(payload.tool_name, payload.hook_event_name)) {
    const command = extractShellCommand(payload);
    if (!command) return { permission: 'allow' };
    const result = decideShell(gov, command);
    persistDecision(gov, result);
    if (result.allow === false) {
      return deny({ userMessage: result.userMessage, agentMessage: result.agentMessage });
    }
  }

  return { permission: 'allow' };
}

function main() {
  let payload = {};
  try {
    payload = JSON.parse(readFileSync(0, 'utf8') || '{}');
  } catch {
    writeJson(deny({
      userMessage: 'Governance hook received invalid JSON.',
      agentMessage: 'Governance hook received invalid JSON. Failing closed.',
    }));
    return;
  }
  writeJson(handlePreToolUse(payload));
}

if (basename(process.argv[1] || '') === 'pre-tool-use.mjs') {
  main();
}
