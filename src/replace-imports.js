/**
 * replace-imports.js
 * ------------------
 * 🔍 Bulk replace import paths across the repo.
 *    Replaces:
 *      '@/lib/i18n/client'  -> '@/lib/i18n/client'
 *      '@/lib/i18n/server'  -> '@/lib/i18n/server'
 *
 * 🧾 Prints every changed file, totals, and writes a JSON report.
 * ⚠️ Commit or back up before running — edits files in place.
 */

import fs from 'fs';
import path from 'path';

// 🌳 Root folder to start the walk
const projectRootAbsolutePath = process.cwd();

// 🧩 What to replace (can add more pairs later)
const replacementPairs = [
  { target: '@/lib/i18n/client', replacement: '@/lib/i18n/client' }, // ✨ client imports
  { target: '@/lib/i18n/server', replacement: '@/lib/i18n/server' } // ✨ server imports
];

// 🧪 File extensions to scan
const allowedExtensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];

// 🚫 Folders to skip during traversal
const excludedDirectories = new Set([
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'coverage',
  'out'
]);

// 📝 Report data holder
const changedFilesManifest = [];
let totalFilesChanged = 0;
let totalReplacementsPerformed = 0;

/* 🧭 Recursively walk the directory tree */
function walkDirectoryRecursively(currentDirectoryAbsolutePath) {
  const directoryEntries = fs.readdirSync(currentDirectoryAbsolutePath, { withFileTypes: true });

  for (const directoryEntry of directoryEntries) {
    const entryAbsolutePath = path.join(currentDirectoryAbsolutePath, directoryEntry.name);

    if (directoryEntry.isDirectory()) {
      // 🚪 Skip excluded directories
      if (excludedDirectories.has(directoryEntry.name)) continue;
      walkDirectoryRecursively(entryAbsolutePath);
      continue;
    }

    // 🧰 Only process allowed extensions
    const fileExtension = path.extname(directoryEntry.name);
    if (!allowedExtensions.includes(fileExtension)) continue;

    // 📖 Read file content
    const originalContent = fs.readFileSync(entryAbsolutePath, 'utf8');
    let updatedContent = originalContent;
    const perFileChanges = [];

    // 🔁 Apply all replacement pairs
    for (const { target, replacement } of replacementPairs) {
      if (updatedContent.includes(target)) {
        const occurrencesBefore = (
          updatedContent.match(new RegExp(escapeRegExp(target), 'g')) || []
        ).length;
        updatedContent = updatedContent.split(target).join(replacement);
        const occurrencesAfter = (
          updatedContent.match(new RegExp(escapeRegExp(replacement), 'g')) || []
        ).length;

        const replacementsForThisPair = occurrencesBefore; // 👍 equal to how many we replaced
        if (replacementsForThisPair > 0) {
          perFileChanges.push({ target, replacement, count: replacementsForThisPair });
          totalReplacementsPerformed += replacementsForThisPair;
        }
      }
    }

    // 💾 If anything changed, write file and log it
    if (perFileChanges.length > 0 && updatedContent !== originalContent) {
      fs.writeFileSync(entryAbsolutePath, updatedContent, 'utf8');
      totalFilesChanged += 1;

      // 📣 Per-file console line
      console.log(`✅ Updated: ${entryAbsolutePath}`);
      perFileChanges.forEach((change) => {
        console.log(`   • ${change.count} × "${change.target}" → "${change.replacement}"`);
      });

      // 🧾 Push to manifest
      changedFilesManifest.push({
        file: entryAbsolutePath,
        changes: perFileChanges
      });
    }
  }
}

/* 🧯 Escape string for RegExp usage */
function escapeRegExp(inputString) {
  return inputString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* 🚀 Run */
walkDirectoryRecursively(projectRootAbsolutePath);

// 🧠 Summary
console.log('\n──────── Summary ────────');
console.log(`🗂️  Files changed: ${totalFilesChanged}`);
console.log(`🧶 Replacements:  ${totalReplacementsPerformed}`);

// 🗂️ Write JSON report (optional but handy)
const reportAbsolutePath = path.join(projectRootAbsolutePath, 'replace-imports-report.json');
fs.writeFileSync(
  reportAbsolutePath,
  JSON.stringify(
    {
      generatedAtISO: new Date().toISOString(),
      totalFilesChanged,
      totalReplacementsPerformed,
      changes: changedFilesManifest
    },
    null,
    2
  ),
  'utf8'
);
console.log(`📝 Report: ${reportAbsolutePath}`);
console.log('✨ Replacement complete.');
