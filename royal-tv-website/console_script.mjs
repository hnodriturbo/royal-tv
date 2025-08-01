// ==========================================
// console_script.mjs (no glob, ESM-native)
// ------------------------------------------
// Usage: node console_script.mjs
// ==========================================

import { promises as fs } from 'fs';
import path from 'path';

const PROJECT_ROOTS = ['.']; // Scans entire project
const IGNORE_FOLDERS = ['node_modules', '.next', 'out', 'dist', '.git', 'prisma'];
const CONSOLE_METHODS = ['log', 'error', 'warn', 'info', 'debug', 'trace'];
const FILE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

// Recursively scan all folders for files
async function getAllFiles(dir) {
  let files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORE_FOLDERS.includes(entry.name)) continue;
      files = files.concat(await getAllFiles(path.join(dir, entry.name)));
    } else if (FILE_EXTENSIONS.includes(path.extname(entry.name))) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

// Helper: is this file in src/server (or subfolders)?
function needsRelativeImport(filePath) {
  const normalized = filePath.replace(/\\/g, '/'); // windows fix
  return normalized.includes('/src/server/');
}

async function refactorFile(filePath) {
  let contents = await fs.readFile(filePath, 'utf8');
  let changed = false;

  // 1. Replace all console.[method](...) with logger.[method](...)
  CONSOLE_METHODS.forEach((method) => {
    const regex = new RegExp(`console\\.${method}\\s*\\(`, 'g');
    if (regex.test(contents)) {
      contents = contents.replace(regex, `logger.${method}(`);
      changed = true;
    }
  });

  // 2. If logger is used but import is missing, add the correct import
  if (changed && !contents.includes('import logger from')) {
    const lines = contents.split('\n');
    // Find the index of the first import statement
    const firstImportIndex = lines.findIndex((line) => line.trim().startsWith('import '));
    // Choose correct import path
    const importStatement = needsRelativeImport(filePath)
      ? "import logger from '../lib/logger';"
      : "import logger from '@/lib/logger';";
    if (firstImportIndex !== -1) {
      lines.splice(firstImportIndex, 0, importStatement);
    } else {
      // No import found? Add at the top
      lines.unshift(importStatement);
    }
    contents = lines.join('\n');
  }

  // 3. Save changes if any
  if (changed) {
    await fs.writeFile(filePath, contents, 'utf8');
    console.log(`✅ Refactored ${filePath}`);
  }
}

async function main() {
  const roots = PROJECT_ROOTS;
  let files = [];
  for (const root of roots) {
    files = files.concat(await getAllFiles(root));
  }
  console.log(`Found ${files.length} JS/TS files to check.`);
  for (const file of files) {
    await refactorFile(file);
  }
  console.log('🚀 Logger refactor complete!');
}

main();
