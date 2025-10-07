/**
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
}
