/**
 * 💬 useChatRoom.js
 * Unified hook for liveChat & bubbleChat with new API routes.
 * Handles joining, typing, presence, real-time updates, and all message CRUD via API.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '@/lib/axiosInstance';
import useSocketHub from '@/hooks/socket/useSocketHub';
import { useSession } from 'next-auth/react';

export const useChatRoom = (conversationId, { chatType = 'live', initialMessages = [] } = {}) => {
  // 1️⃣ Get all socket-powered helpers from sockethub (for presence, typing, NOT message sending!)
  const {
    socket,
    joinRoom,
    markRead,
    leaveRoom,
    receiveMessage,
    sendTypingStatus,
    onTyping,
    onRoomUsersUpdate
  } = useSocketHub();
  const { data: session } = useSession();

  // 2️⃣ Local UI State
  const [messages, setMessages] = useState(initialMessages);
  const [users, setUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const loadedHistory = useRef(Boolean(initialMessages.length));

  // 3️⃣ Fetch all messages on mount or after send/edit/delete
  const fetchMessages = useCallback(async () => {
    if (!conversationId) return;
    try {
      const { data } = await axiosInstance.get(
        `/api/admin/liveChat/ChatRoom?conversation_id=${conversationId}`,
        {
          headers: {
            'x-user-id': session?.user?.user_id || ''
          }
        }
      );
      setMessages(data.messages ?? []);
      loadedHistory.current = true;
    } catch (err) {
      console.error('❌ Failed to load chat messages', err);
    }
  }, [conversationId, session?.user?.user_id]);

  useEffect(() => {
    if (!conversationId || loadedHistory.current) return;
    fetchMessages();
  }, [conversationId, fetchMessages]);

  // 4️⃣ Join/leave room and mark read if live chat
  useEffect(() => {
    if (!conversationId) return;
    joinRoom(chatType, conversationId);
    if (chatType === 'live') markRead('conversation', conversationId);

    return () => {
      leaveRoom(chatType, conversationId);
    };
  }, [conversationId, chatType, joinRoom, markRead, leaveRoom]);

  // 5️⃣ Real-time socket event listeners (for incoming updates)
  useEffect(() => {
    if (!socket || !conversationId) return;

    // 📨 New message (real-time)
    const offReceive = receiveMessage((msg) => {
      if (msg.conversation_id !== conversationId) return;
      setMessages((prev) => [...prev, msg.message ?? msg]);
    });

    // ✏️ Edited message
    const handleEdit = (msg) => {
      if (msg.conversation_id !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) => (m.message_id === msg.message_id ? { ...m, ...msg } : m))
      );
    };
    socket.on('message_edited', handleEdit);

    // 🗑️ Deleted message
    const handleDelete = (msg) => {
      if (msg.conversation_id !== conversationId) return;
      setMessages((prev) => prev.filter((m) => m.message_id !== msg.message_id));
    };
    socket.on('message_deleted', handleDelete);

    // 🫂 Room user presence
    const offUsers = onRoomUsersUpdate(({ conversation_id, users }) => {
      if (conversation_id === conversationId) setUsers(users);
    });

    // 🔊 Typing indicator
    const offTyping = onTyping(({ conversation_id, isTyping }) => {
      if (conversation_id === conversationId) setIsTyping(isTyping);
    });

    // 🧹 Cleanup all listeners
    return () => {
      offReceive && offReceive();
      socket.off('message_edited', handleEdit);
      socket.off('message_deleted', handleDelete);
      offUsers && offUsers();
      offTyping && offTyping();
    };
  }, [socket, conversationId, receiveMessage, onRoomUsersUpdate, onTyping]);

  // 6️⃣ API-powered message actions (send, edit, delete)
  const send = useCallback(
    async (text) => {
      if (!text.trim()) return;
      try {
        await axiosInstance.post(
          '/api/admin/liveChat/ChatRoom',
          {
            conversation_id: conversationId,
            message: text
          },
          {
            headers: {
              'x-user-id': session?.user?.user_id || ''
            }
          }
        );
        fetchMessages(); // Optionally: refetch after send
      } catch (err) {
        console.error('❌ Failed to send message', err);
      }
    },
    [conversationId, session?.user?.user_id, fetchMessages]
  );

  const edit = useCallback(
    async (messageId, text) => {
      try {
        await axiosInstance.put(
          '/api/admin/liveChat/ChatRoom',
          {
            message_id: messageId,
            message: text
          },
          {
            headers: {
              'x-user-id': session?.user?.user_id || ''
            }
          }
        );
        fetchMessages(); // Optionally: refetch after edit
      } catch (err) {
        console.error('❌ Failed to edit message', err);
      }
    },
    [session?.user?.user_id, fetchMessages]
  );

  const remove = useCallback(
    async (messageId) => {
      try {
        await axiosInstance.delete(`/api/admin/liveChat/ChatRoom?message_id=${messageId}`, {
          headers: {
            'x-user-id': session?.user?.user_id || ''
          }
        });
        fetchMessages(); // Optionally: refetch after delete
      } catch (err) {
        console.error('❌ Failed to delete message', err);
      }
    },
    [session?.user?.user_id, fetchMessages]
  );

  const startTyping = useCallback(
    (isTyping) => {
      sendTypingStatus(conversationId, isTyping);
    },
    [conversationId, sendTypingStatus]
  );

  // 7️⃣ Export all state and actions for use in ChatRoom UI
  return {
    joinRoom, // 👈 Optional: use if you want to force join from UI
    markRead, // 👈 Optional: use if you want to force markRead from UI
    leaveRoom, // 👈 Optional: use for manual cleanup
    send,
    edit,
    remove,
    messages,
    users,
    isTyping,
    startTyping,
    fetchMessages // 👈 Optionally expose for manual refresh
  };
};
