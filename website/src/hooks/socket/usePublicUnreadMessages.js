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

export default function usePublicUnreadMessages({
  public_conversation_id,
  adminGlobal = false
} = {}) {
  const [unreadCount, setUnreadCount] = useState(0);

  // 🛰️ Hub methods (see patch below)
  const {
    markPublicConversationRead,
    onPublicUserUnreadCount,
    onPublicAdminUnreadCount,
    requestPublicUnreadBootstrap
  } = useSocketHub();

  // 👂 Subscribe based on the mode
  useEffect(() => {
    // 🧠 Ask server for an initial value right away
    requestPublicUnreadBootstrap({
      public_conversation_id: public_conversation_id ?? null,
      adminGlobal
    });

    if (adminGlobal) {
      // 🧮 Global count for admins (all public rooms/users)
      const stop = onPublicAdminUnreadCount((count) => setUnreadCount(Number(count) || 0));
      return () => stop();
    }

    if (public_conversation_id) {
      // 🔢 Per-room count for this user/guest
      const stop = onPublicUserUnreadCount((payload) => {
        if (payload.public_conversation_id === public_conversation_id) {
          setUnreadCount(Number(payload.unreadCount) || 0);
        }
      });
      // ✅ Optional: mark read on mount so entering the room clears the badge
      markPublicConversationRead(public_conversation_id);
      return () => stop();
    }
  }, [
    adminGlobal,
    public_conversation_id,
    onPublicAdminUnreadCount,
    onPublicUserUnreadCount,
    requestPublicUnreadBootstrap,
    markPublicConversationRead
  ]);

  // ✋ Manual mark-all-read action
  const markAllPublicRead = useCallback(() => {
    if (public_conversation_id) markPublicConversationRead(public_conversation_id);
  }, [public_conversation_id, markPublicConversationRead]);

  return { unreadCount, markAllPublicRead };
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef
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
<<<<<<< HEAD
>>>>>>> 0db5ae5 (finished usePublicMessageEvents.js & created usePublicRoomUsers.js & usePublicTypingIndicator.js & usePublicUnreadMessages.js)
=======

export default function usePublicUnreadMessages({
  public_conversation_id,
  adminGlobal = false
} = {}) {
  const [unreadCount, setUnreadCount] = useState(0);

  // 🛰️ Hub methods (see patch below)
  const {
    markPublicConversationRead,
    onPublicUserUnreadCount,
    onPublicAdminUnreadCount,
    requestPublicUnreadBootstrap
  } = useSocketHub();

  // 👂 Subscribe based on the mode
  useEffect(() => {
    // 🧠 Ask server for an initial value right away
    requestPublicUnreadBootstrap({
      public_conversation_id: public_conversation_id ?? null,
      adminGlobal
    });

    if (adminGlobal) {
      // 🧮 Global count for admins (all public rooms/users)
      const stop = onPublicAdminUnreadCount((count) => setUnreadCount(Number(count) || 0));
      return () => stop();
    }

    if (public_conversation_id) {
      // 🔢 Per-room count for this user/guest
      const stop = onPublicUserUnreadCount((payload) => {
        if (payload.public_conversation_id === public_conversation_id) {
          setUnreadCount(Number(payload.unreadCount) || 0);
        }
      });
      // ✅ Optional: mark read on mount so entering the room clears the badge
      markPublicConversationRead(public_conversation_id);
      return () => stop();
    }
  }, [
    adminGlobal,
    public_conversation_id,
    onPublicAdminUnreadCount,
    onPublicUserUnreadCount,
    requestPublicUnreadBootstrap,
    markPublicConversationRead
  ]);

  // ✋ Manual mark-all-read action
  const markAllPublicRead = useCallback(() => {
    if (public_conversation_id) markPublicConversationRead(public_conversation_id);
  }, [public_conversation_id, markPublicConversationRead]);

  return { unreadCount, markAllPublicRead };
}
>>>>>>> ee83db8 (Public Live Chat hooks updates and creations, update of publicRoomEvents.js and generic errors in i18n translations for the message error event and function to use. Also created the bone structure of the widget component.)
