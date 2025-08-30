/**
 * =========================== /src/app/[locale]/layout.js ===========================
 * 🌐 Locale layout (server)
 * - Binds the request locale to this segment (setRequestLocale)
 * - Loads messages (prod ENV override → bundled → English fallback)
 * - Wires NextIntlClientProvider → SessionProvider → AppProviders (client)
 * ===================================================================================
 */

import { setRequestLocale } from 'next-intl/server'; // 🧭 bind locale to segment (stable API)
import { hasLocale } from 'next-intl'; // ✅ validate locale
import { notFound } from 'next/navigation'; // 🚫 404 on invalid locale
import { NextIntlClientProvider } from 'next-intl'; // 🗣️ messages + t()
import { SessionProvider } from 'next-auth/react'; // 🔐 auth session context
import AppProviders from '@/components/providers/AppProviders'; // 🧱 merged client providers
import { routing } from '@/i18n/routing'; // 🧭 central list of supported locales

// 📦 lazy-load messages with prod-only ENV override
import fs from 'node:fs/promises'; // 📁 file system (server only)
import path from 'node:path'; // 🧭 path utilities

const isProduction = process.env.NODE_ENV === 'production'; // 🏭 env flag
const messagesDirectoryFromEnv = process.env.MESSAGES_DIR || ''; // 🗺️ optional override

/**
 * 📚 Load locale messages:
 * - In production: try MESSAGES_DIR/<locale>.json
 * - Fallback: import bundled /messages/<locale>.json
 * - Final fallback: English
 */
async function loadMessages(locale) {
  // 🧼 normalize locale
  const normalizedLocale = (locale || 'en').toLowerCase();

  // 🏭 try ENV location only in production
  if (isProduction && messagesDirectoryFromEnv) {
    try {
      // 🧭 resolve absolute path (ENV value can be absolute or relative to CWD)
      const absoluteDirectory = path.isAbsolute(messagesDirectoryFromEnv)
        ? messagesDirectoryFromEnv
        : path.resolve(process.cwd(), messagesDirectoryFromEnv);

      // 📄 target file path
      const messagesFilePath = path.join(absoluteDirectory, `${normalizedLocale}.json`);

      // 📖 read & parse JSON
      const fileContents = await fs.readFile(messagesFilePath, 'utf8');
      const parsed = JSON.parse(fileContents);

      // ✅ success: return ENV messages
      return parsed;
    } catch {
      // 🚨 soft-fail: ENV path not found or invalid JSON — fallback to bundled import
    }
  }

  // 📦 fallback: use bundled messages inside the repo
  try {
    const mod = await import(`../../../messages/${normalizedLocale}.json`);
    return mod.default || mod;
  } catch {
    const fallback = await import(`../../../messages/en.json`);
    return fallback.default || fallback;
  }
}

// 🧭 pre-generate segments for SSG/ISR builds (optional but nice)
export function generateStaticParams() {
  // 🗺️ routing.locales comes from your central language config
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }) {
  // ⏳ Next 15: params is a promise (in RSC)
  const { locale: rawLocale } = await params;

  // 🧼 normalize
  const locale = (rawLocale || 'en').toLowerCase();

  // ✅ validate against supported locales to prevent 404 loops
  if (!hasLocale(routing.locales, locale)) {
    notFound(); // 🚫 invalid locale → 404
  }

  // 🧭 bind this request subtree to <locale> before anything else
  setRequestLocale(locale);

  // 📚 load localized messages
  const messages = await loadMessages(locale);

  // 🌳 provide translations + session + app-level client providers
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {/* 🔐 expose NextAuth session to client components */}
      <SessionProvider>
        {/* 🧱 socket, toasts, modals, etc. live here */}
        <AppProviders>{children}</AppProviders>
      </SessionProvider>
    </NextIntlClientProvider>
  );
}
