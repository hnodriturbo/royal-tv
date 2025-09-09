// next.config.mjs
import createNextIntlPlugin from 'next-intl/plugin';

// Auto-detects next-intl.config.(js|mjs) in project root
const withNextIntl = createNextIntlPlugin();

const nextConfig = {
  reactStrictMode: false,
  productionBrowserSourceMaps: true,
  eslint: { ignoreDuringBuilds: false }
};

export default withNextIntl(nextConfig);
