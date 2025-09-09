#!/usr/bin/env node
// scripts/locale-codemod.mjs
// Usage:
//   node scripts/locale-codemod.mjs --report-only
//   node scripts/locale-codemod.mjs --write
//
// What it does:
// 1) Scans src/**/*.{js,jsx,ts,tsx} but only processes files under "/[locale]/".
// 2) Rewrites imports from legacy "@/i18n" facade to official Next modules:
//      Link                      -> next/link (default)
//      useRouter, usePathname,
//      useSearchParams, redirect -> next/navigation (named)
//    Leaves "routing" and "getPathname" but warns you to migrate.
// 3) CLIENT components only ("use client"):
//      - <Link href="/foo"> → href={`/${__locale}/foo`}  (skips /en, /is, /[dynamic], http(s)://, #, ?)
//      - router.push|replace|prefetch('/foo') → same
//      - injects:   import {useLocale} from 'next-intl';   const __locale = useLocale();
// 4) Reports files using <Link> and any server components that still have string hrefs to review.

import fs from 'node:fs/promises';
import path from 'node:path';
import { glob } from 'glob';
import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
import generateModule from '@babel/generator';
import * as t from '@babel/types';

const traverse = traverseModule.default || traverseModule;
const generate = generateModule.default || generateModule;

const WRITE = process.argv.includes('--write') || process.argv.includes('-w');
const REPORT_ONLY = process.argv.includes('--report-only') || process.argv.includes('--dry');

const ROOT = process.cwd();
const BROAD_GLOB = 'src/**/*.{js,jsx,ts,tsx}';
const LOCALE_SEGMENT = '/[locale]/';

const NEXT_LINK = 'next/link';
const NEXT_NAV = 'next/navigation';
const NEXT_INTL = 'next-intl';

const LOCALES = ['en', 'is']; // keep in sync with your i18n config

// Legacy facades we want to rewrite
const LEGACY_SOURCES = new Set([
  '@/i18n',
  '@/i18n/index',
  '@/i18n/index.js',
  '@/i18n/navigation',
  '@/i18n/navigation.js',
  '@/i18n/navigation.server',
  '@/i18n/navigation.server.js'
]);

// Reporting sets
const filesChanged = new Set();
const filesWithLink = new Set();
const filesServerWithStringHrefs = new Set();
const filesWithLegacyGetPathname = new Set();
const filesWithLegacyRouting = new Set();

const toPosix = (p) => p.replace(/\\/g, '/');

function parseCode(code, filename) {
  return parse(code, {
    sourceType: 'module',
    sourceFilename: filename,
    plugins: ['jsx', 'importMeta', 'topLevelAwait', 'typescript']
  });
}

function isClientComponent(ast) {
  return (
    Array.isArray(ast.program.directives) &&
    ast.program.directives.some((d) => d.value?.value === 'use client')
  );
}

function importHasSpecifier(ast, source, importedName, isDefault = false) {
  let found = false;
  traverse(ast, {
    ImportDeclaration(p) {
      if (p.node.source.value !== source) return;
      if (isDefault) {
        found = p.node.specifiers.some(
          (s) => s.type === 'ImportDefaultSpecifier' && s.local.name === importedName
        );
      } else {
        found = p.node.specifiers.some(
          (s) =>
            s.type === 'ImportSpecifier' &&
            (s.imported.name === importedName || s.local.name === importedName)
        );
      }
      if (found) p.stop();
    }
  });
  return found;
}

function ensureDefaultImport(ast, source, local = 'Link') {
  if (importHasSpecifier(ast, source, local, true)) return;
  ast.program.body.unshift(
    t.importDeclaration([t.importDefaultSpecifier(t.identifier(local))], t.stringLiteral(source))
  );
}

