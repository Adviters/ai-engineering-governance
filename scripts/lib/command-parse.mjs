export function splitCommandChain(command) {
  const parts = [];
  let current = '';
  let quote = null;
  const text = String(command || '');

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quote) {
      current += char;
      if (char === quote && text[i - 1] !== '\\') quote = null;
      continue;
    }
    if (char === '"' || char === "'" || char === '`') {
      quote = char;
      current += char;
      continue;
    }
    if (char === '&' && text[i + 1] === '&') {
      if (current.trim()) parts.push(current.trim());
      current = '';
      i += 1;
      continue;
    }
    if (char === '|' && text[i + 1] === '|') {
      if (current.trim()) parts.push(current.trim());
      current = '';
      i += 1;
      continue;
    }
    if (char === '|' || char === ';' || char === '\n') {
      if (current.trim()) parts.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

export function tokenize(command) {
  const tokens = [];
  let current = '';
  let quote = null;
  const text = String(command || '');

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quote) {
      if (char === quote && text[i - 1] !== '\\') {
        quote = null;
        continue;
      }
      current += char;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = '';
      }
      continue;
    }
    current += char;
  }
  if (current) tokens.push(current);
  return tokens;
}

export function basenameCommand(token) {
  if (!token) return '';
  let value = String(token).replace(/^&+/, '');
  value = value.replace(/\\/g, '/');
  const base = value.split('/').pop() || value;
  return base.replace(/\.exe$/i, '').toLowerCase();
}

export function splitWords(token) {
  return String(token || '').split(/\s+/).filter(Boolean);
}
