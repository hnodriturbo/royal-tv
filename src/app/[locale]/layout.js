/**
 * =========================== /src/app/[locale]/layout.js ===========================
 * 🌐 Locale Layout (server)
 * - Validates the requested locale
 * - Loads translation messages from FS (MESSAGES_DIR or ./messages)
 * - Wraps children with NextIntl, NextAuth Session, and AppProviders
 * - ❌ Does NOT re-render <html> or <body> (avoids hydration mismatch)
 * ==================================================================================
 */

import { Suspense } from 'react';

import { setRequestLocale } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { SessionProvider } from 'next-auth/react'; // 🔐 auth sessions

import AppProviders from '@/components/providers/AppProviders'; // 🧱 merged providers
import { routing } from 'i18n/routing'; // 🧭 locale whitelist
import DebugValidator from '@/lib/debug/debugValidator'; // 🧪 diagnostics

import fs from 'node:fs/promises'; // 📄 read JSON from disk
import path from 'node:path'; // 🛣️ join paths safely

export default async function LocaleLayout({ children, params }) {
  // ⏳ Next 15: params is async → await before reading .locale
  const { locale } = await params; // ✅

  // 🛡️ Validate the requested locale
  if (!routing.locales.includes(locale)) notFound(); // 🚫 unknown locale? 404
  setRequestLocale(locale); // 🌍 set intl request context

  // 📁 Resolve messages directory (env first, then ./messages)
  const messagesDir = process.env.MESSAGES_DIR || path.join(process.cwd(), 'messages'); // 🧭 e.g. /root/messages

  // 📄 Build the file path like /root/messages/en.json
  const messagesPath = path.join(messagesDir, `${locale}.json`);

  // Console log the messages path....
  console.log('[LocaleLayout] messagesPath:', messagesPath);
  // 📦 Load + parse JSON (fail hard → notFound to avoid hydration mismatches)
  let messages;
  try {
    const raw = await fs.readFile(messagesPath, 'utf8'); // 📖 read file
    messages = JSON.parse(raw); // 🔍 parse JSON
  } catch (readError) {
    // ⚠️ If messages are missing or invalid, prefer a clean 404 over broken UI
    console.error('[LocaleLayout] Failed to load messages:', {
      messagesPath,
      error: String(readError)
    });
    notFound();
  }

  // 🎛️ Providers (client) wrapped by server layout
  return (
    <Suspense>
      <DebugValidator /> {/* 🧪 dev aid; keep as-is per your request */}
      <NextIntlClientProvider locale={locale} messages={messages}>
        <SessionProvider>
          <AppProviders>{children}</AppProviders> {/* 🧱 app-wide client providers */}
        </SessionProvider>
      </NextIntlClientProvider>
    </Suspense>
  );
}