/* function ensureNamedImport(ast, source, names = []) {
  if (!names.length) return;
  // Merge with existing import or add new one
  let merged = false;
  traverse(ast, {
    ImportDeclaration(p) {
      if (p.node.source.value !== source) return;
      const existing = new Set(
        p.node.specifiers.filter((s) => s.type === 'ImportSpecifier').map((s) => s.imported.name)
      );
      let added = false;
      for (const nm of names) {
        if (!existing.has(nm)) {
          p.node.specifiers.push(t.importSpecifier(t.identifier(nm), t.identifier(nm)));
          added = true;
        }
      }
      if (added) merged = true;
    }
  });
  if (!merged) {
    ast.program.body.unshift(
      t.importDeclaration(
        names.map((nm) => t.importSpecifier(t.identifier(nm), t.identifier(nm))),
        t.stringLiteral(source)
      )
    );
  }
} */
function ensureNamedImport(ast, source, specifiers) {
  if (!specifiers.length) return;

  const body = ast.program.body;

  // check existing imports
  const existing = body.find((n) => n.type === 'ImportDeclaration' && n.source.value === source);

  if (existing) {
    const existingNames = existing.specifiers.map((s) => s.local.name);
    const newOnes = specifiers.filter((s) => !existingNames.includes(s));

    if (newOnes.length) {
      existing.specifiers.push(
        ...newOnes.map((s) => t.importSpecifier(t.identifier(s), t.identifier(s)))
      );
    }
    return;
  }

  // check for conflicts with ANY top-level identifier
  const declaredNames = new Set();
  body.forEach((node) => {
    if (node.type === 'ImportDeclaration') {
      node.specifiers.forEach((s) => declaredNames.add(s.local.name));
    } else if (node.type === 'VariableDeclaration') {
      node.declarations.forEach((d) => {
        if (d.id?.name) declaredNames.add(d.id.name);
      });
    } else if (node.type === 'FunctionDeclaration' && node.id) {
      declaredNames.add(node.id.name);
    }
  });

  const safeSpecifiers = specifiers.filter((s) => {
    if (declaredNames.has(s)) {
      console.warn(`⚠️ Skipping import { ${s} } from "${source}" because it collides`);
      return false;
    }
    return true;
  });

  if (!safeSpecifiers.length) return;

  const newImport = t.importDeclaration(
    safeSpecifiers.map((s) => t.importSpecifier(t.identifier(s), t.identifier(s))),
    t.stringLiteral(source)
  );
  body.unshift(newImport);
}

function ensureUseLocaleHook(ast, functionPath) {
  // Add import {useLocale} from 'next-intl'
  if (!importHasSpecifier(ast, NEXT_INTL, 'useLocale')) {
    ensureNamedImport(ast, NEXT_INTL, ['useLocale']);
  }
  // Ensure `const __locale = useLocale();` at top of the function body
  const body = functionPath.get('body');
  if (!body || !body.node || !Array.isArray(body.node.body)) return;
  const already = body.node.body.some(
    (stmt) =>
      t.isVariableDeclaration(stmt) &&
      stmt.declarations.some((d) => t.isIdentifier(d.id, { name: '__locale' }))
  );
  if (!already) {
    body.node.body.unshift(
      t.variableDeclaration('const', [
        t.variableDeclarator(
          t.identifier('__locale'),
          t.callExpression(t.identifier('useLocale'), [])
        )
      ])
    );
  }
}

function hrefShouldPrefix(str) {
  if (typeof str !== 'string') return false;
  if (!str.startsWith('/')) return false; // skip relative/hash/external
  if (str.startsWith('/[')) return false; // dynamic
  if (/^\/(en|is)(\/|$)/i.test(str)) return false; // already prefixed
  return true;
}

function buildHrefTemplate(pathStr) {
  // '/foo' => `/${__locale}/foo` ; '/' => `/${__locale}`
  const suffix = pathStr === '/' ? '' : pathStr;
  return t.jsxExpressionContainer(
    t.templateLiteral(
      [
        t.templateElement({ raw: '/', cooked: '/' }),
        t.templateElement({ raw: suffix, cooked: suffix }, true)
      ],
      [t.identifier('__locale')]
    )
  );
}

