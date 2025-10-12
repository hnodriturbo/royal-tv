/**
 * ========== usePublicUnreadMessages (client) ==========
 * 🔔 Live unread counters — per-room (user scope) or global (admin scope)
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function usePublicUnreadMessages({
  public_conversation_id = null,
  adminGlobal = false
} = {}) {
  const { requestPublicUnreadBootstrap, onPublicUnreadUpdated } = useSocketHub();
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // 🧮 Initial value
    if (adminGlobal) {
      requestPublicUnreadBootstrap({ scope: 'admin' });
    } else if (public_conversation_id) {
      requestPublicUnreadBootstrap({ scope: 'user', public_conversation_id });
    }

    // 👂 Push updates
    const off = onPublicUnreadUpdated((payload) => {
      if (payload.scope === 'admin' && adminGlobal) {
        setTotal(Number(payload.total) || 0);
      } else if (
        payload.scope === 'user' &&
        public_conversation_id &&
        payload.public_conversation_id === public_conversation_id
      ) {
        setTotal(Number(payload.total) || 0);
      }
    });
    return () => off && off();
  }, [adminGlobal, public_conversation_id, requestPublicUnreadBootstrap, onPublicUnreadUpdated]);

  return useMemo(() => ({ total }), [total]);
}
