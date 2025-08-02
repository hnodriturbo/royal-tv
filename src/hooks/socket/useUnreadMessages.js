/**
 *   ================== useUnreadMessages.js ==================
 * 🔔
 * Real-time unread message or conversation count (live only).
 * - Handles both user and admin badge counts.
 * =============================================================
 * PROPS:
 *   conversation_id?: string          // For per-convo count
 *   adminGlobal?: boolean             // True = admin global count
 * =============================================================
 * USAGE:
 *   const { unreadCount, markAllRead } = useUnreadMessages({
 *     conversation_id, adminGlobal: false
 *   });
 * =============================================================
 */

import { useState, useEffect, useCallback } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function useUnreadMessages({ conversation_id, adminGlobal = false } = {}) {
  const [unreadCount, setUnreadCount] = useState(0);

  // Destructure relevant socket methods
  const { markRead, onUserUnreadCount, onAdminUnreadCount } = useSocketHub();

  // Listen for updates
  useEffect(() => {
    if (adminGlobal) {
      // Admin wants global unread count (all users)
      const stop = onAdminUnreadCount((count) => setUnreadCount(count));
      return () => stop();
    } else if (conversation_id) {
      // User wants unread in this conversation
      const stop = onUserUnreadCount((data) => {
        if (data.conversation_id === conversation_id && data.chatType === 'live')
          setUnreadCount(data.unreadCount);
      });
      // Mark as read when mounting (optional)
      markRead(conversation_id);
      return () => stop();
    }
    // Optionally: if you want user-wide badge count, use onUserUnreadBadge
  }, [adminGlobal, conversation_id, markRead, onUserUnreadCount, onAdminUnreadCount]);

  // Manual mark-all-read function
  const markAllRead = useCallback(() => {
    if (conversation_id) markRead(conversation_id);
  }, [conversation_id, markRead]);

  return { unreadCount, markAllRead };
}
