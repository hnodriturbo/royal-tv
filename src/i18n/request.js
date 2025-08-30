/**
 * ================== /src/lib/language/request.js ==================
 * 🌍 Per-request next-intl config (messages + locale)
 * ================================================================
 */
import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { routing } from './routing.js';

export default getRequestConfig(async ({ requestLocale }) => {
  const requestedLocale = await requestLocale;
  const activeLocale = hasLocale(routing.locales, requestedLocale)
    ? requestedLocale
    : routing.defaultLocale;

  const messages = (await import(`../language/${activeLocale}/${activeLocale}.json`)).default;

  return { locale: activeLocale, messages };
});
