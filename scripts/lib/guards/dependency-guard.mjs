import { AUDIT_EVENTS } from '../constants.mjs';
import { basenameCommand, splitCommandChain, tokenize } from '../command-parse.mjs';
import { findStage, parsePlan } from '../plan.mjs';
import { allowResult, denyResult } from './result.mjs';

const MESSAGE = 'Dependency changes are blocked unless the approved plan explicitly allows them.';

function isDependencyCommand(tokens) {
  const name = basenameCommand(tokens[0]);
  const rest = tokens.slice(1).map((token) => token.toLowerCase());
  const sub = rest.find((token) => !token.startsWith('-')) || '';

  if (['npm', 'pnpm', 'yarn', 'bun'].includes(name)) {
    if (['install', 'i', 'add', 'ci', 'uninstall', 'remove', 'un'].includes(sub)) return true;
  }
  if (name === 'pip' || name === 'pip3') {
    return sub === 'install' || sub === 'uninstall';
  }
  if (name === 'python' || name === 'python3') {
    const pipIndex = rest.indexOf('-m');
    if (pipIndex >= 0 && rest[pipIndex + 1] === 'pip' && ['install', 'uninstall'].includes(rest[pipIndex + 2])) {
      return true;
    }
  }
  if (name === 'poetry' && (sub === 'add' || sub === 'remove' || sub === 'install')) return true;
  return false;
}

function planAllowsDependencies(planMarkdown, progress) {
  const parsed = parsePlan(planMarkdown);
  if (!parsed.ok) return false;
  if (parsed.plan.allowsDependencyChanges) return true;
  const stage = findStage(parsed.plan, progress?.currentStage);
  return Boolean(stage?.allowsDependencyChanges);
}

export function evaluateDependencyGuard({ command, planMarkdown, progress }) {
  for (const part of splitCommandChain(command)) {
    const tokens = tokenize(part);
    if (!isDependencyCommand(tokens)) continue;
    if (planAllowsDependencies(planMarkdown, progress)) continue;
    return denyResult({
      reason: 'dependency-change-unapproved',
      userMessage: MESSAGE,
      agentMessage: MESSAGE,
      event: AUDIT_EVENTS.COMMAND_BLOCKED,
    });
  }
  return allowResult();
}
