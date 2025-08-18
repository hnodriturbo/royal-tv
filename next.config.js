// next.config.js — ESM format for Next.js config (requires "type": "module" in package.json)
// import path from 'path';
import createNextIntlPlugin from 'next-intl/plugin'; // 🧩 plugin entry

// 🗺️ If you keep request.js at a custom path, pass it here:
const withNextIntl = createNextIntlPlugin('./src/i18n/request.js');

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true
  // 🌐 Built-in internationalized routing
  // i18n: {
  //   locales: ['en', 'is'], // 🗣️ supported locales
  //   defaultLocale: 'en', // 🧭 default (no prefix unless you force it)
  //   localeDetection: true // 🔎 leave true for auto-detect on first visit
  // }
  // Uncomment to enable experimental features
  // experimental: {
  //   appDir: true,
  //   turbopack: true,
  // },

  // Custom webpack aliases
  /*   webpack(config) {
    Object.assign(config.resolve.alias, {
      '@src': path.resolve(process.cwd(), 'src'),
      '@socketHandlers': path.resolve(process.cwd(), 'src/handlers/socket'),
      '@lib': path.resolve(process.cwd(), 'src/lib'),
      '@context': path.resolve(process.cwd(), 'src/context')
    });
    return config;
  } */
};
export default withNextIntl({});
/* export default withNextIntl(nextConfig); */
/* export default nextConfig; */
