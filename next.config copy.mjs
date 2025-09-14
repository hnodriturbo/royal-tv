// next.config.mjs
/* eslint-env node */
import process from 'node:process';
import path from 'node:path';
import { createRequire } from 'node:module';
import createNextIntlPlugin from 'next-intl/plugin';

const require = createRequire(import.meta.url);
const withNextIntl = createNextIntlPlugin();

const isDebug = process.env.NEXT_PUBLIC_DEBUG_INVALID_ELEMENT === '1';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  productionBrowserSourceMaps: true,
  eslint: { ignoreDuringBuilds: false },
  webpack: (cfg, { dev }) => {
    if (isDebug && dev) {
      cfg.resolve = cfg.resolve || {};
      cfg.resolve.alias = {
        ...(cfg.resolve.alias || {}),
        // Map the originals so wrappers can import them without infinite recursion
        'react/jsx-runtime-original': require.resolve('react/jsx-runtime'),
        'react/jsx-dev-runtime-original': require.resolve('react/jsx-dev-runtime'),
        // Replace JSX runtimes with our wrappers
        'react/jsx-runtime': path.resolve(process.cwd(), 'src/components/dev/jsx-runtime.js'),
        'react/jsx-dev-runtime': path.resolve(
          process.cwd(),
          'src/components/dev/jsx-dev-runtime.js'
        )
      };
    }
    return cfg;
  }
};

export default withNextIntl(nextConfig);
