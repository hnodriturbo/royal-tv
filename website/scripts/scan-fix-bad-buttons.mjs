/**
 * fix-bad-buttons.mjs
 * ===================
 * 🛡️ Wrap risky <button> children with SafeString(...) to prevent React #130.
 *
 * ✅ Handles:
 *   • {expr} directly inside <button>…</button>
 *   • <button><span>{expr}</span></button>
 *   • Complex expressions (?:, &&, calls, identifiers, member expr, etc.)
 *
 * 🚫 Skips:
 *   • Already SafeString(expr, ..)
 *   • String(expr) / Number(expr)
 *   • Pure literals (string/number) or template w/o ${}
 *   • JSX elements (already valid React nodes)
 *
 * 🧰 Usage
 *   1) Save your scan output:
 *        node scripts/scan-massive.mjs > /tmp/scan.txt
 *   2) Run the fixer:
 *        node scripts/fix-bad-buttons.mjs --from-scan /tmp/scan.txt
 *      (or pass files directly)
 *
 * 💾 Writes in-place and creates .bak backup per file.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';
import * as t from '@babel/types';

const traverse = traverseModule.default || traverseModule;
const generate = generateModule.default || generateModule;

// ========================
// 🔧 Config
// ========================
const HELPER_IMPORT_PATH = '@/lib/ui/SafeString'; // adjust if file is lowercase
const HELPER_NAME = 'SafeString';
const LOG_ALL = true; // 📝 log even if file unchanged

// ========================
// 🧭 CLI args
// ========================
const args = process.argv.slice(2);
const fromScanIdx = args.indexOf('--from-scan');
const filesIdx = args.indexOf('--files');

let targetFiles = [];

if (fromScanIdx !== -1) {
  const scanPath = args[fromScanIdx + 1];
  if (!scanPath) {
    console.error('❌ --from-scan requires a path to the scan output file');
    process.exit(1);
  }
  const scanText = await fs.readFile(scanPath, 'utf8');
  const set = new Set();
  for (const line of scanText.split('\n')) {
    const m = line.match(/^(\/.+\.(?:js|jsx|tsx))$/);
    if (m) set.add(m[1]);
  }
  targetFiles = [...set];
} else if (filesIdx !== -1) {
  targetFiles = args.slice(filesIdx + 1).filter((a) => !a.startsWith('--'));
} else {
  console.error('❌ Provide --from-scan <scan.txt> or --files <a.js> <b.js> ...');
  process.exit(1);
}

if (targetFiles.length === 0) {
  console.log('✅ No files to process.');
  process.exit(0);
}

// ========================
// 🧩 Helpers
// ========================
function isObviouslySafe(node) {
  if (!node) return true;
  if (t.isStringLiteral(node) || t.isNumericLiteral(node)) return true;
  if (t.isTemplateLiteral(node) && node.expressions.length === 0) return true;
  return false;
}

function isAlreadyWrapped(node) {
  return t.isCallExpression(node) && t.isIdentifier(node.callee, { name: HELPER_NAME });
}

function isStringOrNumberCtor(node) {
  return (
    t.isCallExpression(node) &&
    t.isIdentifier(node.callee) &&
    (node.callee.name === 'String' || node.callee.name === 'Number')
  );
}

function wrapWithHelper(expr) {
  return t.callExpression(t.identifier(HELPER_NAME), [expr, t.stringLiteral('')]);
}

function ensureHelperImport(ast) {
  let hasImport = false;
  for (const node of ast.program.body) {
    if (
      t.isImportDeclaration(node) &&
      node.source.value === HELPER_IMPORT_PATH &&
      node.specifiers.some((s) => t.isImportSpecifier(s) && s.imported.name === HELPER_NAME)
    ) {
      hasImport = true;
      break;
    }
  }
  if (!hasImport) {
    const importDecl = t.importDeclaration(
      [t.importSpecifier(t.identifier(HELPER_NAME), t.identifier(HELPER_NAME))],
      t.stringLiteral(HELPER_IMPORT_PATH)
    );
    ast.program.body.unshift(importDecl);
  }
}

// ========================
// 🧠 Transform
// ========================
async function transformFile(filePath) {
  const code = await fs.readFile(filePath, 'utf8');

  const ast = parse(code, {
    sourceType: 'module',
    plugins: [
      'jsx',
      'typescript',
      'classProperties',
      'classPrivateProperties',
      'classPrivateMethods',
      'objectRestSpread',
      'optionalChaining',
      'nullishCoalescingOperator',
      'topLevelAwait'
    ]
  });

  let mutated = false;

  traverse(ast, {
    JSXElement(path) {
      const opening = path.node.openingElement;
      if (!t.isJSXIdentifier(opening.name) || opening.name.name !== 'button') return;

      for (const child of path.node.children) {
        // Case 1: <button>{EXPR}</button>
        if (t.isJSXExpressionContainer(child)) {
          const expr = child.expression;
          if (!expr || t.isJSXEmptyExpression(expr)) continue; // 🛡️ skip {}
          if (
            !isObviouslySafe(expr) &&
            !isAlreadyWrapped(expr) &&
            !isStringOrNumberCtor(expr) &&
            !t.isJSXElement(expr)
          ) {
            child.expression = wrapWithHelper(expr);
            mutated = true;
          }
        }

        // Case 2: <button><span>{EXPR}</span></button>
        if (t.isJSXElement(child)) {
          const isSpan =
            t.isJSXIdentifier(child.openingElement.name) &&
            child.openingElement.name.name === 'span';
          if (isSpan) {
            for (const grand of child.children) {
              if (t.isJSXExpressionContainer(grand)) {
                const expr = grand.expression;
                if (!expr || t.isJSXEmptyExpression(expr)) continue; // 🛡️ skip {}
                if (
                  !isObviouslySafe(expr) &&
                  !isAlreadyWrapped(expr) &&
                  !isStringOrNumberCtor(expr) &&
                  !t.isJSXElement(expr)
                ) {
                  grand.expression = wrapWithHelper(expr);
                  mutated = true;
                }
              }
            }
          }
        }
      }
    }
  });

  if (!mutated) {
    if (LOG_ALL) console.log('ℹ️  Skipped (already safe):', filePath);
    return false;
  }

  ensureHelperImport(ast);

  await fs.writeFile(filePath + '.bak', code, 'utf8');
  const output = generate(ast, { retainLines: true }, code).code;
  await fs.writeFile(filePath, output, 'utf8');

  console.log('✏️  Patched:', filePath);
  return true;
}

// ========================
// 🚀 Run
// ========================
let changed = 0;
for (const abs of targetFiles) {
  const ok = await transformFile(abs);
  if (ok) changed++;
}
console.log(`\n✅ Done. Files changed: ${changed}/${targetFiles.length}`);
console.log('💾 Backups: *.bak next to each modified file.');
