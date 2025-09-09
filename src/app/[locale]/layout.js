/**
 * /src/app/[locale]/layout.js
 * Next.js 15: await params; no <html>/<body> here.
 */

import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { SessionProvider } from 'next-auth/react';
import { LOCALES, isLocale } from '@/i18n/config';
import AppProviders from '@/components/providers/AppProviders';

async function getMessages(locale) {
  try {
    const mod = await import(`@/messages/${locale}.json`);
    return mod.default || mod;
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }) {
  const { locale: maybe } = await params; // ✅ await params (Next 15)
  const locale = isLocale(maybe) ? maybe : null;
  if (!locale) notFound();

  const messages = await getMessages(locale);
  if (!messages) notFound();

  return (
    <>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <SessionProvider>
          <AppProviders>{children}</AppProviders>
        </SessionProvider>
      </NextIntlClientProvider>
    </>
  );
}
