/**
 * list-buttons-with-span.mjs
 * ==========================
 * 🔎 Find all <button> elements that contain a <span> inside them.
 *
 * 🧭 Modes
 *   • default: any descendant <span> qualifies
 *   • --immediate-only: only count <span> that are *direct* children of <button>
 *   • --only-risky: only list buttons where a <span> contains a risky {expr}
 *
 * 📌 Output
 *   <absolute file path>
 *     → button-with-span (any|immediate) @ L<line>:<col>  spans=<N> risky=<M>  class="<preview>"
 *
 * 🧰 Usage
 *   node scripts/list-buttons-with-span.mjs
 *   node scripts/list-buttons-with-span.mjs --immediate-only
 *   node scripts/list-buttons-with-span.mjs --only-risky
 *   node scripts/list-buttons-with-span.mjs --root /root/royal-tv/src
 *   node scripts/list-buttons-with-span.mjs --include-node-modules
 *
 * 🧩 Notes
 *   • ESM-friendly (Node 20/22). Handles Babel v8 exports.
 *   • Skips `.next/` by default. Skips `node_modules/` unless you pass --include-node-modules.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import * as t from '@babel/types';

const traverse = traverseModule.default || traverseModule; // 🧷 handle ESM/CJS export shapes

// ========================
// ⚙️ CLI Flags
// ========================
const args = process.argv.slice(2);
const includeNodeModules = args.includes('--include-node-modules'); // 📦 include node_modules (off by default)
const immediateOnly = args.includes('--immediate-only'); // ⛔ only direct <span> children
const onlyRisky = args.includes('--only-risky'); // 🚨 only buttons where a <span> contains risky {expr}
const rootIdx = args.indexOf('--root');
const customRoot = rootIdx !== -1 ? args[rootIdx + 1] : null;

// ========================
// 🗺️ Paths + Setup
// ========================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const startDir = customRoot ? path.resolve(customRoot) : path.join(projectRoot, 'royal-tv/src');

const validExtensions = new Set(['.js', '.jsx', '.tsx']);

// ========================
// 🧪 Helpers
// ========================
function isObviouslySafe(node) {
  // 🧘 literals + template with no expressions are safe
  if (!node) return true;
  if (t.isStringLiteral(node) || t.isNumericLiteral(node)) return true;
  if (t.isTemplateLiteral(node) && node.expressions.length === 0) return true;
  return false;
}

function isRiskyExpression(expr) {
  // 🚨 risky if it's not obvious-safe AND not JSXElement
  if (!expr || t.isJSXEmptyExpression(expr)) return false; // ignore empty {}
  if (t.isJSXElement(expr)) return false; // JSX children are fine
  return !isObviouslySafe(expr);
}

function getClassNamePreview(jsxOpeningElement) {
  // 🏷️ try to extract className="..." preview for quick ID
  if (!jsxOpeningElement?.attributes) return '';
  const classAttr = jsxOpeningElement.attributes.find(
    (attr) => t.isJSXAttribute(attr) && attr.name?.name === 'className'
  );
  if (!classAttr) return '';
  if (t.isStringLiteral(classAttr.value)) {
    const s = classAttr.value.value || '';
    return s.length > 60 ? s.slice(0, 60) + '…' : s;
  }
  if (t.isJSXExpressionContainer(classAttr.value)) {
    const expr = classAttr.value.expression;
    if (t.isStringLiteral(expr)) {
      const s = expr.value || '';
      return s.length > 60 ? s.slice(0, 60) + '…' : s;
    }
    return '[dynamic]';
  }
  return '';
}

function collectDescendantSpans(jsxElementNode) {
  // 🌳 walk the JSX subtree under this element and count all <span>
  let spanCount = 0;
  let riskyInSpans = 0;

  function visitNode(node) {
    if (!node) return;
    if (t.isJSXElement(node)) {
      const isSpan =
        t.isJSXIdentifier(node.openingElement?.name) && node.openingElement.name.name === 'span';
      if (isSpan) {
        spanCount += 1;
        // 🧪 look for {expr} children that are risky
        for (const spanChild of node.children || []) {
          if (t.isJSXExpressionContainer(spanChild)) {
            const expr = spanChild.expression;
            if (isRiskyExpression(expr)) riskyInSpans += 1;
          }
        }
      }
      // 🔁 continue recursion
      for (const child of node.children || []) {
        visitNode(child);
      }
    } else if (t.isJSXFragment(node)) {
      for (const child of node.children || []) {
        visitNode(child);
      }
    }
  }

  for (const direct of jsxElementNode.children || []) {
    visitNode(direct);
  }

  return { spanCount, riskyInSpans };
}

function collectImmediateSpans(jsxElementNode) {
  // 👀 only look at direct children <span> of the element
  let spanCount = 0;
  let riskyInSpans = 0;

  for (const child of jsxElementNode.children || []) {
    if (t.isJSXElement(child)) {
      const isSpan =
        t.isJSXIdentifier(child.openingElement?.name) && child.openingElement.name.name === 'span';
      if (isSpan) {
        spanCount += 1;
        for (const spanChild of child.children || []) {
          if (t.isJSXExpressionContainer(spanChild)) {
            const expr = spanChild.expression;
            if (isRiskyExpression(expr)) riskyInSpans += 1;
          }
        }
      }
    }
  }

  return { spanCount, riskyInSpans };
}

// ========================
// 📂 Read files recursively
// ========================
async function readAllFilesRecursively(start) {
  const collected = [];
  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const resolved = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '.next') continue; // 🚫 skip build
        if (!includeNodeModules && entry.name === 'node_modules') continue; // 🚫 skip node_modules
        await walk(resolved);
      } else {
        const ext = path.extname(entry.name);
        if (validExtensions.has(ext)) collected.push(resolved);
      }
    }
  }
  await walk(start);
  return collected;
}

// ========================
// 🔍 Scan one file
// ========================
async function scanFile(filePath) {
  const sourceCode = await fs.readFile(filePath, 'utf8');

  let ast;
  try {
    ast = parse(sourceCode, {
      sourceType: 'module',
      sourceFilename: filePath,
      allowReturnOutsideFunction: true,
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
  } catch (error) {
    console.warn(`⚠️ Parse failed for ${filePath}: ${error.message}`);
    return;
  }

  traverse(ast, {
    JSXElement(pathNode) {
      const el = pathNode.node;
      const opening = el.openingElement;
      if (!t.isJSXIdentifier(opening.name) || opening.name.name !== 'button') return;

      // 🧮 count spans (immediate vs any descendant)
      const { spanCount, riskyInSpans } = immediateOnly
        ? collectImmediateSpans(el)
        : collectDescendantSpans(el);

      if (spanCount === 0) return; // no spans found inside this button

      if (onlyRisky && riskyInSpans === 0) return; // filter to risky only

      const loc = opening.loc?.start;
      const classPreview = getClassNamePreview(opening);
      const modeLabel = immediateOnly ? 'immediate' : 'any';

      console.log(`${filePath}`);
      console.log(
        `   → button-with-span (${modeLabel}) @ L${loc?.line ?? '?'}:${loc?.column ?? '?'}  spans=${spanCount}` +
          (onlyRisky ? ` risky=${riskyInSpans}` : ` risky=${riskyInSpans}`) +
          (classPreview ? `  class="${classPreview}"` : '')
      );
    }
  });
}

// ========================
// 🚀 Run
// ========================
(async function run() {
  console.log(`🔎 Listing <button> with <span> inside…`);
  console.log(immediateOnly ? '🎯 Mode: immediate children only' : '🌲 Mode: any descendant');
  if (onlyRisky) console.log('🚨 Filtering: only spans with risky {expr}');

  const files = await readAllFilesRecursively(startDir);
  for (const filePath of files) {
    await scanFile(filePath);
  }
})();
