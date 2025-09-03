// insert-debug-logs.mjs
// 🧰 Crawl src/ and inject console.log into every Capitalized component/function
// ⚠️ Skips above "use client" pragma automatically

import fs from 'fs';
import path from 'path';

function crawl(dir) {
  for (const file of fs.readdirSync(dir)) {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) crawl(full);
    else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      let src = fs.readFileSync(full, 'utf8');

      // Regex covers:
      // - export default function Name (…) {
      // - export function Name (…) {
      // - function Name (…) {
      const regex = /((?:export\s+default\s+)?function\s+([A-Z][A-Za-z0-9_]*)\s*\([^)]*\)\s*{)/g;

      let modified = src.replace(regex, (match, whole, name) => {
        return `${whole}\n  console.log("[debug][${file}] Enter ${name}");`;
      });

      if (modified !== src) {
        fs.writeFileSync(full, modified, 'utf8');
        console.log('⚡ instrumented:', full);
      }
    }
  }
}

crawl('src');
