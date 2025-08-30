/**
 * =========================== /src/app/[locale]/layout.js ===========================
 * 🌐 Locale Layout (server)
 * - Validates the requested locale
 * - Loads translation messages (dev: dynamic import, prod: fs read)
 * - Wraps children with NextIntl, NextAuth Session, and AppProviders
 * - ❌ Does NOT re-render <html> or <body> (avoids hydration mismatch)
 * ==================================================================================
 */

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import { SessionProvider } from 'next-auth/react'; // 🔐 auth sessions
import AppProviders from '@/components/providers/AppProviders'; // 🧱 merged providers
import { routing } from '@/i18n/routing';
import DebugValidator from '@/lib/debug/debugValidator';

export default async function LocaleLayout({ children, params }) {
  const locale = params.locale;

  if (!routing.locales.includes(locale)) notFound();
  setRequestLocale(locale);

  const messages = (await import(`@/language/${locale}/${locale}.json`)).default;

  return (
    <Suspense>
      <DebugValidator />
      <NextIntlClientProvider locale={locale} messages={messages}>
        <SessionProvider>
          <AppProviders>{children}</AppProviders>
        </SessionProvider>
      </NextIntlClientProvider>
    </Suspense>
  );
}
