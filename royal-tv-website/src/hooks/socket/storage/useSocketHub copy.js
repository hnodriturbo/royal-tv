/**
 *   ========================= useSocketHub.js =========================
 * 📡
 * UNIFIED SOCKET HOOK FOR ROYAL TV:
 * Centralizes all socket actions/events for liveChat & bubbleChat features.
 * - Handles joining/leaving rooms, sending/editing/deleting messages, typing indicators.
 * - Tracks online users, unread counts, admin badges, free trials, subscriptions, etc.
 * - Provides all socket logic and event handlers as reusable methods for chat UIs.
 * =====================================================================
 */

import { useCallback } from 'react';
import useSocket from '@/hooks/socket/useSocket';

const useSocketHub = () => {
  const { socket, emit, listen, socketConnected } = useSocket();

  // 1️⃣ Room/Conversation
  const joinRoom = useCallback(
    (chatType, conversation_id) => {
      console.log('📡 [useSocketHub] joinRoom:', { chatType, conversation_id });
      emit('join_room', { chatType, conversation_id });
    },
    [emit]
  );
  const leaveRoom = useCallback(
    (chatType, conversation_id) => {
      console.log('📡 [useSocketHub] leaveRoom:', { chatType, conversation_id });
      emit('leave_room', { chatType, conversation_id });
    },
    [emit]
  );
  const onRoomUsersUpdate = useCallback(
    (handler) => {
      console.log('📡 [useSocketHub] Listening: room_users_update');
      return listen('room_users_update', (...args) => {
        console.log('📡 [useSocketHub] room_users_update triggered:', ...args);
        handler(...args);
      });
    },
    [listen]
  );

  // 2️⃣ Message Events
  const sendMessage = useCallback(
    (chatType, conversation_id, message) => {
      console.log('💬 [useSocketHub] sendMessage:', { chatType, conversation_id, message });
      emit('send_message', { chatType, conversation_id, message: message.trim() });
    },
    [emit]
  );

  // Edit message
  const editMessage = useCallback(
    (chatType, conversation_id, message_id, message) => {
      console.log('✏️ [useSocketHub] editMessage:', {
        chatType,
        conversation_id,
        message_id,
        message
      });
      emit('edit_message', { chatType, conversation_id, message_id, message });
    },
    [emit]
  );

  // Delete Message
  const deleteMessage = useCallback(
    (chatType, conversation_id, message_id) => {
      console.log('🗑️ [useSocketHub] deleteMessage:', { chatType, conversation_id, message_id });
      emit('delete_message', { chatType, conversation_id, message_id });
    },
    [emit]
  );

  const receiveMessage = useCallback(
    (handler) => {
      console.log('💬 [useSocketHub] Listening: receive_message');
      return listen('receive_message', (...args) => {
        console.log('💬 [useSocketHub] receive_message triggered:', ...args);
        handler(...args);
      });
    },
    [listen]
  );

  const refreshMessages = useCallback(
    (chatType, conversation_id) => {
      console.log('✅ [useSocketHub] refreshMessages:', { chatType, conversation_id });
      emit('refresh_messages', { chatType, conversation_id });
    },
    [emit]
  );

  const onMessagesRefreshed = useCallback(
    (handler) =>
      listen('messages_refreshed', (payload) => {
        console.log('✅ [useSocketHub] onMessagesRefreshed:', { payload });
        handler(payload); // payload: { chatType, conversation_id, messages }
      }),
    [listen]
  );
  // 4️⃣ Mark messages as read
  const markRead = useCallback(
    (chatType, conversation_id) => {
      console.log('✅ [useSocketHub] markRead:', { chatType, conversation_id });
      emit('mark_read', { chatType, conversation_id });
    },
    [emit]
  );

  // 5️⃣ Send typing status to the server
  const sendTypingStatus = useCallback(
    (conversation_id, isTyping = true) => {
      emit('typing', { conversation_id, isTyping });
    },
    [emit]
  );

  // Listen for typing events from the server
  const onTyping = useCallback(
    (handler) => {
      return listen('user_typing', handler); // Handler receives { conversation_id, isTyping, name, user_id, role }
    },
    [listen]
  );

  // 6️⃣ Unread counts and badges
  const onUserUnreadCount = useCallback(
    (handler) => {
      console.log('🔵 [useSocketHub] Listening: user_unread_count');
      return listen('user_unread_count', (...args) => {
        console.log('🔵 [useSocketHub] user_unread_count triggered:', ...args);
        handler(...args);
      });
    },
    [listen]
  );
  const onAdminUnreadCount = useCallback(
    (handler) => {
      console.log('🔴 [useSocketHub] Listening: admin_unread_count');
      return listen('admin_unread_count', (...args) => {
        console.log('🔴 [useSocketHub] admin_unread_count triggered:', ...args);
        handler(...args);
      });
    },
    [listen]
  );
  const onUserUnreadBadge = useCallback(
    (handler) => {
      console.log('🟣 [useSocketHub] Listening: user_unread_badge');
      return listen('user_unread_badge', (...args) => {
        console.log('🟣 [useSocketHub] user_unread_badge triggered:', ...args);
        handler(...args);
      });
    },
    [listen]
  );

  // 7️⃣ Online users
  const requestOnlineUsers = useCallback(() => {
    console.log('🌍 [useSocketHub] requestOnlineUsers');
    emit('request_online_users');
  }, [emit]);

  const onOnlineUsersUpdate = useCallback(
    (handler) => {
      console.log('🟩 [useSocketHub] Listening: online_users_update');
      return listen('online_users_update', (...args) => {
        console.log('🟩 [useSocketHub] online_users_update triggered:', ...args);
        handler(...args);
      });
    },
    [listen]
  );

  // 8️⃣ Account events (admin badges, trials, subs)
  const requestAccountBadges = useCallback(() => {
    console.log('🏵️ [useSocketHub] requestAccountBadges');
    emit('fetch_account_badges');
  }, [emit]);

  const onAccountBadgesUpdate = useCallback(
    (handler) => {
      console.log('🏅 [useSocketHub] Listening: account_badges_update');
      return listen('account_badges_update', (...args) => {
        console.log('🏅 [useSocketHub] account_badges_update triggered:', ...args);
        handler(...args);
      });
    },
    [listen]
  );

  // 9️⃣ Free Trials events
  const requestFreeTrials = useCallback(() => {
    console.log('🎟️ [useSocketHub] requestFreeTrials');
    emit('fetch_free_trials');
  }, [emit]);

  const onFreeTrialUpdate = useCallback(
    (handler) => {
      console.log('🎟️ [useSocketHub] Listening: freeTrials_update');
      return listen('freeTrials_update', (...args) => {
        console.log('🎟️ [useSocketHub] freeTrials_update triggered:', ...args);
        handler(...args);
      });
    },
    [listen]
  );

  // 🔟 Subscriptions events
  const requestSubscriptions = useCallback(() => {
    console.log('🗃️ [useSocketHub] requestSubscriptions');
    emit('fetch_subscriptions');
  }, [emit]);

  const onSubscriptionsUpdate = useCallback(
    (handler) => {
      console.log('🗃️ [useSocketHub] Listening: subscriptions_update');
      return listen('subscriptions_update', (...args) => {
        console.log('🗃️ [useSocketHub] subscriptions_update triggered:', ...args);
        handler(...args);
      });
    },
    [listen]
  );

  // 🔟a) Admin: Pending (free trials and subs)
  const requestPendingFreeTrials = useCallback(() => {
    console.log('⏳ [useSocketHub] requestPendingFreeTrials');
    emit('fetch_pending_free_trials');
  }, [emit]);

  const onPendingFreeTrialsUpdate = useCallback(
    (handler) => {
      console.log('⏳ [useSocketHub] Listening: pending_freeTrials_update');
      return listen('pending_freeTrials_update', (...args) => {
        console.log('⏳ [useSocketHub] pending_freeTrials_update triggered:', ...args);
        handler(...args);
      });
    },
    [listen]
  );

  const requestPendingSubscriptions = useCallback(() => {
    console.log('⏳ [useSocketHub] requestPendingSubscriptions');
    emit('fetch_pending_subscriptions');
  }, [emit]);

  const onPendingSubscriptionsUpdate = useCallback(
    (handler) => {
      console.log('⏳ [useSocketHub] Listening: pending_subscriptions_update');
      return listen('pending_subscriptions_update', (...args) => {
        console.log('⏳ [useSocketHub] pending_subscriptions_update triggered:', ...args);
        handler(...args);
      });
    },
    [listen]
  );

  // ===================== NOTIFICATIONS (Admin + User) =====================

  // Emit a request to fetch notifications for current user
  const requestNotifications = useCallback(
    (user_id) => {
      if (!user_id) return;
      console.log('🔔 [useSocketHub] requestNotifications', { user_id });
      emit('fetch_notifications', { user_id });
    },
    [emit]
  );
  // ==========================================================
  // 🟦 LISTEN FOR NOTIFICATIONS_LIST EVENT (FRONTEND SOCKET HUB)
  // - Handles notifications_list payloads from server and passes to hooks.
  // ==========================================================
  const onNotificationsUpdate = useCallback(
    (handler) => {
      // 🟠 [LOG] Set up listener for notifications_list event from server
      console.log('🟠 [SOCKET HUB] Listening: notifications_list');
      return listen('notifications_list', (payload) => {
        // 🟣 [LOG] Received notifications_list event payload
        console.log('🟣 [SOCKET HUB] Received notifications_list:', payload);
        handler(payload);
      });
    },
    [listen]
  );

  // Mark a notification as read (only needs notification_id)
  const markNotificationRead = useCallback(
    (notification_id) => {
      if (!notification_id) return;
      console.log('✅ [useSocketHub] markNotificationRead:', { notification_id });
      emit('mark_notification_read', { notification_id });
    },
    [emit]
  );

  // 3️⃣ Listen for single notification push from backend (realtime trigger)
  const onNotificationReceived = useCallback(
    (handler) => {
      console.log('🟢 [useSocketHub] Listening: notification_received');
      return listen('notification_received', (...args) => {
        console.log('🟢 [useSocketHub] notification_received triggered:', ...args);
        handler(...args);
      });
    },
    [listen]
  );

  return {
    // 🎛️ Core socket functions
    socket, // 🛠️ Used for direct socket access
    emit, // 📤 Used to send custom events
    listen, // 👂 Used to listen for custom events
    socketConnected, // 🟢 NotificationCenter (or any consumer) can use this!

    // 🏠 Room events
    joinRoom, // 🚪 Join chat room
    leaveRoom, // 🚶 Leave chat room
    onRoomUsersUpdate, // 🧑‍🤝‍🧑 Listen for users in room

    // 💬 Message events
    sendMessage, // ✉️ Send message
    editMessage, // ✏️ Edit message
    deleteMessage, // 🗑️ Delete message
    receiveMessage, // 📥 Receive new message

    // 🗂️ Conversation events
    refreshMessages, // emits the refresh request
    onMessagesRefreshed, // listens for the refreshed messages from backend

    // 👁️ Read/unread events
    markRead, // ✅ Mark conversation/messages as read
    onUserUnreadCount, // 🔵 Listen for user's unread count
    onAdminUnreadCount, // 🔴 Listen for admin's unread count
    onUserUnreadBadge, // 🟣 Listen for unread badge

    // 📝 Typing events
    sendTypingStatus, // ⌨️ Send typing status
    onTyping, // 🟠 Listen for typing indicator

    // 🌐 Online users
    requestOnlineUsers, // 🌍 Request list of online users
    onOnlineUsersUpdate, // 🟩 Listen for online users update

    // 🏅 Account/admin events
    requestAccountBadges, // 🏵️ Request admin/user badge data
    onAccountBadgesUpdate, // 🏅 Listen for badge updates

    // 🎁 Free Trials
    requestFreeTrials, // 🎟️ Request free trial info
    onFreeTrialUpdate, // 🎟️ Listen for free trial updates

    // 📝 Subscriptions
    requestSubscriptions, // 🗃️ Request subscription info
    onSubscriptionsUpdate, // 🗃️ Listen for subscription updates

    // ⏳ Pending
    requestPendingFreeTrials, // ⏳ Request pending free trials
    onPendingFreeTrialsUpdate, // ⏳ Listen for pending free trials update

    requestPendingSubscriptions, // ⏳ Request pending subscriptions
    onPendingSubscriptionsUpdate, // ⏳ Listen for pending subscriptions update

    // 🛎️ Notifications
    requestNotifications, // 📌 Request All Notifications - fetch_notifications
    onNotificationsUpdate, // 📌 On Notification Update - notifications_list
    markNotificationRead, // 📌 Mark notification as read - mark_notification_read
    onNotificationReceived // 📌 Notification Received - notification_received
  };
};

export default useSocketHub;
