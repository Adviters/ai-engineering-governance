import { getProjectRoot } from '../lib/project.mjs';

export function cliProjectRoot() {
  return getProjectRoot({ workspace_roots: [process.cwd()] }) || process.cwd();
}

export function fail(message, code = 1) {
  process.stderr.write(`${message}\n`);
  process.exit(code);
}

export function arg(index) {
  return process.argv.slice(2)[index] || null;
}
