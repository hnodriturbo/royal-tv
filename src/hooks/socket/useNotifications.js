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

import logger from '@/lib/core/logger';
import { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl'; // 🌍 current UI locale
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function useNotifications(userId) {
  // 🎛️ Get all notification-related socket functions from your unified socket hub
  const {
    requestNotifications,
    onNotificationsList,
    onNotificationReceived,
    markNotificationRead,
    deleteNotification,
    clearNotifications,
    onNotificationsError
  } = useSocketHub();

  // 📦 Local state: full list, unread badge, loading spinner
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // 🌍 active locale (en | is)
  const currentLocale = useLocale?.() || 'en';

  // 🧼 Coerce any value into displayable string
  const coerceText = useCallback(
    (value) => {
      if (value == null) return '';
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
      }
      if (typeof value === 'object') {
        // server might send { en: '...', is: '...' }
        if (value.en || value.is) {
          const chosen = value[currentLocale] ?? value.en ?? value.is;
          return typeof chosen === 'string' ? chosen : JSON.stringify(chosen);
        }
        if (Array.isArray(value)) return value.map(coerceText).join('\n');
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

  // 🧩 Normalize one notification
  const normalizeNotification = useCallback(
    (n) => {
      if (!n || typeof n !== 'object') return null;
      return {
        ...n,
        title: coerceText(n.title),
        body: coerceText(n.body)
      };
    },
    [coerceText]
  );

  // ============================================================
  // 1️⃣ Fetch & listen for notifications when user logs in
  // ============================================================
  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    requestNotifications(userId);

    const stop = onNotificationsList((data) => {
      let notificationArray = [];
      let unreadCountFromServer = 0;

      if (data && Array.isArray(data.notifications)) {
        notificationArray = data.notifications;
        unreadCountFromServer = data.unreadCount || 0;
      } else if (data && Array.isArray(data)) {
        notificationArray = data;
      } else {
        notificationArray = [];
      }

      // 🧼 normalize
      notificationArray = notificationArray.map(normalizeNotification).filter(Boolean);

      // 🔀 sort unread first, then read
      const unread = notificationArray
        .filter((n) => !n.is_read)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const read = notificationArray
        .filter((n) => n.is_read)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setNotifications([...unread, ...read]);
      setUnreadCount(unread.length);
      setLoading(false);
    });

    return () => stop && stop();
  }, [userId, requestNotifications, onNotificationsList, normalizeNotification]);

  // ============================================================
  // 2️⃣ Handle real-time pushes
  // ============================================================
  useEffect(() => {
    if (!userId) return;
    const stopPush = onNotificationReceived((newNotif) => {
      setNotifications((prev) => {
        const normalized = normalizeNotification(newNotif);
        if (!normalized) return prev;
        if (prev.some((n) => n.notification_id === normalized.notification_id)) return prev;

        const merged = [normalized, ...prev];
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
  }, [userId, onNotificationReceived, normalizeNotification]);

  // ============================================================
  // 3️⃣ Mark as read (optimistic update)
  // ============================================================
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

  // ============================================================
  // 4️⃣ Manual refresh
  // ============================================================
  const refreshNotifications = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    requestNotifications(userId);
  }, [userId, requestNotifications]);

  // 🗑️ Delete one
  const removeNotification = useCallback(
    (notification_id) => {
      if (!userId || !notification_id) return;
      deleteNotification(notification_id, userId);
    },
    [deleteNotification, userId]
  );

  // 🔥 Delete all
  const clearAllNotifications = useCallback(() => {
    if (!userId) return;
    clearNotifications(userId);
  }, [clearNotifications, userId]);

  // ============================================================
  // 5️⃣ Helpers: preview/drawer slicing
  // ============================================================
  const getPreview = useCallback(
    (count = 3) => (notifications || []).slice(0, count),
    [notifications]
  );
  const getDrawerSlice = useCallback(
    (startIdx, endIdx) => (notifications || []).slice(startIdx, endIdx),
    [notifications]
  );

  // ============================================================
  // 6️⃣ Resort notifications
  // ============================================================
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

  // ============================================================
  // 7️⃣ Handle errors
  // ============================================================
  useEffect(() => {
    const stop = onNotificationsError((error) => {
      logger.error('Notification error:', error?.message || error);
    });
    return () => stop && stop();
  }, [onNotificationsError]);

  // ============================================================
  // ✅ Export everything for NotificationCenter and others
  // ============================================================
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
