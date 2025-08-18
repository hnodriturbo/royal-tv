/**
 * ========== src/hooks/socket/useLocale.js ==========
 * 🌍 Client ↔ Server Locale Sync (via Socket Hub)
 * - Reads active UI locale from next-intl
 * - On mount/changes: sends locale to server with set_locale (guarded)
 * - Listens for server 'locale_changed' ack
 * - Exposes: currentLocale (client), serverLocale (last ack), isInSync, setServerLocale
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useLocale as useNextIntlLocale } from 'next-intl';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function useLocale() {
  // 🌍 authoritative client-side locale (from next-intl)
  const currentLocale = useNextIntlLocale?.() || 'en';

  // 🔌 socket hub helpers
  const { setLocale, onLocaleChanged, socketConnected } = useSocketHub();

  // 📦 last server-acknowledged locale
  const [serverLocale, setServerLocale] = useState(null);

  // 🔁 whenever client locale changes or socket connects, push to server
  useEffect(() => {
    if (!currentLocale) return; // 🛡️ guard
    setLocale(currentLocale); // 📤 tell server our current UI locale
  }, [currentLocale, setLocale, socketConnected]);

  // 📥 listen for server ack and store it locally
  useEffect(() => {
    const stopListeningToLocaleChanged = onLocaleChanged(({ locale }) => {
      setServerLocale(locale || null); // 🧭 remember last ack'd locale
    });
    return stopListeningToLocaleChanged;
  }, [onLocaleChanged]);

  // ✅ convenience flag: true if server and client are in sync
  const isInSync = useMemo(() => {
    return !!serverLocale && serverLocale === currentLocale;
  }, [serverLocale, currentLocale]);

  // 🔧 expose an imperative setter (rarely used directly)
  const setServerLocale = (locale) => setLocale(locale);

  return {
    currentLocale, // 🌍 from next-intl (client source of truth)
    serverLocale, // 📥 last ack from server
    isInSync, // ✅ true once server acks the same locale
    setServerLocale // 🔧 request server-only switch
  };
}
