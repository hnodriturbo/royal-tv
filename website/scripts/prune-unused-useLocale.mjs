/**
 * scripts/prune-unused-useLocale.mjs
 * ==================================
 * 🧹 Auto-prune unused `useLocale` imports from next-intl.
 *
 * Usage:
 *  1) Commit your work first 🙏
 *  2) npm i -D @babel/parser @babel/traverse @babel/generator glob
 *  3) node scripts/prune-unused-useLocale.mjs
 */

import { readFile, writeFile } from 'node:fs/promises';
import { glob } from 'glob';
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';

const PROJECT_GLOBS = ['src/**/*.{js,jsx,ts,tsx}'];

const PARSER_OPTS = {
  sourceType: 'module',
  plugins: ['jsx', 'typescript', 'importAttributes', 'topLevelAwait']
};

async function processFile(filePath) {
  const original = await readFile(filePath, 'utf8');
  const ast = parser.parse(original, PARSER_OPTS);
  let modified = false;

  traverse.default(ast, {
    ImportDeclaration(path) {
      const node = path.node;
      if (node.source.value !== 'next-intl') return;

      const specifiers = node.specifiers.filter((s) => s.type === 'ImportSpecifier');
      if (!specifiers.some((s) => s.imported.name === 'useTranslations')) return;
      const localeSpec = specifiers.find((s) => s.imported.name === 'useLocale');
      if (!localeSpec) return;

      const localName = localeSpec.local.name;
      const binding = path.scope.getBinding(localName);
      if (!binding || binding.referencePaths.length === 0) {
        node.specifiers = node.specifiers.filter((s) => s !== localeSpec);
        modified = true;
      }
    }
  });

  if (!modified) return false;
  const output = generate.default(ast, { retainLines: true }, original).code;
  await writeFile(filePath, output, 'utf8');
  console.log('🧼 cleaned:', filePath);
  return true;
}

async function main() {
  const files = await glob(PROJECT_GLOBS, { nodir: true });
  let count = 0;
  for (const f of files) if (await processFile(f)) count++;
  console.log(`\n✅ Done. Cleaned ${count} files.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
