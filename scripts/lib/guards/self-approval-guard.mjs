import { basename, normalize } from 'node:path';
import { AUDIT_EVENTS } from '../constants.mjs';
import { basenameCommand, splitCommandChain, tokenize } from '../command-parse.mjs';
import { allowResult, denyResult } from './result.mjs';

const BLOCKED_SCRIPTS = new Set([
  'approve-plan.mjs',
  'approve-stage.mjs',
  'deploy-qa.mjs',
]);

const MESSAGE = 'This command must be run by a human in a local terminal. The Agent cannot approve plans, approve stages, or deploy.';

function looksLikeBlockedScript(token) {
  if (!token) return false;
  const base = basename(normalize(String(token).replace(/\\/g, '/')));
  return BLOCKED_SCRIPTS.has(base.toLowerCase());
}

export function evaluateSelfApprovalGuard({ command }) {
  for (const part of splitCommandChain(command)) {
    const tokens = tokenize(part);
    if (tokens.some(looksLikeBlockedScript)) {
      return denyResult({
        reason: 'human-only-cli',
        userMessage: MESSAGE,
        agentMessage: MESSAGE,
        event: AUDIT_EVENTS.COMMAND_BLOCKED,
      });
    }
    const name = basenameCommand(tokens[0]);
    if (['approve-plan', 'approve-stage', 'deploy-qa'].includes(name)) {
      return denyResult({
        reason: 'human-only-cli',
        userMessage: MESSAGE,
        agentMessage: MESSAGE,
        event: AUDIT_EVENTS.COMMAND_BLOCKED,
      });
    }
  }
  return allowResult();
}
