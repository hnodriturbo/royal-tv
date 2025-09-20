#!/usr/bin/env node
/**
 * =========================================================
 * scan-notFound.mjs
 * 🔎 Find notFound() calls, show guards + imports (JSX-safe)
 * - Uses @babel/parser (handles JSX/TS)
 * - Reports only files under /src
 * =========================================================
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';

const traverse = traverseModule.default; // ✅ grab default export

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.join(process.cwd(), 'src');

// 🧰 tiny file walker (no extra deps)
function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

// 🧩 parse options to handle modern syntax
const PARSE_OPTS = {
  sourceType: 'module',
  allowReturnOutsideFunction: true,
  plugins: [
    'jsx',
    'typescript',
    'importAssertions',
    'topLevelAwait',
    'classProperties',
    'classPrivateProperties',
    'classPrivateMethods',
    'objectRestSpread',
    'dynamicImport',
    ['decorators', { decoratorsBeforeExport: true }]
  ]
};

function analyzeFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  let ast;
  try {
    ast = parse(code, PARSE_OPTS);
  } catch (e) {
    console.error(`❌ Failed to parse ${filePath}: ${e.message}`);
    return;
  }

  const imports = []; // 📦 list of imports
  const hits = []; // 🎯 notFound reports

  traverse(
    ast,
    {
      ImportDeclaration(p) {
        const src = p.node.source.value;
        const names = p.node.specifiers.map((s) => s.local.name);
        imports.push({ src, names });
      },
      CallExpression(p) {
        const callee = p.node.callee;
        if (callee && callee.type === 'Identifier' && callee.name === 'notFound') {
          // 🧪 Try to find a parent IfStatement guard like: if (!foo) return notFound()
          const ifParent = p.findParent((pp) => pp.isIfStatement());
          let guard = null;
          if (ifParent) {
            guard = code.slice(ifParent.node.test.start, ifParent.node.test.end).trim();
          }
          const { line, column } = p.node.loc.start;
          hits.push({ line, column, guard });
        }
      }
    },
    undefined,
    code
  );

  if (hits.length) {
    console.log(`\n📄 ${filePath}`);
    if (imports.length) {
      console.log(
        '  📦 Imports:',
        imports.map(({ src, names }) => `${names.join(', ')} ← ${src}`).join(' | ')
      );
    }
    for (const h of hits) {
      console.log(
        `  🔎 notFound() at ${h.line}:${h.column}${h.guard ? `  (guard: ${h.guard})` : ''}`
      );
    }
  }
}

const files = walk(SRC_DIR);
files.forEach(analyzeFile);
