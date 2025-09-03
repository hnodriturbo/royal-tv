// fix-i18n-imports.js
// 🕷️ Script to rewrite all "from 'i18n'" imports → "from '@/i18n'"

import fs from 'fs';
import path from 'path';

// 📂 Root folder where to start scanning
const ROOT_DIR = path.resolve('./src'); // change to '.' if you want whole project

// 🛠️ Recursively walk through directories
function walkDir(dir, callback) {
  fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath, callback);
    } else if (entry.isFile() && /\.(js|jsx|ts|tsx)$/.test(entry.name)) {
      callback(fullPath);
    }
  });
}

// ✍️ Replace imports
function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const newContent = content.replace(/from\s+['"]i18n['"]/g, "from '@/i18n'");

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log(`✅ Fixed imports in: ${filePath}`);
  }
}

// 🚀 Run
walkDir(ROOT_DIR, fixImports);
console.log('✨ All i18n imports fixed!');
