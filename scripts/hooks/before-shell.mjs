import { basename } from 'node:path';
import { deny, denyHookParseFailure, logHookParseFailure, parseHookPayload, writeJson } from '../lib/respond.mjs';
import { decideShell, loadGovernanceContext, persistDecision } from '../lib/runtime.mjs';
import { extractShellCommand } from '../lib/tool-input.mjs';

export function handleBeforeShell(payload) {
  const gov = loadGovernanceContext(payload);
  if (!gov.ok) {
    return deny({ userMessage: gov.message, agentMessage: gov.message });
  }
  const command = extractShellCommand(payload);
  if (!command) return { permission: 'allow' };
  const result = decideShell(gov, command);
  persistDecision(gov, result);
  if (result.allow === false) {
    return deny({ userMessage: result.userMessage, agentMessage: result.agentMessage });
  }
  return { permission: 'allow' };
}

function main() {
  const parsed = parseHookPayload();
  if (!parsed.ok) {
    logHookParseFailure(parsed);
    writeJson(denyHookParseFailure(parsed));
    return;
  }
  writeJson(handleBeforeShell(parsed.payload));
}

if (basename(process.argv[1] || '') === 'before-shell.mjs') {
  main();
}
