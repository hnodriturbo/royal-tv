/**
 * ==================== /src/lib/language/navigation.js ====================
 * 🧭 Locale-aware navigation wrappers (next-intl v3)
 * - Create Link, useRouter, usePathname, redirect, getPathname via createNavigation
 * - Always keeps/updates the /en|/is prefix based on our routing config
 * =========================================================================
 */

'use client'; // 🧠 hooks live on the client

// 🏗️ Build locale-aware navigation APIs from our routing config
import { createNavigation } from 'next-intl/navigation'; // 🔧 factory
import { routing } from './routing'; // 🌍 our locales + options

// 📦 Export the generated APIs for app-wide use
export const { Link, useRouter, usePathname, redirect, getPathname } = createNavigation(routing); // ✨ the magic happens here
