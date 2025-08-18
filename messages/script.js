// fix-placeholders.js
// -------------------
// 🛠 Converts Mustache-style {{ var }} placeholders to ICU {var}
// ⚠️ Creates a .bak backup before overwriting

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 📍 Helper to resolve __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📂 JSON files to process (adjust paths as needed)
const files = [path.join(__dirname, 'is.json')];

// 🔍 Regex to find {{   variable   }}
const placeholderRegex = /\{\{\s*([^}]+?)\s*\}\}/g;

for (const filePath of files) {
  // 📖 Read file
  const originalContent = fs.readFileSync(filePath, 'utf8');

  // 🔄 Replace {{ var }} → {var}
  const updatedContent = originalContent.replace(placeholderRegex, '{$1}');

  // 💾 Backup original
  const backupPath = `${filePath}.bak`;
  fs.writeFileSync(backupPath, originalContent, 'utf8');

  // 💾 Save cleaned version
  fs.writeFileSync(filePath, updatedContent, 'utf8');

  console.log(
    `✅ Cleaned ${path.basename(filePath)} (backup saved as ${path.basename(backupPath)})`
  );
}
