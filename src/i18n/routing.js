/**
 * ======================== /src/lib/language/routing.js ========================
 * 🧭 Central next-intl routing config (prefix-based)
 * =============================================================================
 */
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'is'], // 🌍 supported
  defaultLocale: 'en', // 🏠 default
  localePrefix: 'always', // 📛 /en/... & /is/...
  localeDetection: true // 🚫 no server negotiation
});
