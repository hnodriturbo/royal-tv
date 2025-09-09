/**
 * ==================== /src/i18n/index.js ====================
 * 📦 Barrel exports for language utilities
 * - Central export hub for routing, client, and server helpers.
 * - Uses next-intl + our custom routing config.
 * ==============================================================
 */

export { routing } from './routing'; // 🌍 shared locale/routing config
export { Link, useRouter, usePathname, useSearchParams } from './navigation'; // 🧭 client-side
export { redirect, getPathname } from './navigation.server'; // 🚦 server-side
