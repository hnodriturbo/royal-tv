// 📁 next.config.mjs
/**
 * 🚀 Royal-TV Next.js 15 config
 * ----------------------------
 * • React Strict Mode ✅
 * • Strips all console.* calls in production except warn/error 🧹
 * • Exports a function so we can branch on the current build phase 🔀
 *
 *   ‼️ Place this file in the project root (same level as package.json).
 */

import { PHASE_PRODUCTION_BUILD } from 'next/constants.js'; // 1️⃣ phase helper

// 🌱 Base config shared by *every* phase
const baseConfig = {
  // 🕵️‍♂️ Enable extra React warnings in dev
  /* reactStrictMode: true, */

  // 🧹 Remove noisy console logs when you build for prod
  compiler: {
    removeConsole:
      process.env.NODE_ENV === 'production'
        ? { exclude: ['error', 'warn'] } // keep these two only
        : false, // keep everything in dev
  },

  // ➕ Add more top-level options here when you need them
  // images: { remotePatterns: [...] },
  // experimental: { serverActions: true },
};

// 🎛️ Export a function so you *can* tweak per-phase
export default function nextConfig(phase /*, { defaultConfig } */) {
  // 🚦 Extra tweaks *only* for the final production bundle
  if (phase === PHASE_PRODUCTION_BUILD) {
    return {
      ...baseConfig,

      // 🔐 Disable client-side source-maps in production
      productionBrowserSourceMaps: false,
    };
  }

  // ✅ For dev / preview phases we just return the base config
  return baseConfig;
}
