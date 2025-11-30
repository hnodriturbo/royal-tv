/**
 *   ================== usePublicUnreadMessages.js ==================
 * 🔔 Real-time unread message count for public live chat
 * ===============================================================
 * PROPS:
 *   public_conversation_id?: string   // For per-convo count
 *   adminGlobal?: boolean             // True = admin global count
 * ===============================================================
 * USAGE:
 *   const { unreadCount, markAllRead } = usePublicUnreadMessages({
 *     public_conversation_id, adminGlobal: false
 *   });
 * ===============================================================
 */

import { useState, useEffect, useCallback } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function usePublicUnreadMessages({
  public_conversation_id,
  adminGlobal = false
} = {}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const { markPublicMessagesRead, listen } = useSocketHub();

  // Listen for updates
  useEffect(() => {
    if (adminGlobal) {
      // Admin wants global unread count (all users)
      const stop = listen('public_message:unread_admin', (data) => {
        setUnreadCount(data.total || 0);
      });
      return () => stop();
    } else if (public_conversation_id) {
      // User wants unread in this conversation
      const stop = listen('public_message:unread_user', (data) => {
        if (data.public_conversation_id === public_conversation_id) {
          setUnreadCount(data.total || 0);
        }
      });
      // Mark as read when mounting
      markPublicMessagesRead(public_conversation_id);
      return () => stop();
    }
  }, [adminGlobal, public_conversation_id, markPublicMessagesRead, listen]);

  // Manual mark-all-read function
  const markAllRead = useCallback(() => {
    if (public_conversation_id) {
      markPublicMessagesRead(public_conversation_id);
    }
  }, [public_conversation_id, markPublicMessagesRead]);

  return { unreadCount, markAllRead };
}
