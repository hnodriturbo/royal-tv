/**
 * 📦 useSocketHub.js  – central wrapper around useSocket()
 * Handles live‑chat *and* bubble‑chat events.
 */

import { useCallback } from 'react';
import useSocket from '@/hooks/socket/useSocket';

const useSocketHub = () => {
  // core low‑level helpers
  const { socket, emit, listen } = useSocket();

  /* ─────────── LIVE CHAT (dashboard/user conversations) ───────── */

  const sendMessage = useCallback(
    (conversation_id, message) =>
      message?.trim() && emit('send_message', { conversation_id, message }),
    [emit],
  );

  const editMessage = useCallback(
    (conversation_id, message_id, message) =>
      message?.trim() &&
      emit('edit_message', { conversation_id, message_id, message }),
    [emit],
  );

  const deleteMessage = useCallback(
    (conversation_id, message_id) =>
      emit('delete_message', { conversation_id, message_id }),
    [emit],
  );

  const subscribeReceiveMessage = useCallback(
    (handler) => listen('receive_message', handler),
    [listen],
  );

  const joinRoom = useCallback(
    (conversation_id) => conversation_id && emit('join_room', conversation_id),
    [emit],
  );

  const markRead = useCallback(
    (conversation_id) => emit('mark_read', { conversation_id }),
    [emit],
  );

  /* ───────────── BUBBLE CHAT (public support widget) ──────────── */

  const sendBubbleMessage = useCallback(
    (conversation_id, message) =>
      message?.trim() &&
      emit('send_bubble_message', { conversation_id, message }),
    [emit],
  );

  const subscribeReceiveBubble = useCallback(
    (handler) => listen('receive_bubble_message', handler),
    [listen],
  );

  const joinBubbleRoom = useCallback(
    (conversation_id) =>
      conversation_id && emit('join_bubble_room', conversation_id),
    [emit],
  );

  /* ───────── room / typing / unread / misc shared helpers ─────── */

  const onRoomUsersUpdate = useCallback(
    (handler) => listen('room_users_update', handler),
    [listen],
  );

  const sendTypingStatus = useCallback(
    (conversation_id, isTyping = true) =>
      emit('typing', { conversation_id, isTyping }),
    [emit],
  );

  const onTyping = useCallback(
    (handler) => listen('user_typing', handler),
    [listen],
  );

  const onUserUnreadCount = useCallback(
    (handler) =>
      listen('unread_count', ({ unreadCount }) => handler(unreadCount)),
    [listen],
  );

  const onAdminUnreadCount = useCallback(
    (handler) => listen('admin_unread_count', handler),
    [listen],
  );

  /* ───────── online users / free‑trials / subs (unchanged) ─────── */

  const requestOnlineUsers = useCallback(
    () => emit('request_online_users'),
    [emit],
  );
  const onOnlineUsersUpdate = useCallback(
    (h) => listen('online_users_update', h),
    [listen],
  );

  const requestFreeTrials = useCallback(
    () => emit('fetch_free_trials'),
    [emit],
  );
  const onFreeTrialUpdate = useCallback(
    (h) => listen('freeTrials_update', h),
    [listen],
  );

  const requestSubscriptions = useCallback(
    () => emit('fetch_subscriptions'),
    [emit],
  );
  const onSubscriptionsUpdate = useCallback(
    (h) => listen('subscriptions_update', h),
    [listen],
  );

  /* ───────── export everything neatly ─────────────────────────── */

  return {
    socket,
    emit,
    listen,

    // live chat
    sendMessage,
    editMessage,
    deleteMessage,
    subscribeReceiveMessage,
    joinRoom,
    markRead,

    // bubble chat
    sendBubbleMessage,
    subscribeReceiveBubble,
    joinBubbleRoom,

    // room helpers
    onRoomUsersUpdate,
    sendTypingStatus,
    onTyping,
    onUserUnreadCount,
    onAdminUnreadCount,

    // misc data
    requestOnlineUsers,
    onOnlineUsersUpdate,
    requestFreeTrials,
    onFreeTrialUpdate,
    requestSubscriptions,
    onSubscriptionsUpdate,
  };
};

export default useSocketHub;
