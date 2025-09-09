/**
 * LogPageView.js — Socket page view logs
 * - Translated via useTranslations()
 * - Only logs when pathname actually changes
 */
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import useSocketHub from '@/hooks/socket/useSocketHub';

export default function LogPageView() {
  const t = useTranslations();
  const { logPageVisit, socketConnected } = useSocketHub();
  const pathname = usePathname();
  const previousPathRef = useRef();

  useEffect(() => {
    if (!logPageVisit || !socketConnected) return;

    if (previousPathRef.current !== pathname) {
      const decoded = decodeURIComponent(pathname || '/');
      const cleaned = decoded.replace(/\/$/, '');
      const segments = cleaned.split('/');
      const last = segments[segments.length - 1] || 'home';

      const description = t('socket.ui.logPageView.description', { page: last });

      logPageVisit({
        page: decoded,
        event: 'page_visit',
        description
      });

      previousPathRef.current = pathname;
    }
  }, [pathname, logPageVisit, socketConnected, t]);

  return null;
}
