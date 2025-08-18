/**
 *   ======================== /src/app/[locale]/layout.js ========================
 * 🌐 Locale-aware layout
 * - Awaits params properly (Next.js 15 dynamic params are async)
 * - Wraps tree with NextIntlClientProvider
 * - Mounts SessionProvider + AppProviders inside intl provider
 */

import { NextIntlClientProvider } from 'next-intl'; // 🌍 intl provider
import { getLocale, getMessages } from 'next-intl/server'; // 📦 SSR helpers
import { SessionProvider } from 'next-auth/react'; // 🔐 next-auth v5 client provider
import AppProviders from '@/components/providers/AppProviders'; // 🧰 my app contexts (client)

export default async function LocaleLayout({ children, params }) {
  // 🧭 await params first, then read properties
  const awaitedParams = await params; // 🧳 unwrap async params
  const segmentLocale = awaitedParams?.locale; // 🧩 'en' | 'is' from URL segment
  const activeLocale = segmentLocale || (await getLocale()); // 🧯 safety fallback

  // 📦 messages for this request/locale (loaded from next-intl config)
  const translationMessages = await getMessages();

  return (
    <NextIntlClientProvider locale={activeLocale} messages={translationMessages}>
      {/* 🔐 auth context under intl so components can safely call useT() */}
      <SessionProvider>
        {/* 🧰 all custom providers now have intl context available */}
        <AppProviders>{children}</AppProviders>
      </SessionProvider>
    </NextIntlClientProvider>
  );
}
