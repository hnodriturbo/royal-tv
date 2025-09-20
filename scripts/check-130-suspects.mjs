#!/usr/bin/env node
import { promises as fs } from 'node:fs';
import { join, resolve, dirname } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');
const APP = join(SRC, 'app');

// Adjust if your alias isn't "@/src"
const ALIAS = '@/';
const ALIAS_DIR = SRC;

const FILE_RE = /\.(?:js|jsx|ts|tsx)$/i;
const PAGE_LIKE = /(?:^|[\\/])(page|layout)\.(?:js|jsx|ts|tsx)$/i;

// crude resolvers for the common import shapes used in your repo
function resolveImport(importerFile, spec) {
  if (spec.startsWith(ALIAS)) {
    return join(ALIAS_DIR, spec.slice(ALIAS.length)) + guessExt();
  }
  if (spec.startsWith('./') || spec.startsWith('../')) {
    return join(dirname(importerFile), spec) + guessExt();
  }
  return null; // external pkg – ignore
}
function guessExt() {
  return ''; // we’ll try a few common ones below
}
async function tryReadModule(pathNoExt) {
  const tries = [
    pathNoExt,
    pathNoExt + '.js',
    pathNoExt + '.jsx',
    pathNoExt + '.ts',
    pathNoExt + '.tsx',
    join(pathNoExt, 'index.js'),
    join(pathNoExt, 'index.jsx'),
    join(pathNoExt, 'index.ts'),
    join(pathNoExt, 'index.tsx')
  ];
  for (const p of tries) {
    try {
      const s = await fs.readFile(p, 'utf8');
      return { path: p, src: s };
    } catch {}
  }
  return null;
}

async function* walk(dir) {
  for (const ent of await fs.readdir(dir, { withFileTypes: true })) {
    const p = join(dir, ent.name);
    if (ent.isDirectory()) yield* walk(p);
    else if (ent.isFile() && FILE_RE.test(ent.name) && PAGE_LIKE.test(p)) yield p;
  }
}

function parseImports(src) {
  // very lightweight import parser (covers your patterns)
  const re = /import\s+([^'"]+)\s+from\s+['"]([^'"]+)['"]/g;
  const found = [];
  let m;
  while ((m = re.exec(src))) {
    const clause = m[1].trim();
    const spec = m[2];
    // classify
    const defaultMatch = clause.match(/^([A-Za-z_$][\w$]*)\s*(,|\s*$)/);
    const namedMatch = clause.match(/{([^}]+)}/);
    const defaultImport = defaultMatch ? defaultMatch[1] : null;
    const namedImports = namedMatch
      ? namedMatch[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0])
      : [];
    found.push({ clause, spec, defaultImport, namedImports });
  }
  return found;
}

function hasDefaultExport(src) {
  return /export\s+default\s+/.test(src);
}
function hasNamedExport(src, name) {
  const re = new RegExp(
    `export\\s+(?:const|let|var|function|class)\\s+${name}\\b|export\\s*{[^}]*\\b${name}\\b[^}]*}`,
    'm'
  );
  return re.test(src);
}

(async () => {
  const problems = [];
  for await (const file of walk(APP)) {
    const src = await fs.readFile(file, 'utf8');
    const imports = parseImports(src);

    for (const im of imports) {
      const target = resolveImport(file, im.spec);
      if (!target) continue;
      const mod = await tryReadModule(target);
      if (!mod) continue;

      // Check default import
      if (im.defaultImport && !hasDefaultExport(mod.src)) {
        problems.push({
          file,
          import: `default as ${im.defaultImport} from '${im.spec}'`,
          target: mod.path,
          issue: 'Default import but target has NO default export (likely #130 if rendered).'
        });
      }
      // Check named imports
      for (const name of im.namedImports) {
        if (!hasNamedExport(mod.src, name)) {
          problems.push({
            file,
            import: `{ ${name} } from '${im.spec}'`,
            target: mod.path,
            issue: `Named import '${name}' not exported by target (could become undefined/object).`
          });
        }
      }
    }
  }

  if (problems.length) {
    console.log('\n⚠️  Potential #130 mismatches:\n');
    for (const p of problems) {
      console.log(`• In ${p.file}`);
      console.log(`  import ${p.import}`);
      console.log(`  ↳ ${p.issue}`);
      console.log(`    Target checked: ${p.target}\n`);
    }
    process.exit(1);
  } else {
    console.log('✅ No obvious default/named export mismatches in page/layout imports.');
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
