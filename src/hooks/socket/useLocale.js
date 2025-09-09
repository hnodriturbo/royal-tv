/**
 * ======================== useLocale (client) ========================
 * 🔁 Manage current UI locale on the client + inform Socket.IO server
 * - Uses /api/locale to persist NEXT_LOCALE
 * - Uses socket hub to emit "set_locale" and listen "locale_changed"
 * ===================================================================
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useLocale as useNextIntlLocale } from 'next-intl';
import useSocketHub from '@/hooks/socket/useSocketHub';

export function useLocaleController() {
  const intlLocale = useNextIntlLocale(); // 🌍 'en' | 'is'
  const [currentLocale, setCurrentLocale] = useState(intlLocale);
  const { setLocale, onLocaleChanged } = useSocketHub(); // 📡 hub API

  // 🔁 Change locale: cookie + socket
  const changeLocale = useCallback(
    async (nextLocale) => {
      const normalized = String(nextLocale || '')
        .toLowerCase()
        .startsWith('is')
        ? 'is'
        : 'en';

      // Persist cookie (middleware uses this too)
      await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: normalized })
      }).catch(() => {});

      setCurrentLocale(normalized);
      // Tell socket server (hub will queue if disconnected)
      setLocale(normalized);
    },
    [setLocale]
  );

  // Keep local state aligned with route-level locale
  useEffect(() => {
    if (intlLocale !== currentLocale) {
      setCurrentLocale(intlLocale);
      setLocale(intlLocale); // sync socket on route-based changes
    }
  }, [intlLocale, currentLocale, setLocale]);

  // Optional: react to server acks (no-op by default)
  useEffect(() => {
    const off = onLocaleChanged?.(() => {
      /* could toast "language updated" */
    });
    return () => off && off();
  }, [onLocaleChanged]);

  return { currentLocale, changeLocale };
}
