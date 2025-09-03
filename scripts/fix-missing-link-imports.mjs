// fix-navigation-imports.mjs
// 🔧 Normalize all Link/useRouter/usePathname/useSearchParams imports to @/i18n

import fs from 'fs';
import path from 'path';

const SRC_DIR = path.resolve('../src');

function getAllJsFiles(dir) {
  let results = [];
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      results = results.concat(getAllJsFiles(filePath));
    } else if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      results.push(filePath);
    }
  });
  return results;
}

function fixImports(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');
  let original = code;

  let needsLink = /<Link\b/.test(code);
  let needsRouter = /\buseRouter\(/.test(code);
  let needsPathname = /\busePathname\(/.test(code);
  let needsSearchParams = /\buseSearchParams\(/.test(code);

  // 🧹 Remove next/link imports
  code = code.replace(/import\s+Link\s+from\s+['"]next\/link['"]\s*;?\n?/g, '');

  // 🧹 Remove next/navigation imports (named)
  code = code.replace(/import\s+{([^}]*)}\s+from\s+['"]next\/navigation['"]\s*;?\n?/g, '');

  // 🔍 Collect existing i18n import
  const i18nImportMatch = code.match(/import\s+{([^}]*)}\s+from\s+['"]@\/i18n['"]/);
  let newImports = new Set();
  if (i18nImportMatch) {
    i18nImportMatch[1].split(',').forEach((imp) => {
      if (imp.trim()) newImports.add(imp.trim());
    });
  }

  // ➕ Add what’s needed
  if (needsLink) newImports.add('Link');
  if (needsRouter) newImports.add('useRouter');
  if (needsPathname) newImports.add('usePathname');
  if (needsSearchParams) newImports.add('useSearchParams');

  if (newImports.size > 0) {
    const importLine = `import { ${Array.from(newImports).join(', ')} } from '@/i18n';\n`;

    if (i18nImportMatch) {
      // Replace existing
      code = code.replace(
        /import\s+{([^}]*)}\s+from\s+['"]@\/i18n['"];/,
        importLine.trim()
      );
    } else {
      // Insert at top
      code = importLine + code;
    }
  }

  if (code !== original) {
    fs.writeFileSync(filePath, code, 'utf8');
    console.log(`✅ Fixed: ${filePath}`);
  }
}

const files = getAllJsFiles(SRC_DIR);
files.forEach(fixImports);

console.log('✨ Navigation imports normalized to @/i18n');
