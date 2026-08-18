import { isAbsolute, relative, resolve, sep } from 'node:path';

export function toPosix(filePath) {
  return String(filePath).replace(/\\/g, '/');
}

export function stripLeadingDotSlash(posixPath) {
  return posixPath.replace(/^\.\//, '');
}

export function normalizeRelPath(filePath) {
  return stripLeadingDotSlash(toPosix(filePath)).replace(/^\/+/, '');
}

export function toProjectRelPath(projectRoot, filePath) {
  if (!projectRoot || !filePath) return null;
  const abs = isAbsolute(filePath) ? filePath : resolve(projectRoot, filePath);
  const rel = relative(projectRoot, abs);
  if (!rel || rel === '') return '';
  if (rel.startsWith('..') || isAbsolute(rel)) return null;
  return normalizeRelPath(rel);
}

export function isInternalGovPath(relPath) {
  const n = normalizeRelPath(relPath);
  return n === '.ai' || n.startsWith('.ai/');
}

export function isPathInside(absPath, root) {
  if (!absPath || !root) return false;
  const rel = relative(root, absPath);
  if (!rel || rel === '') return true;
  return !rel.startsWith('..') && !isAbsolute(rel);
}

function escapeRegex(char) {
  return char.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&');
}

export function globToRegExp(pattern) {
  const glob = normalizeRelPath(pattern);
  let i = 0;
  let out = '^';
  while (i < glob.length) {
    if (glob.startsWith('**/', i)) {
      out += '(?:.*/)?';
      i += 3;
      continue;
    }
    if (glob[i] === '*' && glob[i + 1] === '*') {
      out += '.*';
      i += 2;
      continue;
    }
    if (glob[i] === '*') {
      out += '[^/]*';
      i += 1;
      continue;
    }
    if (glob[i] === '?') {
      out += '[^/]';
      i += 1;
      continue;
    }
    out += escapeRegex(glob[i]);
    i += 1;
  }
  out += '$';
  return new RegExp(out, sep === '\\' ? 'i' : '');
}

export function matchGlob(relPath, pattern) {
  if (relPath == null || pattern == null) return false;
  return globToRegExp(pattern).test(normalizeRelPath(relPath));
}

export function matchAnyGlob(relPath, patterns) {
  if (!Array.isArray(patterns)) return false;
  return patterns.some((pattern) => matchGlob(relPath, pattern));
}

export function resolveUnder(root, ...parts) {
  return resolve(root, ...parts);
}
