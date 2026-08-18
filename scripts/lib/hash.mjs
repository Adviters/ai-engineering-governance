import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export function sha256Text(text) {
  return createHash('sha256').update(String(text), 'utf8').digest('hex');
}

export function sha256File(filePath) {
  const bytes = readFileSync(filePath);
  return createHash('sha256').update(bytes).digest('hex');
}

export function planHashFromContent(planMarkdown) {
  return sha256Text(planMarkdown);
}

export function normalizeHash(hash) {
  if (!hash) return null;
  return String(hash).replace(/^sha256:/i, '').trim().toLowerCase();
}

export function hashesMatch(left, right) {
  const a = normalizeHash(left);
  const b = normalizeHash(right);
  return Boolean(a && b && a === b);
}