function transformImports(ast, filename) {
  let touched = false;
  const needNav = new Set(); // useRouter, usePathname, useSearchParams, redirect
  let needLink = false;

  traverse(ast, {
    ImportDeclaration(p) {
      const source = p.node.source.value;

      if (source === NEXT_LINK) filesWithLink.add(filename);

      if (!LEGACY_SOURCES.has(source)) return;

      const keep = [];
      for (const spec of p.node.specifiers) {
        if (spec.type !== 'ImportSpecifier') {
          keep.push(spec);
          continue;
        }
        const name = spec.imported.name;

        if (name === 'Link') {
          needLink = true;
          touched = true;
          continue;
        }
        if (['useRouter', 'usePathname', 'useSearchParams', 'redirect'].includes(name)) {
          needNav.add(name);
          touched = true;
          continue;
        }
        if (name === 'getPathname') {
          filesWithLegacyGetPathname.add(filename);
          keep.push(spec);
          continue;
        }
        if (name === 'routing') {
          filesWithLegacyRouting.add(filename);
          keep.push(spec);
          continue;
        }

        keep.push(spec); // unknown — keep
      }

      if (keep.length === 0) {
        p.remove();
        touched = true;
      } else {
        p.node.specifiers = keep;
        if (p.node.specifiers.length === 0) {
          p.remove();
          touched = true;
        }
      }
    }
  });

  if (needNav.size) {
    ensureNamedImport(ast, NEXT_NAV, [...needNav]);
    touched = true;
  }
  if (needLink) {
    ensureDefaultImport(ast, NEXT_LINK, 'Link');
    filesWithLink.add(filename);
    touched = true;
  }

  return touched;
}

function transformClientPrefixes(ast, filename) {
  // Map function node -> whether we've injected __locale
  const patchedFns = new WeakSet();
  let touched = false;

  traverse(ast, {
    JSXOpeningElement(p) {
      const name = p.node.name;
      if (!t.isJSXIdentifier(name) || name.name !== 'Link') return;

      // track file for report
      filesWithLink.add(filename);

      // Find href attr
      const hrefAttr = p.node.attributes.find(
        (attr) => t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name, { name: 'href' })
      );
      if (!hrefAttr) return;

      // Only transform plain string hrefs that should be prefixed
      if (hrefAttr.value && t.isStringLiteral(hrefAttr.value)) {
        const val = hrefAttr.value.value;
        if (hrefShouldPrefix(val)) {
          // Inject __locale in the closest function component
          const fnPath = p.getFunctionParent();
          if (fnPath && !patchedFns.has(fnPath.node)) {
            ensureUseLocaleHook(ast, fnPath);
            patchedFns.add(fnPath.node);
          }
          hrefAttr.value = buildHrefTemplate(val);
          touched = true;
        }
      }
    },

    CallExpression(p) {
      const callee = p.node.callee;
      if (!t.isMemberExpression(callee)) return;
      const prop = callee.property;
      if (!t.isIdentifier(prop)) return;
      if (!['push', 'replace', 'prefetch'].includes(prop.name)) return;

      // First arg must be a string literal to transform
      const args = p.node.arguments;
      if (!args?.length) return;
      const first = args[0];
      if (!t.isStringLiteral(first)) return;
      if (!hrefShouldPrefix(first.value)) return;

      // Inject __locale in enclosing function
      const fnPath = p.getFunctionParent();
      if (fnPath && !patchedFns.has(fnPath.node)) {
        ensureUseLocaleHook(ast, fnPath);
        patchedFns.add(fnPath.node);
      }

      // Replace arg with template `/${__locale}${suffix}`
      const suffix = first.value === '/' ? '' : first.value;
      args[0] = t.templateLiteral(
        [
          t.templateElement({ raw: '/', cooked: '/' }),
          t.templateElement({ raw: suffix, cooked: suffix }, true)
        ],
        [t.identifier('__locale')]
      );
      touched = true;
    }
  });

  return touched;
}

