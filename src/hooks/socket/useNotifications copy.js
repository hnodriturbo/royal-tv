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
import { useState, useEffect, useCallback } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function useNotifications(userId) {
  // 🎛️ Get all notification-related socket functions from your unified socket hub
  const {
    requestNotifications, // 🔹 Ask server for all my notifications
    onNotificationsList, // 🔹 Listen for full list (fetch/refresh)
    onNotificationReceived, // 🔹 Listen for single real-time notification pushes
    markNotificationRead, // 🔹 Ask server to mark a specific notification as read
    deleteNotification, // 🔹 Ask server to delete single notification for user / admin
    clearNotifications, // 🔹 Ask server to clear all notifications for user / admin
    onNotificationsError // 🔹 Used For showing errors to user
  } = useSocketHub();

  // 📦 Local state: full list, unread badge, loading spinner
  const [notifications, setNotifications] = useState([]); // All notifications (unread first)
  const [unreadCount, setUnreadCount] = useState(0); // Unread count for badge
  const [loading, setLoading] = useState(false); // Is loading (UI spinner)

  // ============================================================
  // 1️⃣ ON MOUNT / USER CHANGE: Fetch & listen for notifications
  // ------------------------------------------------------------
  // - When user logs in or changes, auto-fetch notifications from server.
  // - Listen for server's notifications_list event.
  // - Handles initial load, manual refresh, and server-initiated refreshes.
  // ============================================================
  useEffect(() => {
    if (!userId) return; // 🛑 No user, skip everything

    setLoading(true); // 🚦 Show loading spinner while waiting for server

    // ⬆️ Ask server for full list (triggers server to emit notifications_list)
    requestNotifications(userId);

    // 👂 Listen for the "notifications_list" socket event
    // Server always emits: { notifications: [...], unreadCount, total }
    const stop = onNotificationsList((data) => {
      // 👀 Defensive parsing: always expect an object, fallback to empty array
      let notificationArray = [];
      let unreadCountFromServer = 0;

      if (data && Array.isArray(data.notifications)) {
        // 🟢 Standard case: data.notifications is an array
        notificationArray = data.notifications;
        unreadCountFromServer = data.unreadCount || 0;
      } else if (data && Array.isArray(data)) {
        // 🟡 Fallback: server (old) sent a bare array instead of object
        notificationArray = data;
      } else {
        // 🔴 Totally empty/null/undefined: treat as empty
        notificationArray = [];
      }

      // 🔀 SORT: Show all unread first (newest first), then read (newest first)
      const unread = notificationArray
        .filter((n) => n && !n.is_read)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const read = notificationArray
        .filter((n) => n && n.is_read)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // ✅ Save to state: full list and unread badge count
      setNotifications([...unread, ...read]);
      setUnreadCount(unread.length);
      setLoading(false); // 🎉 Done loading
    });

    // 🧹 Cleanup: remove listener when component unmounts or userId changes
    return () => stop && stop();
  }, [userId, requestNotifications, onNotificationsList]);

  // ============================================================
  // 2️⃣ REAL-TIME PUSH HANDLER: New notification arrives!
  // ------------------------------------------------------------
  // - Listens for single new notifications (pushed by server in real-time).
  // - Prepends to array, avoids duplicates, keeps sorting.
  // ============================================================
  useEffect(() => {
    if (!userId) return;
    const stopPush = onNotificationReceived((newNotif) => {
      setNotifications((prev) => {
        // 🔎 If already in array (duplicate), skip!
        if (prev.some((n) => n.notification_id === newNotif.notification_id)) return prev;

        // ➕ Add to start, re-sort all (unread first, newest first)
        const merged = [newNotif, ...prev];
        const unread = merged
          .filter((n) => n && !n.is_read)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const read = merged
          .filter((n) => n && n.is_read)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setUnreadCount(unread.length); // 🛎️ Update badge
        return [...unread, ...read];
      });
    });
    // 🧹 Cleanup listener
    return () => stopPush && stopPush();
  }, [userId, onNotificationReceived]);

  // ============================================================
  // 3️⃣ MARK-AS-READ: User opens or reads a notification
  // ------------------------------------------------------------
  // - Optimistically updates local state instantly.
  // - Sends mark-as-read event to server (socket).
  // ============================================================
  const markAsRead = useCallback(
    (notification_id) => {
      if (!notification_id) return;
      markNotificationRead(notification_id); // 🚀 Tell server
      setNotifications((prev) =>
        prev.map((n) => (n.notification_id === notification_id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1)); // 🛎️ Lower badge count
    },
    [markNotificationRead]
  );

  // ============================================================
  // 4️⃣ MANUAL REFRESH: User clicks "Refresh Notifications"
  // ------------------------------------------------------------
  // - Triggers fetch as if mounting for first time (re-runs server emit).
  // ============================================================
  const refreshNotifications = useCallback(() => {
    if (!userId) return;
    setLoading(true); // 🚦 Show loading
    requestNotifications(userId); // 🔁 Server will send fresh list
  }, [userId, requestNotifications]);

  // 🗑️ Delete single notification (by id)
  const removeNotification = useCallback(
    (notification_id) => {
      if (!userId || !notification_id) return;
      deleteNotification(notification_id, userId);
    },
    [deleteNotification, userId]
  );

  // 🔥 Clear all notifications for user
  const clearAllNotifications = useCallback(() => {
    if (!userId) return;
    clearNotifications(userId);
  }, [clearNotifications, userId]);

  // ============================================================
  // 5️⃣ HELPERS: Preview/drawer slicing for UI display
  // ------------------------------------------------------------
  // - getPreview(count): get top n notifications for "preview"
  // - getDrawerSlice(start, end): paginated slices for drawer or page
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
  // 6️⃣ RESORT: Re-sort notifications (e.g., after collapsing a read)
  // ------------------------------------------------------------
  // - Can be called by UI after marking as read/collapsing to keep order
  // ============================================================
  const resortNotifications = useCallback(() => {
    setNotifications((prev) => {
      const unread = (prev || [])
        .filter((n) => n && !n.is_read)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const read = (prev || [])
        .filter((n) => n && n.is_read)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return [...unread, ...read];
    });
  }, []);

  useEffect(() => {
    const stop = onNotificationsError((error) => {
      // 🛑 Handle error: show toast, modal, or console
      console.error('Notification error:', error?.message || error);
      // Or update state for UI!
    });
    return () => stop && stop();
  }, [onNotificationsError]);
  // ============================================================
  // ✅ EXPORT: Return all helpers for NotificationCenter, badges, etc.
  // ------------------------------------------------------------
  // - notifications: full sorted array
  // - unreadCount: for badges
  // - loading: for spinners
  // - markAsRead: call when user opens a notification
  // - refreshNotifications: manual refresh
  // - getPreview/getDrawerSlice: UI slicing
  // - resortNotifications: re-sort on demand
  // ============================================================
  return {
    notifications, // 📦 All notifications, sorted (unread first)
    unreadCount, // 🛎️ Badge: how many unread
    loading, // ⏳ Loading spinner state
    markAsRead, // ✅ Mark as read function (optimistic)
    refreshNotifications, // 🔁 Manual refresh
    removeNotification, // 🗑️ For single
    clearAllNotifications, // 🔥 For all
    getPreview, // 🔍 Preview top n notifications
    getDrawerSlice, // 📄 Drawer/page slicing
    resortNotifications // 🔀 Re-sort helper
  };
}
