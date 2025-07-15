/**
 *   ========================= useSocketHub.js =========================
 * 📡
 * UNIFIED SOCKET HOOK FOR ROYAL TV:
 * - Centralizes all socket actions/events for liveChat and notifications.
 * - Guards all emits/listens so nothing is lost before connection.
 * =====================================================================
 */

import { useCallback, useRef, useEffect } from 'react';
import useSocket from '@/hooks/socket/useSocket';

const useSocketHub = () => {
  // 🎛️ Get socket core, status, and handlers
  const { socket, emit, listen, socketConnected } = useSocket();

  // ===================== EMIT/LISTEN QUEUES =====================
  const emitQueueRef = useRef([]);
  const listenQueueRef = useRef([]);

  // 1️⃣ Guarded Emit: queue if not connected
  const guardedEmit = useCallback(
    (event, payload) => {
      if (!socketConnected) {
        // 🛑 Not connected: queue emit and warn
        console.warn(`⚠️ [SOCKET HUB] Emit "${event}" queued (waiting for connection)`, payload);
        emitQueueRef.current.push({ event, payload });
        return;
      }
      emit(event, payload);
    },
    [emit, socketConnected]
  );

  // 2️⃣ Guarded Listen: queue if not connected
  const guardedListen = useCallback(
    (event, handler) => {
      if (!socketConnected) {
        // 🛑 Not connected: queue listen and warn
        console.warn(`⚠️ [SOCKET HUB] Listen "${event}" queued (waiting for connection)`);
        listenQueueRef.current.push({ event, handler });
        // Return a cleanup that does nothing
        return () => {};
      }
      return listen(event, handler);
    },
    [listen, socketConnected]
  );

  // 3️⃣ On connection: flush all queued emits/listens
  useEffect(() => {
    if (!socketConnected) return;
    // Flush emits
    emitQueueRef.current.forEach(({ event, payload }) => {
      emit(event, payload);
      console.info(`✅ [SOCKET HUB] Queued emit "${event}" sent after connect.`, payload);
    });
    emitQueueRef.current = [];
    // Flush listens (register all now)
    listenQueueRef.current.forEach(({ event, handler }) => {
      listen(event, handler);
      console.info(`✅ [SOCKET HUB] Queued listen "${event}" registered after connect.`);
    });
    listenQueueRef.current = [];
  }, [socketConnected, emit, listen]);

  // =============== ROOM / CONVERSATION EVENTS ===============
  const joinRoom = useCallback(
    (conversation_id) => guardedEmit('join_room', { conversation_id }),
    [guardedEmit]
  );
  const leaveRoom = useCallback(
    (conversation_id) => guardedEmit('leave_room', { conversation_id }),
    [guardedEmit]
  );
  const onRoomUsersUpdate = useCallback(
    (handler) => guardedListen('room_users_update', handler),
    [guardedListen]
  );
  // =============== MESSAGE EVENTS ===============
  const sendMessage = useCallback(
    (conversation_id, message) =>
      guardedEmit('send_message', { conversation_id, message: message.trim() }),
    [guardedEmit]
  );

  const editMessage = useCallback(
    (conversation_id, message_id, message) =>
      guardedEmit('edit_message', { conversation_id, message_id, message }),
    [guardedEmit]
  );

  const deleteMessage = useCallback(
    (conversation_id, message_id) =>
      // 🌪️ Ask server to delete this message for all users in this chat
      guardedEmit('delete_message', { conversation_id, message_id }),
    [guardedEmit]
  );

  const receiveMessage = useCallback(
    (handler) => guardedListen('receive_message', handler),
    [guardedListen]
  );

  const refreshMessages = useCallback(
    (conversation_id) => guardedEmit('refresh_messages', { conversation_id }),
    [guardedEmit]
  );

  const onMessagesRefreshed = useCallback(
    (handler) => guardedListen('messages_refreshed', handler),
    [guardedListen]
  );

  const markRead = useCallback(
    (conversation_id) => guardedEmit('mark_read', { conversation_id }),
    [guardedEmit]
  );

  // =============== TYPING EVENTS ===============
  const sendTypingStatus = useCallback(
    (conversation_id, isTyping = true) => guardedEmit('typing', { conversation_id, isTyping }),
    [guardedEmit]
  );
  const onTyping = useCallback((handler) => guardedListen('user_typing', handler), [guardedListen]);

  // =============== UNREAD COUNTS / BADGES ===============
  const onUserUnreadCount = useCallback(
    (handler) => guardedListen('user_unread_count', handler),
    [guardedListen]
  );
  const onAdminUnreadCount = useCallback(
    (handler) => guardedListen('admin_unread_count', handler),
    [guardedListen]
  );
  const onUserUnreadBadge = useCallback(
    (handler) => guardedListen('user_unread_badge', handler),
    [guardedListen]
  );

  // =============== ONLINE USERS ===============
  const requestOnlineUsers = useCallback(() => guardedEmit('request_online_users'), [guardedEmit]);
  const onOnlineUsersUpdate = useCallback(
    (handler) => guardedListen('online_users_update', handler),
    [guardedListen]
  );

  // ============ 🎟️ Free Trials ===========================

  const requestFreeTrialStatus = useCallback(
    () => guardedEmit('fetch_free_trial_status'),
    [guardedEmit]
  );
  const onFreeTrialStatus = useCallback(
    (handler) => guardedListen('free_trial_status', handler),
    [guardedListen]
  );
  const freeTrialStatusUpdate = useCallback(
    (user_id) => guardedEmit('free_trial_status_update', { user_id }),
    [guardedEmit]
  );
  const onFreeTrialStatusUpdate = useCallback(
    (handler) => guardedListen('free_trial_status_update', handler),
    [guardedListen]
  );

  // ========== Notifications ==========

  const requestNotifications = useCallback(
    (user_id) => guardedEmit('fetch_notifications', { user_id }),
    [guardedEmit]
  );
  const onNotificationsUpdate = useCallback(
    (handler) => guardedListen('notifications_list', handler),
    [guardedListen]
  );
  const requestNotificationsCount = useCallback(
    (user_id) => guardedEmit('count_notifications', { user_id }),
    [guardedEmit]
  );
  const onNotificationsCount = useCallback(
    (handler) => guardedListen('notifications_count', handler),
    [guardedListen]
  );
  const markNotificationRead = useCallback(
    (notification_id) => guardedEmit('mark_notification_read', { notification_id }),
    [guardedEmit]
  );
  const onNotificationMarkedRead = useCallback(
    (handler) => guardedListen('notification_marked_read', handler),
    [guardedListen]
  );
  const refreshNotifications = useCallback(
    (user_id) => guardedEmit('refresh_notifications', { user_id }),
    [guardedEmit]
  );
  const onNotificationReceived = useCallback(
    (handler) => guardedListen('notification_received', handler),
    [guardedListen]
  );
  const createNotificationForBoth = useCallback(
    (type, event, user, data) =>
      guardedEmit('create_notification_for_both', { type, event, user, data }),
    [guardedEmit]
  );
  const createNotificationForAdmin = useCallback(
    (type, event, user, data) =>
      guardedEmit('create_notification_for_admin', { type, event, user, data }),
    [guardedEmit]
  );
  const createNotificationForUser = useCallback(
    (type, event, user, data) =>
      guardedEmit('create_notification_for_user', { type, event, user, data }),
    [guardedEmit]
  );

  // 💸 Listen for finished payment notification for current user
  const onTransactionFinished = useCallback(
    (handler) => guardedListen('transactionFinished', handler),
    [guardedListen]
  );

  // ======================= EXPORTS ========================
  return {
    socket,
    emit: guardedEmit,
    listen: guardedListen,
    socketConnected,

    // 🏠 Room events
    joinRoom,
    leaveRoom,
    onRoomUsersUpdate,

    // 💬 Message events
    sendMessage,
    editMessage,
    deleteMessage,
    receiveMessage,
    refreshMessages,
    onMessagesRefreshed,
    markRead,

    // 👁️ Read/unread events
    onUserUnreadCount,
    onAdminUnreadCount,
    onUserUnreadBadge,

    // 📝 Typing events
    sendTypingStatus,
    onTyping,

    // 🌐 Online users
    requestOnlineUsers,
    onOnlineUsersUpdate,

    // 🎟️ Free Trials
    requestFreeTrialStatus,
    onFreeTrialStatus,
    freeTrialStatusUpdate,
    onFreeTrialStatusUpdate,

    // 🛎️ Notifications
    requestNotifications,
    onNotificationsUpdate,
    requestNotificationsCount,
    onNotificationsCount,
    markNotificationRead,
    onNotificationMarkedRead,
    refreshNotifications,
    onNotificationReceived,

    createNotificationForBoth,
    createNotificationForAdmin,
    createNotificationForUser,

    onTransactionFinished
  };
};

export default useSocketHub;
