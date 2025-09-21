// next.config.mjs
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  productionBrowserSourceMaps: true,
  eslint: { ignoreDuringBuilds: false }
  // no webpack aliasing needed anymore
};

export default withNextIntl(nextConfig);
