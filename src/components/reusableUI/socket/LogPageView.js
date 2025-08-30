/**
 * =========================================
 * 🧭 LogPageView.js — Socket page view logs
 * -----------------------------------------
 * - Translated via useTranslations() 🌍
 * - Only logs when pathname actually changes
 * =========================================
 */
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from '@/i18n';
import useSocketHub from '@/hooks/socket/useSocketHub';
import { useTranslations } from 'next-intl'; // 🌍 i18n root translator

export default function LogPageView() {
  const t = useTranslations(); // 🌍 translation hook
  const { logPageVisit, socketConnected } = useSocketHub();
  const pathname = usePathname();
  const previousPathReference = useRef();

  useEffect(() => {
    // ⛔ Skip if hub not ready or no socket
    if (!logPageVisit || !socketConnected) return;

    // 🔁 Only when route actually changes
    if (previousPathReference.current !== pathname) {
      // 🔎 Decode for readability
      const decodedPathname = decodeURIComponent(pathname);

      // 🏷️ Human‑friendly last segment
      const cleanedPath = decodedPathname.replace(/\/$/, '');
      const pathSegments = cleanedPath.split('/');
      const lastSegment = pathSegments[pathSegments.length - 1] || 'home';

      // 🗒️ Use translated description with i18n placeholder interpolation
      const description = t('socket.ui.logPageView.description', { page: lastSegment });

      // 📤 Emit to socket hub
      logPageVisit({
        page: decodedPathname, // 📝 Store decoded path
        event: 'page_visit', // 🔖 Event key (kept as stable identifier)
        description // 🌍 Localized description
      });

      // 🧷 Remember path for next run
      previousPathReference.current = pathname;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, logPageVisit, socketConnected]); // 🧩 include t safely

  return null; // 🙈 Nothing visible
}
