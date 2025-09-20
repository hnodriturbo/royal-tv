// scan-bad-buttons.mjs
// 🧹 Crawl src/ for suspicious <button> children that might cause React #130

import fs from 'fs';
import path from 'path';

const root = 'src';

function crawl(dir) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) crawl(full);
    else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      const src = fs.readFileSync(full, 'utf8');
      scanFile(full, src);
    }
  }
}

// very rough: finds <button ...> … </button> blocks
const buttonRegex = /<button\b[^>]*>([\s\S]*?)<\/button>/gi;

// detect suspicious inner children
function isSuspicious(inner) {
  // ignore whitespace
  const trimmed = inner.trim();

  // safe cases: string literals, simple {t('…')}, simple vars
  if (/^{\s*t\([^)]*\)\s*}$/.test(trimmed)) return false;
  if (/^{\s*[A-Za-z0-9_.]+?\s*}$/.test(trimmed)) return false;
  if (/^$/.test(trimmed)) return false;

  // suspicious if it contains just {}
  if (/^{\s*[^}]+\s*}$/.test(trimmed)) {
    // could be an object literal or function call
    if (/{\s*{/.test(trimmed)) return true;
  }

  // suspicious if it’s JSX expression with object-like structure
  if (/{\s*[^}]+\s*}/.test(trimmed) && /[:{]/.test(trimmed)) {
    return true;
  }

  // also suspicious if multiline content with <> fragments but no text
  if (trimmed.startsWith('{') && !trimmed.includes('t(')) {
    return true;
  }

  return false;
}

function scanFile(filename, src) {
  let match;
  while ((match = buttonRegex.exec(src)) !== null) {
    const inner = match[1];
    if (isSuspicious(inner)) {
      console.log('🚨 Suspicious <button> in', filename);
      console.log(
        inner
          .split('\n')
          .map((l) => '   ' + l)
          .join('\n')
      );
      console.log('----');
    }
  }
}

crawl(root);
