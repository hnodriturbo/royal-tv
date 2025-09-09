// src/i18n/request.js
import 'server-only';
import { getRequestConfig } from 'next-intl/server';

// Optional: centralize supported locales
const SUPPORTED_LOCALES = ['en', 'is'];
const DEFAULT_LOCALE = 'en';

// Lazy-load JSON per request to avoid build-time FS work.
// Adjust the import path to where your messages live.
async function loadMessages(locale) {
  try {
    // If your messages are in src/messages/{locale}.json:
    const mod = await import(`../messages/${locale}.json`);
    return mod.default || mod;
  } catch {
    // Fallback to default if file missing
    if (locale !== DEFAULT_LOCALE) {
      const mod = await import(`../messages/${DEFAULT_LOCALE}.json`);
      return mod.default || mod;
    }
    return {};
  }
}

// next-intl expects a *default export* of a request config fn
export default getRequestConfig(async ({ locale }) => {
  // Normalize to supported locales
  const chosen =
    typeof locale === 'string' && SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;

  const messages = await loadMessages(chosen);

  // Return the per-request config
  return {
    locale: chosen,
    messages
  };
});
