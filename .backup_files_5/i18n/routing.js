/**
 * ======================== /src/i18n/routing.js ========================
 * 🧭 Central next-intl routing config (prefix-based)
 * - Defines supported locales and behavior for locale detection.
 * - Enforces prefix: always (so routes are /en/... and /is/...).
 * =====================================================================
 */

import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'is'], // 🌍 supported locales
  defaultLocale: 'en', // 🏠 default
  localePrefix: 'always', // 📛 always prefixed
  localeDetection: true // 🔎 allow automatic detection
});
