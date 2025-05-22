/**
 *   ========================= useSocketHub.js =========================
 * 📡
 * UNIFIED SOCKET HOOK:
 * Centralizes all socket actions/events for liveChat & bubbleChat features.
 * - Handles joining/leaving rooms, sending/editing/deleting messages, typing indicators.
 * - Tracks online users, unread counts, free trials, subscriptions, and more.
 * - Provides all socket logic and event handlers as reusable methods for chat UIs.
 * =====================================================================
 * ⚙️
 * PROPS / RETURNS:
 *   Returns an object with all major socket actions and listeners:
 *     - socket, emit, listen
 *     - joinRoom, leaveRoom, onRoomUsersUpdate
 *     - sendMessage, editMessage, deleteMessage, receiveMessage
 *     - sendTypingStatus, onTyping
 *     - markRead
 *     - onUserUnreadCount, onAdminUnreadCount
 *     - requestOnlineUsers, onOnlineUsersUpdate
 *     - requestFreeTrials, onFreeTrialUpdate
 *     - requestSubscriptions, onSubscriptionsUpdate
 * =====================================================================
 * 📌
 * USAGE:
 *   Import in any component or page needing chat/socket functionality:
 *     const {
 *       joinRoom, sendMessage, receiveMessage, ...etc
 *     } = useSocketHub();
 *   Provides a unified API for all socket operations in your app.
 * =====================================================================
 */

import { useCallback } from 'react';
import useSocket from '@/hooks/socket/useSocket';

const useSocketHub = () => {
  const { socket, emit, listen } = useSocket();

  // Unified join room
  const joinRoom = useCallback(
    (type, conversation_id) => {
      console.log(`🚪 [${type}] joinRoom:`, conversation_id);
      emit('join_room', { type, conversation_id });
    },
    [emit]
  );

  // Leave room
  const leaveRoom = useCallback(
    (type, conversation_id) => {
      console.log(`🚪 [${type}] leaveRoom:`, conversation_id);
      emit('leave_room', { type, conversation_id });
    },
    [emit]
  );

  // Room users update
  const onRoomUsersUpdate = useCallback(
    (handler) => {
      listen('room_users_update', handler);
    },
    [listen]
  );

  // Unified send message
  const sendMessage = useCallback(
    (type, conversation_id, message) => {
      emit('send_message', { type, conversation_id, message: message.trim() });
    },
    [emit]
  );

  // Unified edit message
  const editMessage = useCallback(
    (type, conversation_id, message_id, message) => {
      console.log('✏️ editMessage:', { type, conversation_id, message_id, message });
      emit('edit_message', { type, conversation_id, message_id, message: message.trim() });
    },
    [emit]
  );

  // Unified delete message
  const deleteMessage = useCallback(
    (type, conversation_id, message_id) => {
      console.log('🗑️ deleteMessage:', { type, conversation_id, message_id });
      emit('delete_message', { type, conversation_id, message_id });
    },
    [emit]
  );

  // Unified receive_message
  const receiveMessage = useCallback(
    (handler) => {
      listen('receive_message', handler);
    },
    [listen]
  );

  // Typing indicator
  const sendTypingStatus = useCallback(
    (conversation_id, isTyping = true) => {
      console.log('⌨️ sendTypingStatus:', { conversation_id, isTyping });
      emit('typing', { conversation_id, isTyping });
    },
    [emit]
  );

  // Typing
  const onTyping = useCallback(
    (handler) => {
      listen('user_typing', handler);
    },
    [listen]
  );

  // Mark read: can be for conversations or messages
  const markRead = useCallback(
    (type, id) => {
      console.log('📖 markRead:', { type, id });
      // If marking conversations: { type: 'conversation', id }
      // If marking messages:     { type: 'message', id }
      emit('mark_read', { type, id });
    },
    [emit]
  );

  // Unread counts
  const onUserUnreadCount = useCallback(
    (handler) => {
      listen('unread_count', handler);
    },
    [listen]
  );
  // ✅ Unread counts for admin
  const onAdminUnreadCount = useCallback(
    (handler) => {
      listen('admin_unread_count', handler);
    },
    [listen]
  );

  // Online users, free trials, subscriptions (unchanged)
  const requestOnlineUsers = useCallback(() => emit('request_online_users'), [emit]);
  const onOnlineUsersUpdate = useCallback(
    (handler) => listen('online_users_update', handler),
    [listen]
  );
  const requestFreeTrials = useCallback(() => emit('fetch_free_trials'), [emit]);
  const onFreeTrialUpdate = useCallback(
    (handler) => listen('freeTrials_update', handler),
    [listen]
  );
  const requestSubscriptions = useCallback(() => emit('fetch_subscriptions'), [emit]);
  const onSubscriptionsUpdate = useCallback(
    (handler) => listen('subscriptions_update', handler),
    [listen]
  );

  return {
    // ✅ Socket & emit & listen
    socket,
    emit,
    listen,

    // ✅ Room stuff
    joinRoom,
    leaveRoom,
    onRoomUsersUpdate,

    // ✅ Message stuff
    sendMessage,
    editMessage,
    deleteMessage,
    receiveMessage,
    sendTypingStatus,
    onTyping,
    markRead,

    // ✅ Unread Count
    onUserUnreadCount,
    onAdminUnreadCount,

    // ✅ Request Online Users Both number and list
    requestOnlineUsers,
    onOnlineUsersUpdate,

    // ✅ Request New Free Trials Number
    requestFreeTrials,
    onFreeTrialUpdate,
    // ✅ Request New Subscriptions Number
    requestSubscriptions,
    onSubscriptionsUpdate
  };
};

export default useSocketHub;
