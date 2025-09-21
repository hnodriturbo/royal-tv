// scripts/script-check-imports.js
import { globby } from 'globby';
import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
const traverse = traverseModule.default;

// Ignore node_modules and build artifacts
const DEFAULT_IGNORE = ['**/node_modules/**', '**/.next/**', '**/dist/**', '**/build/**'];

async function getFiles(patterns) {
  // globby returns a promise, resolves to matching file paths
  return await globby(patterns, { ignore: DEFAULT_IGNORE, absolute: true });
}

function getExportsAndImports(code, filePath) {
  const exports = new Set();
  const imports = [];

  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });

  traverse(ast, {
    ExportNamedDeclaration(path) {
      if (path.node.declaration) {
        if (path.node.declaration.id) {
          exports.add(path.node.declaration.id.name);
        } else if (path.node.declaration.declarations) {
          path.node.declaration.declarations.forEach((d) =>
            d.id && d.id.name && exports.add(d.id.name)
          );
        }
      }
      if (path.node.specifiers) {
        path.node.specifiers.forEach((s) => exports.add(s.exported.name));
      }
    },
    ExportDefaultDeclaration() {
      exports.add('default');
    },
    ImportDeclaration(path) {
      const source = path.node.source.value;
      path.node.specifiers.forEach((s) => {
        if (s.type === 'ImportDefaultSpecifier') {
          imports.push({ name: 'default', source, loc: s.loc?.start });
        } else if (s.type === 'ImportSpecifier') {
          imports.push({ name: s.imported.name, source, loc: s.loc?.start });
        }
      });
    },
  });

  return { exports, imports };
}

async function main(patterns) {
  const files = await getFiles(patterns);

  const moduleMap = new Map();

  // First pass: collect exports
  for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    try {
      const { exports } = getExportsAndImports(code, file);
      moduleMap.set(file, { exports, imports: [] });
    } catch (err) {
      console.error(`⚠️ Failed to parse ${file}: ${err.message}`);
    }
  }

  // Second pass: collect imports
  for (const file of files) {
    const code = fs.readFileSync(file, 'utf8');
    try {
      const { imports } = getExportsAndImports(code, file);
      moduleMap.get(file).imports = imports;
    } catch {
      /* already reported */
    }
  }

  // Check imports against exports
  for (const [file, { imports }] of moduleMap.entries()) {
    for (const imp of imports) {
      if (!imp.source.startsWith('.') && !imp.source.startsWith('@/')) continue;

      // Resolve relative path
      const resolvedPath = imp.source.startsWith('@/')
        ? path.resolve(process.cwd(), 'src', imp.source.slice(2)) // assumes @/ points to src
        : path.resolve(path.dirname(file), imp.source);

      let targetFile = null;
      for (const ext of ['.js', '.jsx', '.ts', '.tsx']) {
        if (fs.existsSync(resolvedPath + ext)) {
          targetFile = resolvedPath + ext;
          break;
        }
      }
      if (!targetFile && fs.existsSync(resolvedPath)) {
        targetFile = resolvedPath;
      }
      if (!targetFile || !moduleMap.has(targetFile)) continue;

      const targetExports = moduleMap.get(targetFile).exports;
      if (!targetExports.has(imp.name)) {
        console.error(
          `❌ Invalid import in ${file}:\n   → "${imp.name}" not exported by ${imp.source} (line ${imp.loc?.line || '?'})`
        );
      }
    }
  }
}

// Run with provided patterns or default to src
const patterns = process.argv[2] || 'src/**/*.{js,jsx,ts,tsx}';
main(patterns);
