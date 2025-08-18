/**
 * ================== src/lib/language/request.js ==================
 * 🌍 Per-request i18n config (messages + normalized locale)
 * - Used by the next-intl plugin to hydrate Server Components
 * - Messages live in /messages at project root
 * ================================================================
 */

import { getRequestConfig } from 'next-intl/server'; // 📦 per-request config
import { hasLocale } from 'next-intl'; // ✅ safe locale check
import { routing } from './routing.js'; // 🧭 our locales/default

export default getRequestConfig(async ({ requestLocale }) => {
  // 🧭 Normalize the requested locale to supported ones
  const requestedLocale = await requestLocale;
  const activeLocale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;

  // 📚 Load messages from /messages at project root
  const messages = (await import(`../../messages/${activeLocale}.json`)).default;

  return {
    locale: activeLocale,
    messages
  };
});
