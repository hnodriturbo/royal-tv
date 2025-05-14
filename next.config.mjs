// next.config.mjs
import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
    turbopack: true,
  },
  webpack(config) {
    // Mirror the aliases declared in _moduleAliases
    Object.assign(config.resolve.alias, {
      '@src': path.resolve(__dirname, 'src'),
      '@socketHandlers': path.resolve(__dirname, 'src/handlers/socket'),
      '@lib': path.resolve(__dirname, 'src/lib'),
      '@context': path.resolve(__dirname, 'src/context'),
    });

    return config;
  },
};

export default nextConfig;
