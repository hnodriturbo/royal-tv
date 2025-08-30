// scan.mjs
import fs from 'fs';
import path from 'path';
import { parse } from '@babel/parser';

// ⬇️ load traverse dynamically
const traverseModule = await import('@babel/traverse');
const traverse = traverseModule.default; // this is the function
console.log('typeof traverse =', typeof traverse);
// 🎯 Directories to crawl (narrowed to providers + context for React components)
const TARGET_DIRS = [path.resolve('./src/components/providers'), path.resolve('./src/context')];

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      walk(full, files);
    } else if (/\.(jsx?|tsx?)$/.test(file)) {
      files.push(full);
    }
  }
  return files;
}

function checkFile(file) {
  const code = fs.readFileSync(file, 'utf8');
  try {
    const ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript']
    });

    let defaultExportType = null;

    traverse(ast, {
      ExportDefaultDeclaration(path) {
        defaultExportType = path.node.declaration.type;
      }
    });

    if (
      defaultExportType &&
      defaultExportType !== 'FunctionDeclaration' &&
      defaultExportType !== 'ArrowFunctionExpression'
    ) {
      console.warn(`❌ ${file} → default export is ${defaultExportType}, not a function`);
    } else if (defaultExportType) {
      console.log(`✅ ${file} → default export is a valid function`);
    }
  } catch (err) {
    console.error(`⚠️ Parse failed for ${file}:`, err.message);
  }
}

for (const dir of TARGET_DIRS) {
  const files = walk(dir);
  for (const file of files) {
    checkFile(file);
  }
}
