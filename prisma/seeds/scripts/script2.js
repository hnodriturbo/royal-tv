/**
 * ================================================
 * 🔍 script2.js — Import/Export Consistency Checker
 * -----------------------------------------------
 * - Scans files (JS/TS/JSX/TSX) for imports/exports
 * - Ensures that imported symbols exist in source file
 * - Helps catch "Element type invalid: object" errors
 *
 * Usage:
 *   
 * ================================================
 */

import fs from 'fs';
import path from 'path';
import { globby } from 'globby';
import * as acorn from 'acorn';
import jsx from 'acorn-jsx';
import tsPlugin from 'acorn-typescript';
import * as walk from 'acorn-walk';

// 🧩 parser with JSX + TS support
const Parser = acorn.Parser.extend(jsx(), tsPlugin());

// 📦 parse helper
function parse(code, filename) {
  try {
    return Parser.parse(code, {
      ecmaVersion: 'latest',
      sourceType: 'module',
      locations: true
    });
  } catch (err) {
    console.error(`⚠️ Failed to parse ${filename}: ${err.message}`);
    return null;
  }
}

// 🗂️ collect exports from a file
function collectExports(ast) {
  const exports = new Set();

  walk.simple(ast, {
    ExportNamedDeclaration(node) {
      if (node.declaration) {
        if (node.declaration.id) {
          exports.add(node.declaration.id.name);
        } else if (node.declaration.declarations) {
          for (const decl of node.declaration.declarations) {
            if (decl.id && decl.id.name) {
              exports.add(decl.id.name);
            }
          }
        }
      }
      if (node.specifiers) {
        for (const s of node.specifiers) {
          exports.add(s.exported.name);
        }
      }
    },
    ExportDefaultDeclaration() {
      exports.add('default');
    }
  });

  return exports;
}

// 📦 collect imports from a file
function collectImports(ast) {
  const imports = [];
  walk.simple(ast, {
    ImportDeclaration(node) {
      const module = node.source.value;
      for (const spec of node.specifiers) {
        imports.push({
          local: spec.local.name,
          imported:
            spec.type === 'ImportDefaultSpecifier'
              ? 'default'
              : spec.imported.name,
          module
        });
      }
    }
  });
  return imports;
}

// 🔍 resolve relative import → absolute path
function resolveImportPath(fromFile, moduleName) {
  if (moduleName.startsWith('.') || moduleName.startsWith('/')) {
    const resolved = path.resolve(path.dirname(fromFile), moduleName);
    const candidates = [
      resolved,
      resolved + '.js',
      resolved + '.jsx',
      resolved + '.ts',
      resolved + '.tsx',
      path.join(resolved, 'index.js'),
      path.join(resolved, 'index.jsx'),
      path.join(resolved, 'index.ts'),
      path.join(resolved, 'index.tsx')
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
  }
  return null; // skip node_modules
}

// 🏃 main runner
async function main() {
  const pattern = process.argv[2];
  if (!pattern) {
    console.error('❌ Please pass a glob pattern, e.g. src/**/*.{js,jsx}');
    process.exit(1);
  }

  const files = await globby(pattern, {
    gitignore: true,
    absolute: true
  });

  const exportMap = new Map();

  // Pass 1: collect all exports
  for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    const ast = parse(code, file);
    if (!ast) continue;
    const exps = collectExports(ast);
    exportMap.set(file, exps);
  }

  let errors = 0;

  // Pass 2: check imports
  for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    const ast = parse(code, file);
    if (!ast) continue;
    const imps = collectImports(ast);

    for (const imp of imps) {
      const targetPath = resolveImportPath(file, imp.module);
      if (!targetPath) continue;

      const exports = exportMap.get(targetPath);
      if (!exports) continue;

      if (!exports.has(imp.imported)) {
        console.error(
          `❌ Invalid import in ${file}\n   → "${imp.imported}" not found in ${imp.module}`
        );
        errors++;
      } else {
        console.log(
          `✅ ${file} imports { ${imp.imported} } from ${imp.module}`
        );
      }
    }
  }

  if (errors === 0) {
    console.log('\n🎉 All imports look valid!');
  } else {
    console.log(`\n⚠️ Found ${errors} invalid imports.`);
  }
}

main();
