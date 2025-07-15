/**
 *   ========== useNotifications.js ==========
 * 🟣
 * Main notifications hook:
 * - Holds notifications array in state (receives from socket)
 * - Handles unread count, sorting, marking as read
 * - Slices notifications for UI (preview/drawer/etc.)
 * - No socketConnected logic needed—handled by useSocketHub!
 * ===========================================
 */

import { useState, useEffect, useCallback } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function useNotifications(userId) {
  // 🟪 Core socketHub functions (guarded, queued until connected)
  const {
    requestNotifications,
    onNotificationsUpdate,
    markNotificationRead,
    onNotificationReceived
  } = useSocketHub();

  // 🗃️ Local state for all notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 1️⃣ Listen for notifications and auto-refresh events
  useEffect(() => {
    if (!userId) return;

    // 👂 Listen for new notifications_list payloads
    const stop = onNotificationsUpdate((payload) => {
      if (payload && Array.isArray(payload.notifications)) {
        // 🟦 Sort: unread first (newest first), then read (newest first)
        const unread = payload.notifications
          .filter((n) => !n.is_read)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const read = payload.notifications
          .filter((n) => n.is_read)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setNotifications([...unread, ...read]);
        setUnreadCount(unread.length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    });

    // 👂 Listen for live push events—auto-refresh when triggered
    const stopPush = onNotificationReceived(() => {
      requestNotifications(userId); // 🔄 Ask backend for latest notifications
    });

    // 🟢 Initial fetch on mount/user change
    requestNotifications(userId);

    // 🧹 Cleanup listeners when hook unmounts or userId changes
    return () => {
      stop && stop();
      stopPush && stopPush();
    };
  }, [userId, requestNotifications, onNotificationsUpdate, onNotificationReceived]);

  // 2️⃣ Mark as read: calls backend, updates local state optimistically
  const markAsRead = useCallback(
    (notification_id) => {
      if (!notification_id) return;
      markNotificationRead(notification_id); // 🚀 Socket backend
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.notification_id === notification_id ? { ...notif, is_read: true } : notif
        )
      );
      // 🚫 Do NOT resort here! UI will reorder on next open/collapse if needed
    },
    [markNotificationRead]
  );

  // 3️⃣ Resort function: pushes read notifications down, keeps both newest-first
  const resortNotifications = useCallback(() => {
    setNotifications((prevNotifs) => {
      const unread = prevNotifs
        .filter((n) => !n.is_read)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const read = prevNotifs
        .filter((n) => n.is_read)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return [...unread, ...read];
    });
  }, []);

  // ✅ Add this clearly missing function:
  const refreshAndResortNotifications = useCallback(() => {
    requestNotifications(userId);
    setTimeout(resortNotifications, 300);
  }, [userId, requestNotifications, resortNotifications]);

  // 4️⃣ Helpers for UI slicing
  function getPreview(count = 3) {
    return notifications.slice(0, count);
  }
  function getDrawerSlice(startIdx, endIdx) {
    return notifications.slice(startIdx, endIdx);
  }

  // 5️⃣ Return everything for components to use!
  return {
    notifications, // 📨 Array of all notifications, sorted (unread first)
    unreadCount, // 🔢 Number of unread
    markAsRead, // 🟢 Mark one as read (calls backend + local update)
    getPreview, // 👁️ Get preview slice for UI
    getDrawerSlice, // 👁️ Get drawer slice for drawer UI
    resortNotifications, // 🔄 Resort list (read at bottom)
    refreshAndResortNotifications
  };
}
