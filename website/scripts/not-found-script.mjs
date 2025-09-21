#!/usr/bin/env node
/**
 * scan-notFound.mjs
 * -----------------
 * 📦 Scans src/ for `notFound()` calls
 * 🔎 Shows the variable/condition guarding it
 * 📂 Prints imports in the same file
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'acorn';
import * as walk from 'acorn-walk';

const SRC_DIR = path.join(process.cwd(), 'src');

function getAllJsFiles(dir) {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const res = path.resolve(dir, entry.name);
      return entry.isDirectory() ? getAllJsFiles(res) : res;
    })
    .filter((f) => f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.tsx'));
}

function analyzeFile(filePath) {
  const code = fs.readFileSync(filePath, 'utf8');
  let ast;
  try {
    ast = parse(code, { ecmaVersion: 'latest', sourceType: 'module' });
  } catch (e) {
    console.error(`❌ Failed to parse ${filePath}:`, e.message);
    return;
  }

  const imports = [];
  const notFounds = [];

  walk.simple(
    ast,
    {
      ImportDeclaration(node) {
        imports.push({
          source: node.source.value,
          specifiers: node.specifiers.map((s) => s.local.name)
        });
      },
      CallExpression(node) {
        if (node.callee.name === 'notFound') {
          notFounds.push({
            line: node.loc.start.line,
            column: node.loc.start.column,
            arg: node.arguments[0]
              ? code.slice(node.arguments[0].start, node.arguments[0].end)
              : null
          });
        }
      },
      IfStatement(node) {
        // Capture patterns like: if (!paymentPackage) return notFound();
        const src = code.slice(node.test.start, node.test.end);
        if (
          src.includes('paymentPackage') &&
          code.slice(node.consequent.start, node.consequent.end).includes('notFound')
        ) {
          notFounds.push({
            line: node.loc.start.line,
            column: node.loc.start.column,
            guard: src
          });
        }
      }
    },
    walk.base,
    { locations: true }
  );

  if (notFounds.length) {
    console.log(`\n📄 ${filePath}`);
    console.log(
      '  Imports:',
      imports.map((i) => `${i.specifiers.join(',')} from ${i.source}`).join('; ')
    );
    notFounds.forEach((nf) => {
      console.log(`  🔎 notFound() at ${nf.line}:${nf.column} (guard: ${nf.guard || 'none'})`);
    });
  }
}

const files = getAllJsFiles(SRC_DIR);
files.forEach(analyzeFile);
