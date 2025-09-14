/**
 * /src/app/[locale]/layout.js
 * Next.js 15: server layout for a locale subtree (no <html>/<body> here).
 */

import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { SessionProvider } from 'next-auth/react';
import { isLocale } from '@/i18n/config';
import AppProviders from '@/components/providers/AppProviders';

export const dynamic = 'force-dynamic';
export const prerender = false;
export const revalidate = 0;
export const fetchCache = 'force-no-store';

async function getMessages(locale) {
  try {
    const mod = await import(`@/messages/${locale}.json`);
    return mod.default || mod;
  } catch (err) {
    return null;
  }
}

export default async function LocaleLayout({ children, params }) {
  const { locale: maybe } = await params;
  const locale = isLocale(maybe) ? maybe : null;
  if (!locale) notFound();

  const messages = await getMessages(locale);
  if (!messages) notFound();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SessionProvider>
        <AppProviders>{children}</AppProviders>
      </SessionProvider>
    </NextIntlClientProvider>
  );
}