function scanServerStringHrefs(ast, filename) {
  // We only flag: <Link href="/..." /> inside server files (no "use client")
  let flagged = false;
  traverse(ast, {
    JSXOpeningElement(p) {
      const name = p.node.name;
      if (!t.isJSXIdentifier(name) || name.name !== 'Link') return;
      const hrefAttr = p.node.attributes.find(
        (attr) => t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name, { name: 'href' })
      );
      if (hrefAttr && t.isStringLiteral(hrefAttr.value) && hrefShouldPrefix(hrefAttr.value.value)) {
        flagged = true;
      }
    }
  });
  if (flagged) filesServerWithStringHrefs.add(filename);
}

async function processFile(absPath) {
  const code = await fs.readFile(absPath, 'utf8');
  const ast = parseCode(code, absPath);

  const isClient = isClientComponent(ast);
  // Always do the imports rewrite
  const changedImports = transformImports(ast, absPath);

  let changedPrefix = false;
  if (isClient) {
    changedPrefix = transformClientPrefixes(ast, absPath);
  } else {
    scanServerStringHrefs(ast, absPath);
  }

  const changed = changedImports || changedPrefix;
  if (!changed) return { changed: false, out: code };

  const out = generate(ast, { retainLines: true, jsescOption: { minimal: true } }, code).code;
  return { changed: true, out };
}

async function main() {
  const all = await glob(BROAD_GLOB, { cwd: ROOT, absolute: true });
  // const files = all.filter((f) => toPosix(f).includes(LOCALE_SEGMENT));
  const PROCESS_ALL = process.argv.includes('--all');
  const files = PROCESS_ALL
    ? all // scan everything under src/
    : all.filter((f) => toPosix(f).includes(LOCALE_SEGMENT)); // default: only /[

  if (files.length === 0) {
    console.log('No files found under', LOCALE_SEGMENT, 'from', BROAD_GLOB);
    process.exit(0);
  }

  for (const file of files) {
    const { changed, out } = await processFile(file);
    if (changed) {
      filesChanged.add(path.relative(ROOT, file));
      if (WRITE && !REPORT_ONLY) {
        await fs.writeFile(file, out, 'utf8');
      }
    }
  }

  console.log('\n=== locale-codemod Report ===');
  console.log('Scanned files:', files.length);
  console.log('Changed files:', filesChanged.size);
  if (!WRITE || REPORT_ONLY) console.log('NOTE: run with --write to apply changes.');

  if (filesWithLink.size) {
    console.log('\nFiles using <Link> (now auto-prefixed in CLIENT components):');
    for (const f of [...filesWithLink].sort()) console.log(' -', toPosix(path.relative(ROOT, f)));
  }

  if (filesServerWithStringHrefs.size) {
    console.log(
      '\n⚠️ Server files with string hrefs to review (prefix with params.locale or localeHref):'
    );
    for (const f of [...filesServerWithStringHrefs].sort())
      console.log(' -', toPosix(path.relative(ROOT, f)));
  }

  if (filesWithLegacyGetPathname.size) {
    console.log('\n⚠️ Files importing legacy getPathname (replace with params/usePathname):');
    for (const f of [...filesWithLegacyGetPathname].sort())
      console.log(' -', toPosix(path.relative(ROOT, f)));
  }
  if (filesWithLegacyRouting.size) {
    console.log('\n⚠️ Files importing legacy routing (switch to "@/i18n/config" as needed):');
    for (const f of [...filesWithLegacyRouting].sort())
      console.log(' -', toPosix(path.relative(ROOT, f)));
  }

  console.log('\nDone.\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
