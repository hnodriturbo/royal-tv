/**
 * ============== /src/i18n/navigation.server.js ==============
 * 🧭 Server-side navigation helpers (redirect/getPathname)
 * - For server actions, redirects, and pathname parsing.
 * - Uses next-intl with our routing config.
 * ==============================================================
 */

import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing.js';

// 🚦 Server-only navigation helpers
export const { redirect, permanentRedirect, getPathname } = createNavigation(routing);
