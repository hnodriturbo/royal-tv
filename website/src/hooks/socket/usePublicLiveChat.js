/**
 * ============== usePublicLiveChat (REFACTORED) ==============
 * 🎯 Single source of truth for public chat state & actions
 * -----------------------------------------------------------
 * WHAT IT DOES:
 *   • Auto-reopens last room from cookie on mount
 *   • Manages message list with deduplication
 *   • Aggregates presence, typing, unread from sub-hooks
 *   • Exposes clean API for widget to consume
 *
 * WHY THIS DESIGN:
 *   • Single useEffect per concern (room, messages, cookies)
 *   • Stable refs prevent infinite loops
 *   • Clear separation: state management vs. UI rendering
 */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';
import usePublicMessageEvents from '@/hooks/socket/usePublicMessageEvents';
import usePublicTypingIndicator from '@/hooks/socket/usePublicTypingIndicator';
import usePublicUnreadMessages from '@/hooks/socket/usePublicUnreadMessages';
import usePublicRoomUsers from '@/hooks/socket/usePublicRoomUsers';

// 🔎 Deduplicate messages by ID
const dedupeById = (arr) => {
  const seen = new Set();
  return arr.filter((m) => {
    if (!m?.public_message_id || seen.has(m.public_message_id)) return false;
    seen.add(m.public_message_id);
    return true;
  });
};

// 🍪 Read cookie helper (client-side)
const getCookie = (name) => {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
};

export default function usePublicLiveChat() {
  const {
    joinPublicRoom,
    leavePublicRoom,
    joinPublicLobby,
    leavePublicLobby,
    refreshPublicMessages,
    sendPublicMessage,
    markPublicMessagesRead,
    sendPublicTyping,
    onPublicMessageCreated,
    onPublicMessagesRefreshed,
    onSetLastRoomCookie,
    onClearLastRoomCookie
  } = useSocketHub();

  // 📦 Core state
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const activeRoomIdRef = useRef(null);
  const bootstrappedRef = useRef(false);

  // 🎣 Sub-hooks (scoped to active room)
  const messageEvents = usePublicMessageEvents(activeRoomId);
  const typing = usePublicTypingIndicator(activeRoomId);
  const unread = usePublicUnreadMessages({ public_conversation_id: activeRoomId });
  const roomUsers = usePublicRoomUsers(activeRoomId);

  // 🔄 Keep ref in sync
  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  /* ========================================
   * 🍪 COOKIE SYNC (Client-Side)
   * ======================================*/
  useEffect(() => {
    const unsubSet = onSetLastRoomCookie?.(({ cookieName, public_conversation_id, maxAgeDays }) => {
      const expires = new Date();
      expires.setDate(expires.getDate() + (maxAgeDays || 14));
      document.cookie = `${cookieName}=${public_conversation_id}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
      console.log(`🍪 Set: ${cookieName}=${public_conversation_id}`);
    });

    const unsubClear = onClearLastRoomCookie?.(({ cookieName }) => {
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      console.log(`🍪 Cleared: ${cookieName}`);
    });

    return () => {
      unsubSet?.();
      unsubClear?.();
    };
  }, [onSetLastRoomCookie, onClearLastRoomCookie]);

  /* ========================================
   * 🚀 MOUNT BOOTSTRAP
   * ======================================*/
  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    // 🍪 Try to reopen last room
    const lastRoomId = getCookie('public_last_conversation_id');

    if (lastRoomId) {
      console.log('🔁 Reopening last room:', lastRoomId);
      setActiveRoomId(lastRoomId);
      joinPublicRoom(lastRoomId);
      refreshPublicMessages(lastRoomId, 50);
    } else {
      console.log('🛋️ Joining lobby (no last room)');
      joinPublicLobby();
    }

    return () => {
      leavePublicLobby();
      if (activeRoomIdRef.current) {
        leavePublicRoom(activeRoomIdRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ========================================
   * 📨 MESSAGE LISTENERS
   * ======================================*/
  useEffect(() => {
    // 📥 New message
    const offCreated = onPublicMessageCreated?.(({ public_conversation_id, message }) => {
      if (public_conversation_id !== activeRoomIdRef.current) return;
      setMessages((prev) => dedupeById([...prev, message]));
    });

    // ✏️ Edited message
    const offEdited = messageEvents.onPublicMessageEdited?.(({ message }) => {
      setMessages((prev) =>
        prev.map((m) => (m.public_message_id === message.public_message_id ? message : m))
      );
    });

    // 🗑️ Deleted message
    const offDeleted = messageEvents.onPublicMessageDeleted?.(({ public_message_id }) => {
      setMessages((prev) => prev.filter((m) => m.public_message_id !== public_message_id));
    });

    // 🔄 Refreshed list
    const offRefreshed = onPublicMessagesRefreshed?.(
      ({ public_conversation_id, messages: list }) => {
        if (public_conversation_id !== activeRoomIdRef.current) return;
        setMessages(dedupeById(Array.isArray(list) ? list : []));
      }
    );

    return () => {
      offCreated?.();
      offEdited?.();
      offDeleted?.();
      offRefreshed?.();
    };
  }, [activeRoomIdRef, onPublicMessageCreated, onPublicMessagesRefreshed, messageEvents]);

  /* ========================================
   * 🔄 RESET ON ROOM CHANGE
   * ======================================*/
  useEffect(() => {
    setMessages([]);
  }, [activeRoomId]);

  /* ========================================
   * 📤 PUBLIC API
   * ======================================*/
  const openRoom = useCallback(
    (public_conversation_id) => {
      if (!public_conversation_id) return;

      // Leave current room
      if (activeRoomIdRef.current && activeRoomIdRef.current !== public_conversation_id) {
        leavePublicRoom(activeRoomIdRef.current);
      }

      // Join new room
      setActiveRoomId(public_conversation_id);
      joinPublicRoom(public_conversation_id);
      refreshPublicMessages(public_conversation_id, 50);
    },
    [joinPublicRoom, leavePublicRoom, refreshPublicMessages]
  );

  const closeRoom = useCallback(() => {
    if (!activeRoomIdRef.current) return;
    leavePublicRoom(activeRoomIdRef.current);
    setActiveRoomId(null);
    setMessages([]);
    joinPublicLobby();
  }, [leavePublicRoom, joinPublicLobby]);

  const send = useCallback(
    (text) => {
      const cleanText = (text || '').trim();
      if (!cleanText) return;

      if (activeRoomIdRef.current) {
        sendPublicMessage(activeRoomIdRef.current, cleanText);
      } else {
        // Auto-create room by sending to null (server handles)
        sendPublicMessage(null, cleanText);
      }
    },
    [sendPublicMessage]
  );

  const markRead = useCallback(() => {
    if (!activeRoomIdRef.current) return;
    markPublicMessagesRead(activeRoomIdRef.current);
  }, [markPublicMessagesRead]);

  const setTyping = useCallback(
    (isTyping = true) => {
      if (!activeRoomIdRef.current) return;
      sendPublicTyping(activeRoomIdRef.current, isTyping);
    },
    [sendPublicTyping]
  );

  return useMemo(
    () => ({
      // State
      activeRoomId,
      messages,
      typing,
      unread,
      roomUsers,

      // Actions
      openRoom,
      closeRoom,
      send,
      markRead,
      setTyping
    }),
    [
      activeRoomId,
      messages,
      typing,
      unread,
      roomUsers,
      openRoom,
      closeRoom,
      send,
      markRead,
      setTyping
    ]
  );
}
