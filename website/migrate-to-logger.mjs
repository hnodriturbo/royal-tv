/**
 * =============== migrate-to-logger.mjs ===============
 * 🔄 Replaces console.* calls with logger.* in server files
 *
 * What it does:
 * 1. Finds all console.log/warn/info/debug calls in server files
 * 2. Replaces them with logger.log/warn/info/debug
 * 3. Keeps console.error as logger.error (preserves functionality)
 * 4. Adds logger import to files that need it
 *
 * Targets: src/server/**, src/lib/server/**, server.js
 * Run: node migrate-to-logger.mjs
 * =================================================
 */

import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { URL } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = __dirname; // Script is in root (website folder)

// 🎯 Target directories for migration
const targetDirs = [join(rootDir, 'src/server'), join(rootDir, 'src/lib/server')];

// 🎯 Individual files to migrate
const targetFiles = [join(rootDir, 'server.js')];

// 📝 Console methods to replace (including error now, since logger.error is safe)
const methodsToReplace = ['log', 'warn', 'info', 'debug', 'error'];

// 🔍 Recursively find all .js files
function findJsFiles(dir) {
  const files = [];

  try {
    const entries = readdirSync(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        files.push(...findJsFiles(fullPath));
      } else if (entry.endsWith('.js')) {
        files.push(fullPath);
      }
    }
  } catch (err) {
    console.error(`⚠️ Error reading directory ${dir}:`, err.message);
  }

  return files;
}

// 🔄 Replace console calls with logger calls
function migrateFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  let modified = content;
  let changeCount = 0;

  // Replace console.log/warn/info/debug/error with logger equivalents
  for (const method of methodsToReplace) {
    const regex = new RegExp(`console\\.${method}`, 'g');
    const matches = modified.match(regex);
    if (matches) {
      changeCount += matches.length;
      modified = modified.replace(regex, `logger.${method}`);
    }
  }

  // If changes were made, add logger import at the top (if not already present)
  if (changeCount > 0) {
    // Check if logger is already imported
    const hasLoggerImport = /import\s+.*logger.*from\s+['"].*logger.*['"]/.test(modified);

    if (!hasLoggerImport) {
      // Calculate relative path to logger.js from current file
      const fileDir = join(filePath, '..');
      const loggerPath = join(rootDir, 'src/lib/logger.js');
      let relativePath = relative(fileDir, loggerPath).replace(/\\/g, '/');

      // Ensure relative path starts with ./ or ../
      if (!relativePath.startsWith('.')) {
        relativePath = './' + relativePath;
      }

      // Special handling for different file patterns
      const dotenvMatch = modified.match(
        /(import.*from\s+['"]dotenv['"];?\s*\n\s*config\(\);?\s*\n)/
      );

      const configMatch = modified.match(
        /(import\s*{\s*config\s*}\s*from\s+['"]dotenv['"];?\s*\nconfig\(\);?\s*\n)/
      );

      if (dotenvMatch || configMatch) {
        // Insert after dotenv config
        const match = dotenvMatch || configMatch;
        const insertPos = match.index + match[0].length;
        modified =
          modified.slice(0, insertPos) +
          `\n// 🛡️ Centralized logger (respects NODE_ENV)\nimport logger from '${relativePath}';\n` +
          modified.slice(insertPos);
      } else {
        // Insert after all imports
        const allImportsMatch = modified.match(/^(import\s+.*\n)+/m);
        if (allImportsMatch) {
          const insertPos = allImportsMatch.index + allImportsMatch[0].length;
          modified =
            modified.slice(0, insertPos) +
            `\n// 🛡️ Centralized logger (respects NODE_ENV)\nimport logger from '${relativePath}';\n` +
            modified.slice(insertPos);
        } else {
          // No imports found, add at very top
          modified =
            `// 🛡️ Centralized logger (respects NODE_ENV)\nimport logger from '${relativePath}';\n\n` +
            modified;
        }
      }
    }

    writeFileSync(filePath, modified, 'utf8');
  }

  return changeCount;
}

// 🚀 Main execution
console.log('🔄 Starting logger migration...\n');

let totalFiles = 0;
let totalChanges = 0;

// Migrate directories
for (const dir of targetDirs) {
  if (!existsSync(dir)) {
    console.log(`⚠️  Skipping (not found): ${relative(rootDir, dir)}`);
    continue;
  }

  console.log(`📂 Scanning: ${relative(rootDir, dir)}`);
  const files = findJsFiles(dir);

  for (const file of files) {
    const changes = migrateFile(file);
    if (changes > 0) {
      totalFiles++;
      totalChanges += changes;
      console.log(`  ✅ ${relative(rootDir, file)} - ${changes} replacements`);
    }
  }
}

// Migrate individual files (like server.js)
console.log(`\n📄 Checking individual files...`);
for (const file of targetFiles) {
  if (!existsSync(file)) {
    console.log(`⚠️  Skipping (not found): ${relative(rootDir, file)}`);
    continue;
  }

  const changes = migrateFile(file);
  if (changes > 0) {
    totalFiles++;
    totalChanges += changes;
    console.log(`  ✅ ${relative(rootDir, file)} - ${changes} replacements`);
  }
}

console.log(`\n✨ Migration complete!`);
console.log(`📊 Modified ${totalFiles} files with ${totalChanges} total replacements\n`);
console.log(`💡 To control Socket.IO server logs:`);
console.log(`   Development:  Logs enabled automatically`);
console.log(`   Production:   Set NODE_ENV=production to disable`);
console.log(`   Force Enable: Set SOCKET_LOGS=true to override\n`);
