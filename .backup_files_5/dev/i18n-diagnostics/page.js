// app/dev/i18n-diagnostics/page.js
import { promises as fs } from 'node:fs';
import path from 'node:path';

// Force Node runtime since we use fs
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic'; // always recompute in dev

// Keep this in sync with your routing & request config
const SUPPORTED_LOCALES = ['en', 'is'];
const MESSAGES_DIR = path.join(process.cwd(), 'src', 'messages');
const SRC_DIR = path.join(process.cwd(), 'src');

// Flatten nested { a: { b: "x" } } -> ["a.b"]
function flattenKeys(obj, prefix = '') {
  const out = [];
  for (const [k, v] of Object.entries(obj || {})) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      out.push(...flattenKeys(v, key));
    } else {
      out.push(key);
    }
  }
  return out;
}

async function loadMessages(locale) {
  const file = path.join(MESSAGES_DIR, `${locale}.json`);
  const raw = await fs.readFile(file, 'utf8');
  return JSON.parse(raw);
}

async function readSourceFiles(dir, files = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.next' || e.name === 'messages') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      await readSourceFiles(full, files);
    } else if (/\.(tsx?|jsx?)$/.test(e.name)) {
      files.push(full);
    }
  }
  return files;
}

async function scanUsages() {
  const files = await readSourceFiles(SRC_DIR);
  const usages = [];

  for (const file of files) {
    const text = await fs.readFile(file, 'utf8');

    // Capture namespaces declared via: const t = useTranslations('NS');
    const nsMatches = Array.from(
      text.matchAll(/useTranslations\(\s*['"`]([^'"`]+)['"`]\s*\)/g)
    ).map((m) => m[1]);
    if (nsMatches.length === 0) continue;

    // Capture t('key') calls (best-effort, only string literals)
    const keyMatches = Array.from(
      text.matchAll(/(?:^|[^\.\w])t\(\s*['"`]([^'"`]+)['"`]\s*\)/g)
    ).map((m) => m[1]);

    // Assign the same key set to each namespace found in that file (good enough for a quick check)
    const uniqueKeys = [...new Set(keyMatches)];
    for (const ns of new Set(nsMatches)) {
      usages.push({ file, namespace: ns, keys: uniqueKeys });
    }
  }
  return usages;
}

function toFullKeys(namespace, keys) {
  return keys.map((k) => (namespace ? `${namespace}.${k}` : k));
}

export default async function Page() {
  // 1) Load & flatten messages for each locale
  const localeMaps = {};
  for (const locale of SUPPORTED_LOCALES) {
    try {
      const dict = await loadMessages(locale);
      localeMaps[locale] = new Set(flattenKeys(dict));
    } catch (e) {
      localeMaps[locale] = new Set();
    }
  }

  // 2) Scan code usages
  const usages = await scanUsages();

  // 3) Build a list of missing keys per file/namespace/locale
  const report = [];

  for (const u of usages) {
    const missing = {};
    const fullKeys = toFullKeys(u.namespace, u.keys);

    for (const locale of SUPPORTED_LOCALES) {
      const have = localeMaps[locale];
      const gaps = fullKeys.filter((k) => !have.has(k));
      if (gaps.length) missing[locale] = gaps;
    }

    if (Object.keys(missing).length) {
      report.push({ file: u.file, namespace: u.namespace, missing });
    }
  }

  // 4) Simple UI
  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">i18n Diagnostics</h1>

      <section className="rounded-xl border p-4">
        <h2 className="font-medium mb-2">Locales & Message Files</h2>
        <ul className="list-disc ml-6">
          {SUPPORTED_LOCALES.map((l) => (
            <li key={l}>
              <code>{l}</code> — {localeMaps[l].size} keys
            </li>
          ))}
        </ul>
      </section>

      {report.length === 0 ? (
        <div className="rounded-xl border p-4">
          <p>✅ No missing keys detected across scanned files.</p>
        </div>
      ) : (
        <section className="rounded-xl border p-4">
          <h2 className="font-medium mb-4">Missing Keys</h2>
          <ul className="space-y-4">
            {report.map((r, i) => (
              <li key={i} className="rounded-lg border p-3">
                <div className="text-sm text-gray-600">{r.file}</div>
                <div className="font-medium">namespace: “{r.namespace}”</div>
                <div className="mt-2">
                  {Object.entries(r.missing).map(([locale, keys]) => (
                    <div key={locale} className="mt-2">
                      <div className="text-sm font-semibold">{locale}</div>
                      <ul className="list-disc ml-6">
                        {keys.map((k) => (
                          <li key={k}>
                            <code>{k}</code>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
