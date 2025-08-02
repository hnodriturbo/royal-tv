/**
 *   ========== useNotifications.js ==========
 * 🔔
 * Real-time notifications hook (user-scoped)
 * - Fetch on mount + on-demand
 * - Push-update when new notification_created fires
 * - Keeps unread first, newest first
 * - Slices for preview/drawer
 * ==========================================
 */

import { useState, useEffect, useCallback } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function useNotifications(userId) {
  const {
    requestNotifications,
    onNotificationsUpdate,
    onNotificationReceived,
    markNotificationRead
  } = useSocketHub();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // ─── 1️⃣ Full list handler ───────────────────────────────
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    requestNotifications(userId);

    const stop = onNotificationsUpdate(({ notifications, unreadCount }) => {
      // sort unread/newest then read/newest
      const unread = notifications
        .filter((n) => !n.is_read)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const read = notifications
        .filter((n) => n.is_read)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setNotifications([...unread, ...read]);
      setUnreadCount(unread.length);
      setLoading(false);
    });

    return () => stop && stop();
  }, [userId, requestNotifications, onNotificationsUpdate]);

  // ─── 2️⃣ Push handler (optional: you can skip re-fetch and just prepend) ──
  useEffect(() => {
    if (!userId) return;
    const stopPush = onNotificationReceived((newNotif) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.notification_id === newNotif.notification_id)) return prev;
        const merged = [newNotif, ...prev];
        const unread = merged
          .filter((n) => !n.is_read)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const read = merged
          .filter((n) => n.is_read)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setUnreadCount(unread.length);
        return [...unread, ...read];
      });
    });
    return () => stopPush && stopPush();
  }, [userId, onNotificationReceived]);

  // ─── 3️⃣ Mark-as-read ──────────────────────────────────────
  const markAsRead = useCallback(
    (notification_id) => {
      if (!notification_id) return;
      markNotificationRead(notification_id);
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === notification_id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    },
    [markNotificationRead]
  );

  // ─── 4️⃣ Manual refresh ───────────────────────────────────
  const refreshNotifications = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    requestNotifications(userId);
  }, [userId, requestNotifications]);

  // ─── 5️⃣ Slicing helpers ─────────────────────────────────
  function getPreview(count = 3) {
    return notifications.slice(0, count);
  }
  function getDrawerSlice(startIdx, endIdx) {
    return notifications.slice(startIdx, endIdx);
  }

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    refreshNotifications,
    getPreview,
    getDrawerSlice
  };
}
