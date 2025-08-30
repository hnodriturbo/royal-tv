/**
 *   ========================= useSocketHub.js =========================
 * 📡
 * UNIFIED SOCKET HOOK FOR ROYAL TV:
 * - Centralizes all socket actions/events for liveChat and notifications.
 * - Guards all emits/listens so nothing is lost before connection.
 * =====================================================================
 */

import logger from '@/lib/core/logger';
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
      if (!socket || !socketConnected) {
        // 🛑 Not connected or socket not defined: queue emit and warn
        logger.warn(`⚠️ [SOCKET HUB] Emit "${event}" queued (waiting for connection)`, payload);
        emitQueueRef.current.push({ event, payload });
        return;
      }
      emit(event, payload);
    },
    [emit, socket, socketConnected]
  );
  // 2️⃣ Guarded Listen: queue if not connected
  const guardedListen = useCallback(
    (event, handler) => {
      if (!socket || !socketConnected) {
        // 🛑 Not connected or socket not defined: queue listen and warn
        logger.warn(`⚠️ [SOCKET HUB] Listen "${event}" queued (waiting for connection)`);
        listenQueueRef.current.push({ event, handler });
        return () => {};
      }
      return listen(event, handler);
    },
    [listen, socket, socketConnected]
  );

  // 3️⃣ On connection: flush all queued emits/listens
  useEffect(() => {
    if (!socketConnected) return;
    // Flush emits
    emitQueueRef.current.forEach(({ event, payload }) => {
      emit(event, payload);
      logger.info(`✅ [SOCKET HUB] Queued emit "${event}" sent after connect.`, payload);
    });
    emitQueueRef.current = [];
    // Flush listens (register all now)
    listenQueueRef.current.forEach(({ event, handler }) => {
      listen(event, handler);
      logger.info(`✅ [SOCKET HUB] Queued listen "${event}" registered after connect.`);
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

  // ========== Notifications ==========

  const requestNotifications = useCallback(
    (user_id) => guardedEmit('fetch_notifications', { user_id }),
    [guardedEmit]
  );

  const onNotificationsList = useCallback(
    (handler) => guardedListen('notifications_list', handler), // 📨 full list payload
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

  // Refresh Notifications
  const refreshNotifications = useCallback(
    (user_id) => guardedEmit('fetch_notifications', { user_id }), // 🌍 server replies with `notifications_list`
    [guardedEmit]
  );

  // 🔁 server asks client to refetch authoritative list now
  const onNotificationsListRefresh = useCallback(
    (handler) => {
      // 📥 server: io.to(user).emit('notifications_list_refresh', { user_id })
      return guardedListen('notifications_list_refresh', handler);
    },
    [guardedListen]
  );

  // ✅ Receive Notifications
  const onNotificationReceived = useCallback(
    (handler) => guardedListen('notification_received', handler),
    [guardedListen]
  );

  // ✅ Create Notifications for both or single user or single admin
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

  // 🗑️ Delete one notification
  const deleteNotification = useCallback(
    (notification_id, user_id) => guardedEmit('delete_notification', { notification_id, user_id }),
    [guardedEmit]
  );

  // 🔥 Danger zone: clear all notifications
  const clearNotifications = useCallback(
    (user_id) => guardedEmit('clear_notifications', { user_id }),
    [guardedEmit]
  );

  // ❗ Listen for notification errors
  const onNotificationsError = useCallback(
    (handler) => guardedListen('notifications_error', handler),
    [guardedListen]
  );

  // 💸 Listen for finished payment notification for current user
  const onTransactionFinished = useCallback(
    (handler) => guardedListen('transactionFinished', handler),
    [guardedListen]
  );
  // =================== SUBSCRIPTIONS & PAYMENTS ===================

  // 📋 Fetch all subscriptions for the current user (returns all user subscriptions)
  const fetchSubscriptions = useCallback(() => guardedEmit('fetch_subscriptions'), [guardedEmit]);
  // 📋 Listen for list of subscriptions
  const onSubscriptionsList = useCallback(
    (handler) => guardedListen('subscriptions_list', handler),
    [guardedListen]
  );

  // 📊 Fetch the status of a specific subscription by ID
  const fetchSubscriptionStatus = useCallback(
    (subscription_id) => guardedEmit('fetch_subscription_status', { subscription_id }),
    [guardedEmit]
  );
  // 📊 Listen for status of a specific subscription
  const onSubscriptionStatus = useCallback(
    (handler) => guardedListen('subscription_status', handler),
    [guardedListen]
  );

  // 💸 Fetch a payment record by order_id
  const fetchSubscriptionPayment = useCallback(
    (order_id) => guardedEmit('fetch_subscription_payment', { order_id }),
    [guardedEmit]
  );
  // 💸 Listen for payment record result
  const onSubscriptionPayment = useCallback(
    (handler) => guardedListen('subscription_payment', handler),
    [guardedListen]
  );

  // 💵 Fetch only payment status by order_id
  const fetchSubscriptionPaymentStatus = useCallback(
    (order_id) => guardedEmit('fetch_subscription_payment_status', { order_id }),
    [guardedEmit]
  );
  // 💵 Listen for just the payment status
  const onSubscriptionPaymentStatus = useCallback(
    (handler) => guardedListen('subscription_payment_status', handler),
    [guardedListen]
  );

  // 🆕 Listen for backend emit: subscription_created (real-time event after a new subscription is added)
  const onSubscriptionCreated = useCallback(
    (handler) => guardedListen('subscription_created', handler),
    [guardedListen]
  );

  // 🔄 Listen for backend emit: payment_status_updated (real-time event after payment updates)
  const onPaymentStatusUpdated = useCallback(
    (handler) => guardedListen('payment_status_updated', handler),
    [guardedListen]
  );

  // ============ 🎟️ Free Trials (already included, but for reference) ===========================

  // 🧪 Request user's current free trial status
  const requestFreeTrialStatus = useCallback(
    () => guardedEmit('fetch_free_trial_status'),
    [guardedEmit]
  );
  // 🧪 Listen for free trial status updates
  const onFreeTrialStatus = useCallback(
    (handler) => guardedListen('free_trial_status', handler),
    [guardedListen]
  );

  // 📦 Request user's full free trial object
  const fetchFullFreeTrial = useCallback(() => guardedEmit('fetch_full_free_trial'), [guardedEmit]);
  // 📦 Listen for full free trial object
  const onFullFreeTrial = useCallback(
    (handler) => guardedListen('full_free_trial', handler),
    [guardedListen]
  );

  // ✉️ Admin notifies user of trial status change
  const freeTrialStatusUpdate = useCallback(
    (user_id) => guardedEmit('free_trial_status_update', { user_id }),
    [guardedEmit]
  );
  const onFreeTrialStatusUpdate = useCallback(
    (handler) => guardedListen('free_trial_status_update', handler),
    [guardedListen]
  );

  const logPageVisit = useCallback(
    ({ page, event = 'page_visit', description }) => {
      guardedEmit('log_page_visit', { page, event, description });
    },
    [guardedEmit]
  );

  // 🌍 Tell server to update the current locale (queues if not connected)
  const setLocale = useCallback(
    (localeCode) => {
      // 🧼 normalize to 'en' | 'is'
      const normalized =
        typeof localeCode === 'string' && localeCode.toLowerCase().startsWith('is') ? 'is' : 'en';

      // 🛰️ safe emit through the hub
      guardedEmit('set_locale', { locale: normalized });
    },
    [guardedEmit]
  );

  // 🔔 Listen for server ack when locale changes
  const onLocaleChanged = useCallback(
    (handlerFunction) => {
      // 🧯 ignore non-functions
      if (typeof handlerFunction !== 'function') return () => {};
      // 🪝 return unsubscriber from guardedListen
      return guardedListen('locale_changed', handlerFunction);
    },
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

    // 🛎️ Notifications
    requestNotifications,
    onNotificationsList,

    requestNotificationsCount,
    onNotificationsCount,

    markNotificationRead,
    onNotificationMarkedRead,

    refreshNotifications,
    onNotificationsListRefresh,

    onNotificationReceived,

    createNotificationForBoth,
    createNotificationForAdmin,
    createNotificationForUser,

    deleteNotification,
    clearNotifications,

    onNotificationsError,

    onTransactionFinished,

    // Subscriptions & Payments
    fetchSubscriptions,
    onSubscriptionsList,
    fetchSubscriptionStatus,
    onSubscriptionStatus,
    fetchSubscriptionPayment,
    onSubscriptionPayment,
    fetchSubscriptionPaymentStatus,
    onSubscriptionPaymentStatus,
    onSubscriptionCreated,
    onPaymentStatusUpdated,

    // 🎟️ Free Trials
    requestFreeTrialStatus,
    onFreeTrialStatus,
    fetchFullFreeTrial,
    onFullFreeTrial,
    freeTrialStatusUpdate,
    onFreeTrialStatusUpdate,

    // 🔗 Miscellaneous
    logPageVisit,

    // 🌍 Locale setLocale emit and onLocaleChanged Listen
    setLocale,
    onLocaleChanged
  };
};

export default useSocketHub;
