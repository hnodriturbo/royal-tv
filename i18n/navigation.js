/**
 * ==================== /src/i18n/navigation.js ====================
 * 🧭 Client-side navigation utilities (locale-aware)
 * - Wraps next-intl/navigation with our routing config.
 * - Replaces Next.js router with locale-prefixed Link, useRouter, etc.
 * ================================================================
 */

import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

// 📦 Locale-aware exports
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);

// 🔍 Still export useSearchParams directly from Next.js
export { useSearchParams } from 'next/navigation';
