// next-intl.config.js
// Build-time safe: only plain data.
// Kept for tooling and future use; runtime is handled by our middleware + provider.

export default {
  locales: ['en', 'is'],
  defaultLocale: 'en'
  // No "messages" here; messages are loaded in app/[locale]/layout.js
};
