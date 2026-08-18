import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function getPluginRoot() {
  if (process.env.CURSOR_PLUGIN_ROOT) return process.env.CURSOR_PLUGIN_ROOT;
  const here = dirname(fileURLToPath(import.meta.url));
  return join(here, '..', '..');
}

export function getProjectRoot(payload = {}) {
  const fromEnv = process.env.CURSOR_PROJECT_DIR || process.env.CLAUDE_PROJECT_DIR;
  if (fromEnv) return fromEnv;
  if (Array.isArray(payload.workspace_roots) && payload.workspace_roots[0]) {
    return payload.workspace_roots[0];
  }
  return null;
}
