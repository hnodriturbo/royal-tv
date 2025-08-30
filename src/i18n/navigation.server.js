/**
 * ============== /src/lib/language/navigation.server.js ==============
 * 🧭 Server-side navigation helpers (redirect/getPathname)
 * ===================================================================
 */
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing.js';

export const { redirect, permanentRedirect, getPathname } = createNavigation(routing);
