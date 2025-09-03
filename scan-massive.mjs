/**
 * scan-bad-buttons.mjs
 * ====================
 * 🔎 Crawl .js/.jsx/.tsx files and flag risky <button> children that can trigger React #130.
 *
 * 🎯 What it detects
 *   • <button> with a child JSXExpressionContainer that is NOT clearly a literal/string/number
 *   • <button><span>{…non-primitive…}</span></button> patterns
 *
 * 🚫 Defaults
 *   • Skips node_modules (use --include-node-modules to include)
 *
 * 🧰 Usage
 *   node scripts/scan-bad-buttons.mjs
 *   node scripts/scan-bad-buttons.mjs --include-node-modules
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse'; // ✅ correct ESM import for traverse

// 🌍 Resolve project root from this script's location
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// ⚙️ CLI flags
const includeNodeModules = process.argv.includes('--include-node-modules');

// 📁 file globs to search
const validExtensions = new Set(['.js', '.jsx', '.tsx']);

// 📦 tiny helper: read all files recursively
async function readAllFilesRecursively(startDir) {
  /** 🧺 collected file paths */
  const collectedFilePaths = [];
  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      const resolvedPath = path.join(currentDir, entry.name);
      // 🚧 skip node_modules unless explicitly asked
      if (!includeNodeModules && entry.name === 'node_modules') continue;
      // 🚧 skip .next build output
      if (entry.name === '.next') continue;
      if (entry.isDirectory()) {
        await walk(resolvedPath);
      } else {
        const extension = path.extname(entry.name);
        if (validExtensions.has(extension)) {
          collectedFilePaths.push(resolvedPath);
        }
      }
    }
  }
  await walk(startDir);
  return collectedFilePaths;
}

// 🧪 check if a JSX node is a <button>
function isButtonJSX(jsxNodeName) {
  // 🧠 handle identifiers (button) and member expressions (not expected here)
  if (!jsxNodeName) return false;
  if (jsxNodeName.type === 'JSXIdentifier') return jsxNodeName.name === 'button';
  return false;
}

// 🧪 check if a child is obviously "safe" to render
function isObviouslySafeExpression(expr) {
  // ✅ StringLiteral / NumericLiteral → safe
  if (expr.type === 'StringLiteral' || expr.type === 'NumericLiteral') return true;

  // ✅ TemplateLiteral with only literal quasis → safe
  if (expr.type === 'TemplateLiteral') {
    return expr.expressions.length === 0; // no ${}
  }

  // 🚧 everything else can be risky (Identifier, MemberExpression, CallExpression, etc.)
  return false;
}

// 🔍 scan one file for risky buttons
async function scanFileForRiskyButtons(filePath) {
  const sourceCode = await fs.readFile(filePath, 'utf8');

  let ast;
  try {
    ast = parse(sourceCode, {
      sourceType: 'module',
      plugins: [
        'jsx',
        'typescript', // harmless even if you don't use TS, helps on mixed repos
        'classProperties',
        'classPrivateProperties',
        'classPrivateMethods',
        'objectRestSpread',
        'optionalChaining',
        'nullishCoalescingOperator',
        'topLevelAwait'
      ]
    });
  } catch (error) {
    console.warn(`⚠️ Parse failed for ${filePath}: ${error.message}`);
    return [];
  }

  /** 🧾 collected findings for this file */
  const findings = [];

  traverse.default(ast, {
    JSXElement(pathNode) {
      const openingElement = pathNode.node.openingElement;
      if (!isButtonJSX(openingElement.name)) return;

      // 🧩 inspect children inside <button>...</button>
      for (const child of pathNode.node.children) {
        // 🧱 <button> text child → safe
        if (child.type === 'JSXText') continue;

        // 🧩 <button>{EXPR}</button>
        if (child.type === 'JSXExpressionContainer') {
          const expr = child.expression;
          if (!isObviouslySafeExpression(expr)) {
            const { start, end } = child;
            findings.push({
              kind: 'button-expression',
              loc: `${start ?? '?'}-${end ?? '?'}`,
              hint: 'JSXExpressionContainer in <button> is not a plain string/number.'
            });
          }
        }

        // 🧩 <button><span>{EXPR}</span></button>
        if (child.type === 'JSXElement') {
          const innerOpen = child.openingElement;
          const isSpan =
            innerOpen?.name?.type === 'JSXIdentifier' && innerOpen.name.name === 'span';

          if (isSpan) {
            for (const grandChild of child.children) {
              if (grandChild.type === 'JSXExpressionContainer') {
                const expr = grandChild.expression;
                if (!isObviouslySafeExpression(expr)) {
                  const { start, end } = grandChild;
                  findings.push({
                    kind: 'button-span-expression',
                    loc: `${start ?? '?'}-${end ?? '?'}`,
                    hint: '<span> child in <button> contains a risky expression.'
                  });
                }
              }
            }
          }
        }
      }
    }
  });

  return findings.map((finding) => ({ filePath, ...finding }));
}

// 🚀 main runner
(async function run() {
  console.log('🔎 Scanning for risky <button> children…');
  console.log(includeNodeModules ? '📦 Including node_modules' : '🚫 Skipping node_modules');

  const searchRoot = projectRoot;
  const allFiles = await readAllFilesRecursively(searchRoot);

  const allFindings = [];
  for (const filePath of allFiles) {
    const fileFindings = await scanFileForRiskyButtons(filePath);
    allFindings.push(...fileFindings);
  }

  if (allFindings.length === 0) {
    console.log('✅ No risky <button> children found.');
    return;
  }

  // 🧾 pretty print results
  for (const f of allFindings) {
    console.log(`${f.filePath}`);
    console.log(`   → ${f.kind} @ ${f.loc}  ${f.hint}`);
  }

  console.log(`\n📊 Total findings: ${allFindings.length}`);
})();
