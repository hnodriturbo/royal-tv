#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = process.cwd();
const TARGET_DIRS = ['components', 'src', 'hooks', 'lib'];
const EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);
const IGNORE_DIRS = new Set(['node_modules', '.next', '.git', 'dist', 'build', 'out']);

const args = new Set(process.argv.slice(2));
const WRITE = args.has('--write');
const BACKUP = args.has('--backup');

// The *only* thing we actually need to be correct for rewriting:
const REWRITE = /(['"])@\/i18n(\/[^'"]*)?\1/g;

// Helper for reporting with line numbers
function* iterMatchesWithLines(text, re) {
  const rx = new RegExp(re.source, 'g');
  let m;
  while ((m = rx.exec(text))) {
    const index = m.index;
    const line = text.slice(0, index).split(/\r?\n/).length;
    const col = index - text.lastIndexOf('\n', index - 1);
    const lineStr = (text.split(/\r?\n/)[line - 1] ?? '').replace(/\t/g, '  ');
    yield { line, col, snippet: lineStr.length > 140 ? lineStr.slice(0, 139) + '…' : lineStr };
  }
}

async function* walk(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    if (ent.isDirectory()) {
      if (IGNORE_DIRS.has(ent.name)) continue;
      yield* walk(join(dir, ent.name));
    } else if (ent.isFile()) {
      const dot = ent.name.lastIndexOf('.');
      const ext = dot >= 0 ? ent.name.slice(dot) : '';
      if (EXTENSIONS.has(ext)) yield join(dir, ent.name);
    }
  }
}

async function processFile(file) {
  const content = await fs.readFile(file, 'utf8');

  // Gather matches for reporting (using the same pattern we rewrite with)
  const matches = Array.from(iterMatchesWithLines(content, REWRITE));

  // Perform rewrite regardless; write only if changed and --write is set
  const updated = content.replace(REWRITE, (full, quote, tail) => {
    const rest = tail ?? ''; // preserve any "/something"
    return `${quote}@/src/i18n${rest}${quote}`;
  });

  if (WRITE && updated !== content) {
    if (BACKUP) await fs.writeFile(file + '.bak', content, 'utf8');
    await fs.writeFile(file, updated, 'utf8');
  }

  return { file, matches, changed: updated !== content };
}

async function main() {
  const roots = TARGET_DIRS.map((d) => resolve(ROOT, d));
  const files = [];
  for (const dir of roots) {
    try {
      for await (const f of walk(dir)) files.push(f);
    } catch {
      // ignore missing directories
    }
  }

  let totalMatches = 0;
  let changedCount = 0;
  const results = [];

  for (const file of files) {
    const res = await processFile(file);
    if (res.matches.length) results.push(res);
    totalMatches += res.matches.length;
    if (res.changed) changedCount++;
  }

  if (results.length) {
    console.log(
      `\n${WRITE ? 'Fixed' : 'Found'} old '@/i18n' imports in ${results.length} file(s):\n`
    );
    for (const { file, matches } of results) {
      console.log(file);
      for (const m of matches) {
        console.log(`  L${m.line}: ${m.snippet}`);
      }
      console.log();
    }
  }

  if (WRITE) {
    console.log(`Rewrote ${totalMatches} occurrence(s) across ${changedCount} file(s).`);
    process.exit(0);
  } else {
    console.log(`Detected ${totalMatches} occurrence(s) across ${results.length} file(s).`);
    // nonzero exit in dry-run when there are hits
    process.exit(results.length ? 1 : 0);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
