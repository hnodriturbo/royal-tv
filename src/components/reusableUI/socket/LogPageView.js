'use client';
/**
 * ===============================================
 * LogPageView.js — Socket page view logs (Client)
 * ------------------------------------------------
 * • Translated via `useTranslations()`
 * • Only logs when pathname actually changes
 * • Sends a *string* description (not an object) to avoid
 *   “expected string, got object” issues downstream
 * ===============================================
 */

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SafeString } from '@/lib/ui/SafeString';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function LogPageView() {
  const t = useTranslations();
  const { logPageVisit, socketConnected } = useSocketHub();
  const pathname = usePathname();
  const previousPathRef = useRef();

  useEffect(() => {
    if (!logPageVisit || !socketConnected) return;

    if (previousPathRef.current !== pathname) {
      // 🧼 normalize the path and derive a human-friendly “last segment”
      const decoded = decodeURIComponent(pathname || '/');
      const cleaned = decoded.replace(/\/$/, '');
      const segments = cleaned.split('/');
      const last = segments[segments.length - 1] || 'home';

      // 📝 IMPORTANT: make description a STRING (not object)
      const description = SafeString(t('socket.ui.logPageView.description', { page: last }), '');

      logPageVisit({
        page: decoded,
        event: 'page_visit',
        description // ✅ string payload
      });

      previousPathRef.current = pathname;
    }
  }, [pathname, logPageVisit, socketConnected, t]);

  return null;
}
