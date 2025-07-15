/**
 *   ======================= useChatRoom.js (LIVE & BUBBLE READY) =======================
 * 💬
 * Unified chat room hook for LiveChat (and easily extensible for BubbleChat)
 * - Uses useSocketHub for real-time join, message, typing, and user updates.
 * - All CRUD (send, edit, delete) are via socket events (no API fetches).
 * =====================================================================
 * ⚙️
 * PROPS:
 *   conversationId: string // Conversation/room ID
 *   chatType?: 'live' | 'bubble' (default: 'live')
 *   initialMessages?: Message[]
 * =====================================================================
 * 📌
 * USAGE:
 *   const {
 *     send, edit, remove, messages, users, isTyping, ...
 *   } = useChatRoom(conversationId, { chatType: 'live', initialMessages });
 * =====================================================================
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';
import { useSession } from 'next-auth/react';

// Import useEditMessage and useDeleteMessage
import useEditMessage from '../useEditMessage';
import useDeleteMessage from '../useDeleteMessage';

export const useChatRoom = (conversationId, { chatType = 'live', initialMessages = [] } = {}) => {
  // 1️⃣ Get unified socket actions
  const {
    socket,
    joinRoom,
    leaveRoom,
    markRead,
    sendMessage,
    receiveMessage,
    onRoomUsersUpdate,
    sendTypingStatus,
    onTyping,
    onConversationUpdated
  } = useSocketHub();
  const { data: session } = useSession();

  // 2️⃣ Local state
  const [messages, setMessages] = useState(initialMessages);
  const [users, setUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  // 3️⃣ Modular edit/delete message hooks (pass the correct conversationId and chatType!)
  const { editMessage, onMessageEdited } = useEditMessage(conversationId, chatType);
  const { deleteMessage, onMessageDeleted } = useDeleteMessage(conversationId, chatType);

  // 4️⃣ Join room and mark as read on mount (LIVE/BUBBLE)
  useEffect(() => {
    if (!conversationId) return;
    joinRoom(chatType, conversationId);
    markRead(chatType, conversationId);
    return () => leaveRoom(chatType, conversationId);
  }, [conversationId, chatType, joinRoom, markRead, leaveRoom]);

  // 5️⃣ Real-time socket listeners
  useEffect(() => {
    if (!socket || !conversationId) return;

    // 📨 New message (single or via refresh)
    const offReceive = receiveMessage((msg) => {
      if (msg.conversation_id !== conversationId) return;
      setMessages((prevMessages) => [...prevMessages, msg.message ?? msg]);
    });

    // 🔄 Entire conversation refreshed
    const offConversationUpdate = onConversationUpdated((conversation) => {
      if (conversation.conversation_id !== conversationId) return;
      setMessages(conversation.messages || []);
    });

    // ✏️ Listen for edited message
    const offEdit = onMessageEdited((msg) => {
      setMessages((prev) =>
        prev.map((message) =>
          message.message_id === msg.message_id ? { ...message, ...msg } : message
        )
      );
    });

    // 🗑️ Listen for deleted message
    const offDelete = onMessageDeleted((msg) => {
      setMessages((prev) => prev.filter((message) => message.message_id !== msg.message_id));
    });

    // 🫂 Room users presence
    const offUsers = onRoomUsersUpdate(({ conversation_id, users }) => {
      if (conversation_id === conversationId) setUsers(users);
    });

    // 🔊 Typing indicator
    const offTyping = onTyping(({ conversation_id, isTyping }) => {
      if (conversation_id === conversationId) setIsTyping(isTyping);
    });

    // 🧹 Cleanup
    return () => {
      offReceive && offReceive();
      offConversationUpdate && offConversationUpdate();
      offEdit && offEdit();
      offDelete && offDelete();
      offUsers && offUsers();
      offTyping && offTyping();
    };
  }, [
    socket,
    conversationId,
    receiveMessage,
    onConversationUpdated,
    onMessageEdited,
    onMessageDeleted,
    onRoomUsersUpdate,
    onTyping
  ]);

  // 6️⃣ Socket-powered message actions
  const send = useCallback(
    (text) => {
      if (!text.trim()) return;
      sendMessage(chatType, conversationId, text);
    },
    [chatType, conversationId, sendMessage]
  );

  const edit = useCallback(
    (messageId, text) => {
      if (!text.trim()) return;
      editMessage(messageId, text);
    },
    [editMessage]
  );

  const remove = useCallback(
    (messageId) => {
      deleteMessage(messageId);
    },
    [deleteMessage]
  );

  const startTyping = useCallback(
    (isTypingValue) => {
      sendTypingStatus(conversationId, isTypingValue);
    },
    [conversationId, sendTypingStatus]
  );

  return {
    joinRoom,
    leaveRoom,
    markRead,
    send,
    edit,
    remove,
    messages,
    users,
    isTyping,
    startTyping
  };
};
