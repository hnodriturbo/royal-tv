/**
 * ==================== /src/lib/language/index.js ====================
 * 📦 Barrel exports for language utilities
 * ====================================================================
 */
export { routing } from './routing'; // 🌍 shared config
export { Link, useRouter, usePathname } from './navigation'; // 🧭 client
export { redirect, getPathname } from './navigation.server'; // 🚦 server
