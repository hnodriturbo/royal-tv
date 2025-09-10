#!/usr/bin/env node
/**
 * Replace all usages of `logger` with `console` across the project.
 * - console.foo(...)  -> console.foo(...)
 * - console.foo(...)   -> console.foo(...)
 * - console[...]       -> console[...]
 * - remove ES/CJS imports of the logger module
 *
 * Usage:
 *   node scripts/replace-logger-with-console.mjs [rootDir=.]
 *
 * Tips:
 *   - Commit or back up before running.
 *   - After running, consider: npx eslint --fix
 */

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(process.argv[2] || '.');
const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.next',
  'out',
  'build',
  'dist',
  'coverage',
  '.turbo',
  '.vercel'
]);

const EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs']);

// Paths that end with console.js should be skipped to avoid trashing the file itself.
function isLoggerFile(p) {
  const normalized = p.replaceAll('\\', '/');
  return /\/logger(\.m?js|\.cjs)?$/i.test(normalized);
}

async function walk(dir, files = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!IGNORED_DIRS.has(e.name)) {
        await walk(full, files);
      }
      continue;
    }
    if (EXTS.has(path.extname(e.name))) files.push(full);
  }
  return files;
}

function transformImports(src) {
  // Remove: import logger from '.../logger'
  src = src.replace(
    /^\s*import\s+logger\s+from\s+(['"][^'"]*\/logger(?:\.m?js|\.cjs)?['"])\s*;?\s*$/gm,
    ''
  );

  // Change: import logger, { a, b } from '.../logger'  -> import { a, b } from '.../logger'
  src = src.replace(
    /^\s*import\s+logger\s*,\s*{([^}]*)}\s+from\s+(['"][^'"]*\/logger(?:\.m?js|\.cjs)?['"])\s*;?\s*$/gm,
    (_m, named, from) => {
      const cleaned = named
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .join(', ');
      return cleaned ? `import { ${cleaned} } from ${from};` : '';
    }
  );

  // Edge case: import { logger, x } from '.../logger'  -> remove `logger` only
  src = src.replace(
    /^\s*import\s*{([^}]*)}\s*from\s+(['"][^'"]*\/logger(?:\.m?js|\.cjs)?['"])\s*;?\s*$/gm,
    (_m, named, from) => {
      const keep = named
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .filter((s) => !/^logger(\s+as\s+\w+)?$/.test(s));
      return keep.length ? `import { ${keep.join(', ')} } from ${from};` : '';
    }
  );

  // Remove: const logger = require('.../logger')
  src = src.replace(
    /^\s*const\s+logger\s*=\s*require\(\s*['"][^'"]*\/logger(?:\.m?js|\.cjs)?['"]\s*\)\s*;?\s*$/gm,
    ''
  );

  return src;
}

function transformLoggerUsages(src) {
  // console.foo -> console.foo  (drop optional chain; console is always defined)
  src = src.replace(/\blogger\?\./g, 'console.');

  // console.foo -> console.foo
  src = src.replace(/\blogger\./g, 'console.');

  // console[ -> console[
  src = src.replace(/\blogger\[/g, 'console[');

  return src;
}

async function processFile(file) {
  if (isLoggerFile(file)) return { file, changed: false };

  const before = await fs.readFile(file, 'utf8');
  let after = before;

  after = transformImports(after);
  after = transformLoggerUsages(after);

  if (after !== before) {
    await fs.writeFile(file, after, 'utf8');
    return { file, changed: true };
  }
  return { file, changed: false };
}

(async () => {
  console.log(`🔎 Scanning ${ROOT} ...`);
  const files = await walk(ROOT);
  let changedCount = 0;

  for (const f of files) {
    const { changed } = await processFile(f);
    if (changed) {
      changedCount++;
      console.log(`✏️  Updated: ${path.relative(ROOT, f)}`);
    }
  }

  console.log(`\n✅ Done. Files updated: ${changedCount}/${files.length}`);
  console.log(`👉 Tip: run "npx eslint --fix" to clean up any lingering unused imports.`);
})().catch((err) => {
  console.error('❌ Script failed:', err);
  process.exit(1);
});
