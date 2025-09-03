/**
 * scan-socket-buttons.mjs
 * ============================
 * 🔍 Crawl socket-related code for suspicious <button> children.
 *
 * Directories scanned:
 *   • src/components/reusableUI/socket
 *   • src/hooks/socket
 *   • src/server
 *   • src/lib/server/socketServer.js
 *
 * Flags:
 *   • <button>...</button> where child is `{someObject}` or non-primitive
 */

import fs from 'fs';
import path from 'path';

// 📂 Directories to check
const TARGETS = [
  'src/components/reusableUI/socket',
  'src/hooks/socket',
  'src/server',
  'src/lib/server/socketServer.js'
];

// 📑 File extensions to scan
const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

// 🧭 Walk directories recursively
function walk(directory) {
  let results = [];
  if (!fs.existsSync(directory)) return results;

  const list = fs.readdirSync(directory);
  list.forEach((file) => {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      if (EXTENSIONS.includes(path.extname(file))) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

// 🚨 Regex to detect suspicious <button> children
const BUTTON_REGEX = /<button\b[^>]*>([\s\S]*?)<\/button>/gi;
const CURLY_REGEX = /{[^}]+}/g;

while ((match = BUTTON_REGEX.exec(content)) !== null) {
  const inner = match[1].trim();

  // ✅ Skip if button contains <span>, <svg>, <Icon>, etc.
  if (inner.startsWith('<')) continue;

  // 🚨 Suspicious if contains braces with just an identifier or number
  const curlyMatch = inner.match(/{([^}]+)}/);
  if (curlyMatch) {
    const expression = curlyMatch[1].trim();

    // Ignore String(...) or template literals
    if (!expression.startsWith('String') && !expression.startsWith('`')) {
      console.log(`${filePath}:${match.index}  🚨 suspicious <button> child -> ${inner}`);
    }
  }
}
