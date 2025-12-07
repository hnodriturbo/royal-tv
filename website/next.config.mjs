// next.config.mjs
import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  productionBrowserSourceMaps: true,
  eslint: { ignoreDuringBuilds: false }

  // 🛡️ Remove ALL console.* calls in production builds (keeps console.error)
  /*   compiler: {
    removeConsole: {
      exclude: ['error'] // Keep console.error for critical issues
    }
  } */
};

export default withNextIntl(nextConfig);
