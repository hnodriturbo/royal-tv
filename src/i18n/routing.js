/**
 * ======================== /src/lib/language/routing.js ========================
 * 🧭 Central next-intl routing config
 * - Declares supported locales and URL style
 * - No domain splitting; always prefix locale in the path
 * ============================================================================
 */

import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  // 🌍 Supported locales
  locales: ['en', 'is'],

  // 🏠 Default locale
  defaultLocale: 'en',

  // 🔒 Strict URL control (no auto-detection)
  localeDetection: false,

  // 🌍 Always show /en or /is
  localePrefix: 'always'
});
