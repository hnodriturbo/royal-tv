/**
 * check-i18n-keys.mjs
 * ===================
 * 🔍 Cross-check next-intl keys in React UI code:
 * - Reads en.json & is.json
 * - Flattens them into "dot.notation.keys"
 * - Scans project files under src/
 * - Reports keys missing in en.json or is.json
 * - Ignores API/server/socket/event constants
 */

import { promises as fs } from 'fs';
import path from 'path';

// 🧭 Paths (adjust if you move JSON files)
const projectRoot = process.cwd();
const enFile = path.join(projectRoot, 'src/language/en/en.json');
const isFile = path.join(projectRoot, 'src/language/is/is.json');
const srcDir = path.join(projectRoot, 'src');

// 🧹 Flatten JSON into dot-notation keys
function flatten(obj, prefix = '', res = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      flatten(v, newKey, res);
    } else {
      res[newKey] = v;
    }
  }
  return res;
}

// 🔍 Extract t('…') calls
function extractKeys(source) {
  const regex = /t\s*\(\s*['"]([^'"]+)['"]/g;
  const keys = [];
  let match;
  while ((match = regex.exec(source))) {
    keys.push(match[1]);
  }
  return keys;
}

// 📂 Recursively collect code files
async function collectFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next', 'dist', 'build', '.turbo'].includes(entry.name)) continue;
      files.push(...(await collectFiles(fullPath)));
    } else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

// 🚫 Ignore patterns (headers, api urls, socket events, time formats, etc.)
const ignorePatterns = [
  /^x-/i,
  /^\/api\//,
  /^https?:\/\//,
  /^HH:mm$/,
  /^,?$/, // empty/commas flagged wrongly
  /^[a-z_]+$/i // single-word constants like send_message, logout, etc.
];

function shouldIgnore(key) {
  return ignorePatterns.some((pattern) => pattern.test(key));
}

async function main() {
  const en = JSON.parse(await fs.readFile(enFile, 'utf8'));
  const is = JSON.parse(await fs.readFile(isFile, 'utf8'));

  const enKeys = Object.keys(flatten(en));
  const isKeys = Object.keys(flatten(is));

  const allFiles = await collectFiles(srcDir);

  const missing = [];

  for (const file of allFiles) {
    // Only scan **UI-ish code**: skip API routes & server files
    if (/src[\/\\]app[\/\\]api/.test(file) || /src[\/\\](lib|server|hooks)/.test(file)) {
      continue;
    }

    const content = await fs.readFile(file, 'utf8');
    const keys = extractKeys(content);
    for (const key of keys) {
      if (shouldIgnore(key)) continue;

      const inEn = enKeys.includes(key);
      const inIs = isKeys.includes(key);
      if (!inEn || !inIs) {
        missing.push({
          file: path.relative(projectRoot, file),
          key,
          missingIn: !inEn && !inIs ? 'both' : !inEn ? 'en.json' : 'is.json',
        });
      }
    }
  }

  if (missing.length === 0) {
    console.log('✅ All translation keys exist in en.json and is.json');
  } else {
    console.log('❌ Missing translation keys:');
    for (const m of missing) {
      console.log(`- ${m.file}: "${m.key}" missing in ${m.missingIn}`);
    }
  }
}

main().catch((err) => {
  console.error('Error running script:', err);
  process.exit(1);
});
