/**
 * scripts/scan-buttons.mjs
 * ------------------------
 * 🔎 Find risky <button> children that could trigger React #130
 * - Flags bare variables/props/objects rendered inside buttons
 * - Ignores safe cases: String(...), t(...), literals, JSX
 *
 * Usage:
 *   node scan-buttons.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
const traverse = traverseModule.default;

const exts = new Set(['.js', '.jsx', '.ts', '.tsx']);
// 📂 Now scan the entire project root (not just /src)
const root = process.cwd();

const files = [];
function walk(dir) {
  for (const name of fs.readdirSync(dir)) {
    if (['node_modules', '.next', 'build', 'dist', 'coverage'].includes(name)) {
      continue; // 🚫 skip junk dirs
    }
    const fp = path.join(dir, name);
    const st = fs.statSync(fp);
    if (st.isDirectory()) walk(fp);
    else if (exts.has(path.extname(fp))) files.push(fp);
  }
}
walk(root);

function loc(n) {
  const l = n?.loc?.start?.line;
  return typeof l === 'number' ? `:${l}` : '';
}

function looksSafe(expr) {
  if (!expr) return true;

  switch (expr.type) {
    case 'StringLiteral':
    case 'NumericLiteral':
    case 'BooleanLiteral':
    case 'NullLiteral':
    case 'TemplateLiteral':
      return true;

    case 'JSXElement':
    case 'JSXFragment':
      return true;

    case 'CallExpression': {
      const callee = expr.callee;
      if (callee.type === 'Identifier' && ['String', 'Number', 'Boolean'].includes(callee.name))
        return true;
      if (callee.type === 'Identifier' && callee.name === 't') return true;
      if (callee.type === 'MemberExpression' && callee.property?.name === 'toString') return true;
      return false; // 🚨 unknown call
    }

    case 'ConditionalExpression':
      return looksSafe(expr.consequent) && looksSafe(expr.alternate);

    case 'LogicalExpression':
      return looksSafe(expr.right);

    case 'Identifier':
    case 'MemberExpression':
      return false; // 🚨 bare variable/object

    default:
      return false;
  }
}

for (const file of files) {
  const code = fs.readFileSync(file, 'utf8');
  let ast;
  try {
    ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'classProperties', 'dynamicImport']
    });
  } catch {
    continue;
  }

  traverse(ast, {
    JSXElement(pathNode) {
      const opening = pathNode.node.openingElement;
      if (opening?.name?.type === 'JSXIdentifier' && opening.name.name === 'button') {
        for (const child of pathNode.node.children) {
          if (child.type === 'JSXExpressionContainer') {
            const expr = child.expression;
            if (!looksSafe(expr)) {
              console.log(
                `${file}${loc(child)}  🚨 suspicious <button> child -> likely object/prop`
              );
              break;
            }
          }
        }
      }
    }
  });
}
