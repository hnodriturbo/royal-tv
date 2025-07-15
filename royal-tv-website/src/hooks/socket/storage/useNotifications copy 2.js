/**
 *   ========== useNotifications.js ==========
 * 🟣
 * Main notifications hook (Royal TV)
 * - Holds all notifications in state (from socket)
 * - Handles unread count, sorting, marking as read
 * - Live refresh on push from backend
 * - Slices notifications for UI (preview/drawer)
 * ============================================
 */

import { useState, useEffect, useCallback } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function useNotifications(userId) {
  // 🟣 SocketHub events & emitters
  const {
    requestNotifications, // 🔄 Ask server for all notifications
    onNotificationsUpdate, // 👂 Listen for 'notifications_list'
    onNotificationReceived, // 👂 Listen for push trigger (live update)
    markNotificationRead // ✅ Mark as read on server
  } = useSocketHub();

  // 🟦 Local state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 🟩 Helper: sorts notifications as needed (unread, then read, both newest first)
  const sortNotifications = useCallback((list) => {
    const unread = list
      .filter((n) => !n.is_read)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const read = list
      .filter((n) => n.is_read)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return [...unread, ...read];
  }, []);

  // 🟠 1️⃣ Fetch and listen for notifications_list event (from socket)
  useEffect(() => {
    if (!userId) return;
    // 🔄 Request notifications on mount/userId change
    requestNotifications(userId);

    // 👂 Listen for 'notifications_list' from server
    const stop = onNotificationsUpdate((payload) => {
      if (payload && Array.isArray(payload.notifications)) {
        const sorted = sortNotifications(payload.notifications);
        setNotifications(sorted);
        setUnreadCount(sorted.filter((n) => !n.is_read).length);
        // 🟩 [LOG] Updated notifications and unread count
        console.log('🟩 [useNotifications] Set notifications:', sorted);
        console.log(
          '🟧 [useNotifications] Set unreadCount:',
          sorted.filter((n) => !n.is_read).length
        );
      } else {
        setNotifications([]);
        setUnreadCount(0);
        console.log('🟨 [useNotifications] No notifications received.');
      }
    });

    // 👂 Listen for push trigger ('notification_received') and refresh notifications when it happens
    const stopPush = onNotificationReceived(() => {
      // 🟣 [LOG] Push notification trigger received, refreshing...
      console.log('🟣 [useNotifications] notification_received → refreshing');
      requestNotifications(userId);
    });

    return () => {
      stop && stop();
      stopPush && stopPush();
    };
  }, [
    userId,
    requestNotifications,
    onNotificationsUpdate,
    onNotificationReceived,
    sortNotifications
  ]);

  // 🟡 2️⃣ Mark notification as read (optimistic update)
  const markAsRead = useCallback(
    (notification_id) => {
      if (!notification_id) return;
      markNotificationRead(notification_id); // 🚀 Triggers socket backend

      // 🟠 Optimistically mark as read in local state for instant UI
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.notification_id === notification_id ? { ...notif, is_read: true } : notif
        )
      );
      // 🟢 Update unread count immediately
      setUnreadCount((prev) => Math.max(0, prev - 1));
      // 🚫 No resort here (leave it for UI to call manually)
    },
    [markNotificationRead]
  );

  // 3️⃣ Resort function: pushes read notifications down
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

  // 4️⃣ Slicers for preview/drawer (optional, for NotificationCenter UI)
  function getPreview(count = 3) {
    return notifications.slice(0, count);
  }
  function getDrawerSlice(startIdx, endIdx) {
    return notifications.slice(startIdx, endIdx);
  }

  // 5️⃣ Return all helpers & state
  return {
    notifications, // 📨 Array of all notifications, sorted (unread first)
    unreadCount, // 🔢 Number of unread
    markAsRead, // 🟢 Mark one as read (calls backend + optimistically updates UI)
    getPreview, // 👁️ Get preview slice for top UI
    getDrawerSlice, // 👁️ Get drawer slice for drawer UI
    resortNotifications // 🔄 Resort current list (pushes read to bottom)
  };
}
