/**
 *   ======================= useNotifications.js =======================
 * 🔔
 * MAIN HOOK: Real-time, in-memory notifications for Royal TV user.
 * ---------------------------------------------------------------------
 * - React hook for managing a user's notifications over sockets (no REST).
 * - Always expects server to emit: { notifications: [], unreadCount, total }
 * - Handles fetching, live pushes, marking as read, manual refresh, and sorting.
 * - Exposes helpers for slicing previews, paginated drawers, etc.
 * - Built for safety (future proof), performance, and user experience!
 * =====================================================================
 * ⚙️
 * USAGE:
 *   const {
 *     notifications, unreadCount, loading,
 *     markAsRead, refreshNotifications,
 *     getPreview, getDrawerSlice, resortNotifications
 *   } = useNotifications(userId);
 * =====================================================================
 */

/**
 *   ======================= useNotifications.js =======================
 * 🔔 Real-time notifications with locale re-sync on change.
 */
import { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function useNotifications(userId) {
  const {
    requestNotifications,
    onNotificationsList,
    onNotificationReceived,
    markNotificationRead,
    deleteNotification,
    clearNotifications,
    onNotificationsError,
    // locale
    setLocale
  } = useSocketHub();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // 🌍 current UI locale
  const currentLocale = useLocale?.() || 'en';

  // 🧼 Coerce any value into displayable string (avoids React #130)
  const coerceText = useCallback(
    (value) => {
      if (value == null) return '';
      const t = typeof value;
      if (t === 'string' || t === 'number' || t === 'boolean') return String(value);
      if (t === 'object') {
        // server might send an object — choose by locale or stringify
        if (value.en || value.is) {
          const chosen = value[currentLocale] ?? value.en ?? value.is;
          return typeof chosen === 'string' ? chosen : JSON.stringify(chosen);
        }
        try {
          return JSON.stringify(value);
        } catch {
          return String(value);
        }
      }
      return String(value);
    },
    [currentLocale]
  );

  const normalizeNotification = useCallback(
    (n) => {
      if (!n || typeof n !== 'object') return null;
      return { ...n, title: coerceText(n.title), body: coerceText(n.body) };
    },
    [coerceText]
  );

  // 1) initial fetch + list subscription
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    requestNotifications(userId);
    const stop = onNotificationsList((data) => {
      let arr = Array.isArray(data?.notifications)
        ? data.notifications
        : Array.isArray(data)
          ? data
          : [];
      arr = arr.map(normalizeNotification).filter(Boolean);
      const unread = arr
        .filter((n) => !n.is_read)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const read = arr
        .filter((n) => n.is_read)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setNotifications([...unread, ...read]);
      setUnreadCount(unread.length);
      setLoading(false);
    });
    return () => stop && stop();
  }, [userId, requestNotifications, onNotificationsList, normalizeNotification]);

  // 2) push updates
  useEffect(() => {
    if (!userId) return;
    const stop = onNotificationReceived((n) => {
      setNotifications((prev) => {
        const x = normalizeNotification(n);
        if (!x) return prev;
        if (prev.some((p) => p.notification_id === x.notification_id)) return prev;
        const merged = [x, ...prev];
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
    return () => stop && stop();
  }, [userId, onNotificationReceived, normalizeNotification]);

  // 3) on locale change → tell socket + refetch authoritative list
  useEffect(() => {
    if (!userId) return;
    setLocale(currentLocale); // 📣 update server-side locale for this socket
    requestNotifications(userId); // 🔄 refresh with localized titles/bodies
  }, [currentLocale, userId, setLocale, requestNotifications]);

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

  const refreshNotifications = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    requestNotifications(userId);
  }, [userId, requestNotifications]);

  const removeNotification = useCallback(
    (notification_id) => {
      if (!userId || !notification_id) return;
      deleteNotification(notification_id, userId);
    },
    [deleteNotification, userId]
  );

  const clearAllNotifications = useCallback(() => {
    if (!userId) return;
    clearNotifications(userId);
  }, [clearNotifications, userId]);

  const getPreview = useCallback(
    (count = 3) => (notifications || []).slice(0, count),
    [notifications]
  );
  const getDrawerSlice = useCallback((s, e) => (notifications || []).slice(s, e), [notifications]);

  const resortNotifications = useCallback(() => {
    setNotifications((prev) => {
      const unread = (prev || [])
        .filter((n) => !n.is_read)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const read = (prev || [])
        .filter((n) => n.is_read)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return [...unread, ...read];
    });
  }, []);

  useEffect(() => {
    const stop = onNotificationsError((error) => {
      console.error('Notification error:', error?.message || error);
    });
    return () => stop && stop();
  }, [onNotificationsError]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    refreshNotifications,
    removeNotification,
    clearAllNotifications,
    getPreview,
    getDrawerSlice,
    resortNotifications
  };
}
