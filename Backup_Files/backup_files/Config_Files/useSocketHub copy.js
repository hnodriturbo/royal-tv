// 📦 src/app/hooks/socket/useSocketHub.js
// A central hook exposing plain functions for all Socket.IO actions and subscriptions.
// 🎓 Learning Comments: Each section is annotated to explain what it does.

import useSocket from '@/hooks/socket/useSocket';

/**
 * useSocketHub
 * ------------
 * Consolidates all socket.io interactions into a single hook:
 * - Initial data fetching
 * - Chat messaging (live & bubble)
 * - Conversation lifecycle
 * - Room membership
 * - Read/unread tracking
 * - Online user status
 * - Typing indicators
 * - Free trial & subscription updates
 */
const useSocketHub = () => {
  // ────────────────────────────────────────────────────────────────
  // 1️⃣ Core socket access
  //    • socket: raw Socket.IO instance
  //    • emit:  send events to server
  //    • listen: subscribe to server events
  // ────────────────────────────────────────────────────────────────
  const { socket, emit, listen } = useSocket();

  // ────────────────────────────────────────────────────────────────
  // 2️⃣ Initial data helpers
  //    • requestInitialData: ask server to send all startup data
  //    • subscribeInitialData: listen for that batch of data
  // ────────────────────────────────────────────────────────────────
  const requestInitialData = (opts) => {
    console.log('[useSocketHub] requestInitialData', opts);
    emit('fetch_initial_data', opts);
  };
  const subscribeInitialData = (handler) =>
    listen('initial_data', (payload) => {
      console.log('[useSocketHub] initial_data received', payload);
      handler(payload);
    });

  // ────────────────────────────────────────────────────────────────
  // 3️⃣ Messaging helpers (live chat)
  //    • sendMessage:    emit new message to server
  //    • editMessage:    change existing message
  //    • deleteMessage:  mark message deleted
  //    • subscribeReceiveMessage: listen for new incoming messages
  // ────────────────────────────────────────────────────────────────
  const sendMessage = (conversation_id, message) => {
    if (!message?.trim()) return; // ignore empty text
    emit('send_message', { conversation_id, message });
  };

  const editMessage = (conversation_id, message_id, message) =>
    emit('edit_message', { conversation_id, message_id, message });

  const deleteMessage = (conversation_id, message_id) =>
    emit('delete_message', { conversation_id, message_id });

  const subscribeReceiveMessage = (handler) =>
    listen('receive_message', handler);

  // ────────────────────────────────────────────────────────────────
  // 4️⃣ Conversation lifecycle helpers
  //    • deleteConversation: remove a whole conversation
  //    • subscribeConversationDeleted: listen when a convo is deleted
  //    • subscribeRefreshLists: listen for list-refresh signals
  // ────────────────────────────────────────────────────────────────
  const deleteConversation = (conversation_id) =>
    emit('delete_conversation', { conversation_id });

  const subscribeConversationDeleted = (handler) =>
    listen('conversation_deleted', handler);

  const subscribeRefreshLists = (handler) =>
    listen('refresh_conversation_lists', handler);

  // ────────────────────────────────────────────────────────────────
  // 5️⃣ Room membership helpers
  //    • joinRoom:    add socket to a specific live conversation
  //    • subscribeRoomUsers: listen for user list in that room
  // ────────────────────────────────────────────────────────────────
  const joinRoom = (conversation_id) => {
    if (!conversation_id) return;
    emit('join_room', conversation_id);
  };

  const subscribeRoomUsers = (handler) => listen('room_users_update', handler);

  // ────────────────────────────────────────────────────────────────
  // 6️⃣ Read / Unread helpers
  //    • markRead: mark all messages in a convo as read
  //    • subscribeUserUnread: listen for user's unread count
  //    • subscribeAdminUnread: listen for admin's unread badge
  // ────────────────────────────────────────────────────────────────
  const markRead = (conversation_id) => emit('mark_read', { conversation_id });

  const subscribeUserUnread = (handler) =>
    listen('unread_count', ({ unreadCount }) => handler(unreadCount));

  const subscribeAdminUnread = (handler) =>
    listen('admin_unread_count', handler);

  // ────────────────────────────────────────────────────────────────
  // 7️⃣ Typing indicator helpers
  //    • startTyping: notify server the user is typing
  //    • subscribeTypingIndicator: listen for others typing
  // ────────────────────────────────────────────────────────────────
  const startTyping = (conversation_id, isTyping = true) =>
    emit('typing', { conversation_id, isTyping });

  const subscribeTypingIndicator = (handler) => listen('user_typing', handler);
  // ────────────────────────────────────────────────────────────────
  // 8️⃣ Online users helpers
  //    • requestOnlineUsers: ask server for full list of online users
  //    • subscribeOnlineUsers: listen for online/offline updates
  // ────────────────────────────────────────────────────────────────
  const requestOnlineUsers = () => emit('request_online_users');

  const subscribeOnlineUsers = (handler) =>
    listen('online_users_update', handler);

  // ────────────────────────────────────────────────────────────────
  // 9️⃣ FreeTrial helpers
  //    • requestFreeTrials: ask for user's trial data
  //    • subscribeFreeTrials: listen for trial updates
  // ────────────────────────────────────────────────────────────────
  const requestFreeTrials = () => emit('fetch_free_trials');
  const subscribeFreeTrials = (handler) => listen('freeTrials_update', handler);

  // ────────────────────────────────────────────────────────────────
  // 🔟 Subscription helpers
  //    • requestSubscriptions: ask for user's subscription data
  //    • subscribeSubscriptions: listen for subscription updates
  // ────────────────────────────────────────────────────────────────
  const requestSubscriptions = () => emit('fetch_subscriptions');
  const subscribeSubscriptions = (handler) =>
    listen('subscriptions_update', handler);

  // ────────────────────────────────────────────────────────────────
  // 1️⃣1️⃣ Bubble-chat (support widget) helpers
  //       This parallels live chat but scoped to bubble conversations
  // ────────────────────────────────────────────────────────────────
  const joinBubbleRoom = (conversation_id) =>
    emit('join_bubble_room', conversation_id);

  const sendBubbleMessage = (conversation_id, message) => {
    if (!message?.trim()) return;
    emit('send_bubble_message', { conversation_id, message });
  };

  const subscribeReceiveBubble = (handler) =>
    listen('receive_bubble_message', handler);

  // ────────────────────────────────────────────────────────────────
  // 📬 Expose all methods to consumers of this hook
  // ────────────────────────────────────────────────────────────────
  return {
    // Core
    socket,
    emit,
    listen,

    // Initial data
    requestInitialData,
    subscribeInitialData,

    // Messaging (live)
    sendMessage,
    editMessage,
    deleteMessage,
    subscribeReceiveMessage,

    // Conversation lifecycle
    deleteConversation,
    subscribeConversationDeleted,
    subscribeRefreshLists,

    // Rooms
    joinRoom,
    subscribeRoomUsers,

    // Read / Unread
    markRead,
    subscribeUserUnread,
    subscribeAdminUnread,

    // Online Users
    requestOnlineUsers,
    subscribeOnlineUsers,

    // Typing
    startTyping,
    subscribeTypingIndicator,

    // Free trials
    requestFreeTrials,
    subscribeFreeTrials,

    // Subscriptions
    requestSubscriptions,
    subscribeSubscriptions,

    // Bubble-chat
    joinBubbleRoom,
    sendBubbleMessage,
    subscribeReceiveBubble,
  };
};

export default useSocketHub;
