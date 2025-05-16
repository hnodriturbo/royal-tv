// next.config.js — ESM format for Next.js config (requires "type": "module" in package.json)
import path from 'path';

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  reactStrictMode: true
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

export default nextConfig;
