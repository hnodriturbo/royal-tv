/**
 * useChatRoom 💬
 * --------------
 * Universal hook that powers <ChatRoom/>.
 *
 * Props
 *   • conversationId : string               ← room / conversation UUID
 *   • options.chatType   : 'live' | 'bubble'    ← defaults to 'live'
 *
 * Returns
 *   • join()         : join socket room + mark live messages read
 *   • send(text)     : send a new message
 *   • edit(id,text)  : edit an existing message
 *   • remove(id)     : delete a message
 *   • messages       : [] full history + live updates
 *   • users          : [] users currently in the room
 */

'use client';

// 0️⃣ React + helpers ---------------------------------------------------
import { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '@/lib/axiosInstance'; // ✅ @/ import
import useSocketHub from '@/hooks/socket/useSocketHub'; // central hub

export const useChatRoom = (
  conversationId,
  { chatType = 'live', initialMessages = null } = {}, // 🆕 param
) => {
  /* 1️⃣ socket helpers from hub */
  const {
    joinRoom,
    joinBubbleRoom,
    onRoomUsersUpdate,
    sendMessage,
    editMessage,
    deleteMessage,
    subscribeReceiveMessage,
    sendBubbleMessage,
    subscribeReceiveBubble,
    markRead,
  } = useSocketHub();

  /* 2️⃣ local state */
  const [messages, setMessages] = useState(initialMessages ?? []); // 🆕
  const [users, setUsers] = useState([]);
  const loadedHistory = useRef(Boolean(initialMessages)); // 🆕

  /* 3️⃣ fetch initial message history once (only if we still need it) */
  useEffect(() => {
    if (!conversationId || loadedHistory.current) return; // 🚫 no refetch
    (async () => {
      try {
        const base = chatType === 'live' ? 'liveChat' : 'bubbleChat';
        const { data } = await axiosInstance.get(
          `/api/${base}/${conversationId}`,
        );
        setMessages(data.messages ?? []);
        loadedHistory.current = true;
      } catch (err) {
        console.error('❌ Initial history failed', err?.response?.status);
      }
    })();
  }, [conversationId, chatType]);

  /* 4️⃣ join room helper (+ mark read for live) ----------------------- */
  const join = useCallback(() => {
    if (!conversationId) return;
    if (chatType === 'live') {
      joinRoom(conversationId);
      markRead(conversationId);
    } else {
      joinBubbleRoom(conversationId);
    }
  }, [conversationId, chatType, joinRoom, joinBubbleRoom, markRead]);

  /* 5️⃣ send / edit / remove wrappers -------------------------------- */
  const send = useCallback(
    (text) => {
      if (!text?.trim()) return;
      chatType === 'live'
        ? sendMessage(conversationId, text.trim())
        : sendBubbleMessage(conversationId, text.trim());
    },
    [conversationId, chatType, sendMessage, sendBubbleMessage],
  );

  const edit = useCallback(
    (id, newText) =>
      newText?.trim() && editMessage(conversationId, id, newText.trim()),
    [conversationId, editMessage],
  );

  const remove = useCallback(
    (id) => deleteMessage(conversationId, id),
    [conversationId, deleteMessage],
  );

  /* 6️⃣ live socket subscriptions ------------------------------------ */
  useEffect(() => {
    /* messages */
    const offMessages = (
      chatType === 'live' ? subscribeReceiveMessage : subscribeReceiveBubble
    )((msg) => {
      if (msg.conversation_id === conversationId) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    /* users inside room */
    const offUsers = onRoomUsersUpdate(({ conversation_id, users }) => {
      if (conversation_id === conversationId) setUsers(users);
    });

    return () => {
      offMessages();
      offUsers();
    };
  }, [
    conversationId,
    chatType,
    subscribeReceiveMessage,
    subscribeReceiveBubble,
    onRoomUsersUpdate,
  ]);

  /* 7️⃣ expose API */
  return { join, send, edit, remove, messages, users };
};
