/**
<<<<<<< HEAD
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
    // 🧮 Request initial count
    if (adminGlobal) {
      requestPublicUnreadBootstrap({ scope: 'admin' });
    } else if (public_conversation_id) {
      requestPublicUnreadBootstrap({ scope: 'user', public_conversation_id });
    }

    // 👂 Subscribe to updates
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
    return off;
  }, [adminGlobal, public_conversation_id, requestPublicUnreadBootstrap, onPublicUnreadUpdated]);

  return useMemo(() => ({ total }), [total]);
}
=======
 * ============== usePublicUnreadMessages (client) ==============
 * 🔔 Live unread counters for public chat
 * --------------------------------------------------------------
 * Args:
 *   • public_conversation_id?: string   // per-room user count (badge)
 *   • adminGlobal?: boolean             // admin sees global count
 *
 * Returns:
 *   • unreadCount: number
 *   • markAllPublicRead(): void         // marks room as read (if id given)
 *
 * Behavior:
 *   • When mounted with a room id: auto-mark read once (can be removed).
 *   • Listens for push updates from the server after sends/reads/deletes.
 */
'use client';

import { useCallback, useEffect, useState } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';
>>>>>>> 0db5ae5 (finished usePublicMessageEvents.js & created usePublicRoomUsers.js & usePublicTypingIndicator.js & usePublicUnreadMessages.js)
