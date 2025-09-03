// next.config.mjs  ✅ ESM
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.js');
/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: false, // ⚙️ keep strict mode
  productionBrowserSourceMaps: true, // 🐞 useful prod debugging
  eslint: { ignoreDuringBuilds: false }
};

// ✅ Export your real config wrapped by the plugin (not `{}`)
export default withNextIntl(nextConfig);
