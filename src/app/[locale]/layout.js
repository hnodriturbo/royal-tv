// app/[locale]/layout.js — SERVER layout for the locale subtree
/* export const dynamicParams = false;
export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'is' }];
}
 */
// ✅ Make the subtree static
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
// (no prerender/revalidate/fetchCache overrides)

import { notFound } from 'next/navigation';
import { NextIntlClientProvider } from 'next-intl';
import { SessionProvider } from 'next-auth/react';
import { isLocale } from '@/i18n/config';
import AppProviders from '@/components/providers/AppProviders';

async function getMessages(locale) {
  try {
    const mod = await import(`@/messages/${locale}.json`);
    return mod.default || mod;
  } catch {
    return null;
  }
}

export default async function LocaleLayout({ children, params }) {
  const { locale: maybe } = await params;
  const locale = isLocale(maybe) ? maybe : null;
  if (!locale) notFound();

  const messages = await getMessages(locale);
  if (!messages) notFound();

  // Server layout stays dumb; providers are client components rendered below
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <SessionProvider refetchOnWindowFocus={false}>
        <AppProviders>{children}</AppProviders>
      </SessionProvider>
    </NextIntlClientProvider>
  );
}
