import { AUDIT_EVENTS } from '../constants.mjs';
import { basenameCommand, splitCommandChain, splitWords, tokenize } from '../command-parse.mjs';
import { allowResult, denyResult } from './result.mjs';

const DENY_MESSAGE = 'This command is blocked by the dangerous-command guard. A human must run it outside the Agent if it is truly required.';

function denied(reason) {
  return denyResult({
    reason,
    userMessage: DENY_MESSAGE,
    agentMessage: DENY_MESSAGE,
    event: AUDIT_EVENTS.COMMAND_BLOCKED,
  });
}

function flags(tokens) {
  return tokens.filter((token) => token.startsWith('-')).map((token) => token.toLowerCase());
}

function hasAnyFlag(tokens, names) {
  const set = new Set(flags(tokens));
  return names.some((name) => set.has(name.toLowerCase()));
}

function positional(tokens) {
  const out = [];
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token === '--') {
      out.push(...tokens.slice(i + 1));
      break;
    }
    if (token.startsWith('-')) {
      if (token.includes('=') || token.length === 2 && i + 1 < tokens.length && !tokens[i + 1].startsWith('-')) {
        if (!token.includes('=') && token.length === 2) i += 1;
      }
      continue;
    }
    out.push(token);
  }
  return out;
}

function gitSubcommand(tokens) {
  for (let i = 1; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (token === '-C' || token === '--git-dir' || token === '--work-tree') {
      i += 1;
      continue;
    }
    if (token.startsWith('-')) continue;
    return token.toLowerCase();
  }
  return null;
}

function pathIsBroad(value) {
  if (!value) return false;
  const normalized = value.replace(/\\/g, '/');
  return normalized === '.' || normalized === '..' || normalized === '*' || normalized === '/' || normalized === './*';
}

function inspectGit(tokens) {
  const sub = gitSubcommand(tokens);
  if (!sub) return null;
  if (sub === 'clean') return denied('git-clean');
  if (sub === 'reset' && hasAnyFlag(tokens, ['--hard', '-hard'])) return denied('git-reset-hard');
  if (sub === 'checkout' || sub === 'restore' || sub === 'switch') {
    const paths = positional(tokens.slice(1)).filter((token) => token.toLowerCase() !== sub);
    if (paths.some(pathIsBroad)) return denied('git-restore-all');
  }
  return null;
}

function inspectRm(tokens) {
  const joinedFlags = flags(tokens).join('');
  const recursive = hasAnyFlag(tokens, ['-r', '-R', '--recursive', '-rf', '-fr', '-rF', '-Rf', '-FR']) || /r/.test(joinedFlags);
  const force = hasAnyFlag(tokens, ['-f', '--force', '-rf', '-fr', '-Rf', '-FR']) || /f/.test(joinedFlags);
  if (recursive && force) return denied('rm-rf');
  if (recursive && positional(tokens).some(pathIsBroad)) return denied('rm-recursive-broad');
  return null;
}

function inspectRemoveItem(tokens) {
  const names = tokens.map((token) => token.toLowerCase());
  if (names.includes('-recurse') && names.includes('-force')) return denied('remove-item-recurse-force');
  return null;
}

function inspectDel(tokens) {
  const names = tokens.map((token) => token.toLowerCase());
  if (names.includes('/s')) return denied('del-recursive');
  if (positional(tokens).some(pathIsBroad)) return denied('del-broad');
  return null;
}

function inspectRmdir(tokens) {
  const names = tokens.map((token) => token.toLowerCase());
  if (names.includes('/s') || names.includes('-recurse')) return denied('rmdir-recursive');
  return null;
}

function inspectSql(tokens) {
  const words = tokens.flatMap(splitWords).map((word) => word.replace(/;$/, '').toUpperCase());
  for (let i = 0; i < words.length; i += 1) {
    if (words[i] === 'DROP' && (words[i + 1] === 'DATABASE' || words[i + 1] === 'TABLE' || words[i + 1] === 'SCHEMA')) {
      return denied('sql-drop');
    }
    if (words[i] === 'TRUNCATE') return denied('sql-truncate');
  }
  return null;
}

function inspectTerraform(tokens) {
  if (tokens.map((token) => token.toLowerCase()).includes('destroy')) return denied('terraform-destroy');
  return null;
}

function inspectKubectl(tokens) {
  const names = tokens.map((token) => token.toLowerCase());
  const sub = names[1];
  if (sub !== 'delete') return null;
  if (names.includes('namespace') || names.includes('ns') || names.includes('namespaces')) {
    return denied('kubectl-delete-namespace');
  }
  if (names.includes('--all') || names.includes('all')) return denied('kubectl-delete-all');
  return null;
}

function inspectPublish(tokens) {
  const name = basenameCommand(tokens[0]);
  const rest = tokens.slice(1).map((token) => token.toLowerCase());
  if (['npm', 'pnpm', 'yarn', 'bun'].includes(name) && rest.includes('publish')) return denied('package-publish');
  if (name === 'twine' && rest.includes('upload')) return denied('pypi-upload');
  if (name === 'cargo' && rest.includes('publish')) return denied('cargo-publish');
  return null;
}

function inspectCommand(tokens) {
  if (tokens.length === 0) return null;
  const name = basenameCommand(tokens[0]);
  if (name === 'git') return inspectGit(tokens);
  if (name === 'rm') return inspectRm(tokens);
  if (name === 'remove-item') return inspectRemoveItem(tokens);
  if (name === 'del' || name === 'erase') return inspectDel(tokens);
  if (name === 'rmdir' || name === 'rd') return inspectRmdir(tokens);
  if (name === 'terraform') return inspectTerraform(tokens);
  if (name === 'kubectl') return inspectKubectl(tokens);
  const published = inspectPublish(tokens);
  if (published) return published;
  if (['psql', 'mysql', 'sqlcmd', 'sqlite3', 'drop', 'truncate'].includes(name)) {
    return inspectSql(tokens);
  }
  return null;
}

function inspectExtraPatterns(command, extraPatterns) {
  if (!Array.isArray(extraPatterns)) return null;
  for (const pattern of extraPatterns) {
    try {
      if (new RegExp(pattern, 'i').test(command)) {
        return denied('configured-dangerous-command');
      }
    } catch {
      if (command.toLowerCase().includes(String(pattern).toLowerCase())) {
        return denied('configured-dangerous-command');
      }
    }
  }
  return null;
}

export function evaluateDangerousCommandGuard({ command, extraPatterns = [] }) {
  const extra = inspectExtraPatterns(command, extraPatterns);
  if (extra) return extra;

  for (const part of splitCommandChain(command)) {
    const result = inspectCommand(tokenize(part));
    if (result && result.allow === false) return result;
  }
  return allowResult();
}
