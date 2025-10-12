/**
 * usePublicLiveChat (client hook)
 * ===============================
<<<<<<< HEAD
 * 🎯 Orchestrates public chat UX: room, messages, typing, unread, presence, cookies.
 * 🛠️ Fixes:
 *   • First-message global listener unsubscribes after first run
 *   • Dedupes messages by public_message_id to avoid duplicate React keys
 *   • Stable subscriptions to prevent update-depth loops
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';
import usePublicMessageEvents from '@/hooks/socket/usePublicMessageEvents';
import usePublicTypingIndicator from '@/hooks/socket/usePublicTypingIndicator';
import usePublicUnreadMessages from '@/hooks/socket/usePublicUnreadMessages';
import usePublicRoomUsers from '@/hooks/socket/usePublicRoomUsers';

// 🔎 helper: unique by message id, keep order
const dedupeById = (arr) => {
  const seen = new Set();
  const out = [];
  for (const m of arr) {
    if (!m || !m.public_message_id) continue;
    if (!seen.has(m.public_message_id)) {
      seen.add(m.public_message_id);
      out.push(m);
    }
  }
  return out;
};

export default function usePublicLiveChat() {
  const {
    joinPublicRoom,
    leavePublicRoom,
    joinPublicLobby,
    leavePublicLobby,
    enablePublicCookieSync,
    getLastPublicRoomFromCookie,
    requestPublicUnreadBootstrap,
    // hub-level listeners (any room)
    onPublicMessageReceived,
    onPublicMessagesRefreshed,
    // raw send/list (works with null → server auto-creates)
    sendPublicMessage: sendViaHub,
    refreshPublicMessages
  } = useSocketHub();

  const [activeRoomId, setActiveRoomId] = useState(null);
  const activeRoomIdRef = useRef(null);
  const bootstrappedRef = useRef(false);

  // 🧳 local message list; UI will render this
  const [messageList, setMessageList] = useState([]);

  // domain hooks scoped to active room
  const messages = usePublicMessageEvents(activeRoomId);
  const typing = usePublicTypingIndicator(activeRoomId);
  const unread = usePublicUnreadMessages({ public_conversation_id: activeRoomId });
  const roomUsers = usePublicRoomUsers(activeRoomId);

  // keep ref in sync for stable callbacks
  useEffect(() => {
    activeRoomIdRef.current = activeRoomId;
  }, [activeRoomId]);

  // enable cookie sync once
  useEffect(() => enablePublicCookieSync(), [enablePublicCookieSync]);

  // mount boot: reopen last room or lobby
  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    const lastId = getLastPublicRoomFromCookie();
    if (lastId) {
      console.debug('🔁 reopen last room', lastId);
      setActiveRoomId(lastId);
      joinPublicRoom(lastId);
      requestPublicUnreadBootstrap({ scope: 'user', public_conversation_id: lastId });
      try {
        refreshPublicMessages?.(lastId);
      } catch {}
    } else {
      console.debug('🛋️ join lobby (no last room)');
      joinPublicLobby();
    }

    return () => {
      leavePublicLobby();
      if (activeRoomIdRef.current) leavePublicRoom(activeRoomIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reset list whenever the room changes (before bootstrap/list arrives)
  useEffect(() => {
    setMessageList([]);
  }, [activeRoomId]);

  // room-scoped listeners → update local messageList (deduped)
  useEffect(() => {
    const offCreated = messages.onPublicMessageReceived?.(({ public_conversation_id, message }) => {
      if (public_conversation_id !== activeRoomIdRef.current) return;
      console.debug('🧩 room-created', message?.public_message_id);
      setMessageList((prev) => dedupeById([...prev, message]));
    });

    const offEdited = messages.onPublicMessageEdited?.((payload) => {
      if (payload.public_conversation_id !== activeRoomIdRef.current) return;
      if (payload.action === 'edit' && payload.message) {
        setMessageList((prev) =>
          prev.map((m) => (m.public_message_id === payload.public_message_id ? payload.message : m))
        );
      }
    });

    const offDeleted = messages.onPublicMessageDeleted?.((payload) => {
      if (payload.public_conversation_id !== activeRoomIdRef.current) return;
      setMessageList((prev) =>
        prev.filter((m) => m.public_message_id !== payload.public_message_id)
      );
    });

    const offList = onPublicMessagesRefreshed?.(({ public_conversation_id, messages }) => {
      if (public_conversation_id !== activeRoomIdRef.current) return;
      console.debug('📦 list bootstrap', messages?.length || 0);
      setMessageList(dedupeById(Array.isArray(messages) ? messages : []));
    });

    return () => {
      offCreated && offCreated();
      offEdited && offEdited();
      offDeleted && offDeleted();
      offList && offList();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]); // ⚖️ stable via hub.useCallback

  // global first-message bootstrap when no room yet → unsubscribe after first hit
  useEffect(() => {
    if (activeRoomIdRef.current) return;
    let off = null;
    off = onPublicMessageReceived?.(({ public_conversation_id, message }) => {
      if (activeRoomIdRef.current) return; // ⛔ already in a room, ignore
      if (!public_conversation_id) return;
      console.debug('🆕 captured new room from first message', public_conversation_id);
      setActiveRoomId(public_conversation_id);
      joinPublicRoom(public_conversation_id);
      requestPublicUnreadBootstrap({ scope: 'user', public_conversation_id });
      setMessageList((prev) => dedupeById([...prev, message])); // keep +1, deduped
      // 🔌 unsubscribe this global listener so it never fires again
      try {
        off && off();
      } catch {}
    });
    return () => {
      off && off();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // once

  // API
  const openRoom = useCallback(
    (public_conversation_id) => {
      if (!public_conversation_id) return;
      if (activeRoomIdRef.current && activeRoomIdRef.current !== public_conversation_id) {
        leavePublicRoom(activeRoomIdRef.current);
      }
      setActiveRoomId(public_conversation_id);
      joinPublicRoom(public_conversation_id);
      requestPublicUnreadBootstrap({ scope: 'user', public_conversation_id });
      try {
        refreshPublicMessages?.(public_conversation_id);
      } catch {}
    },
    [joinPublicRoom, leavePublicRoom, requestPublicUnreadBootstrap, refreshPublicMessages]
  );

  const closeRoom = useCallback(() => {
    if (!activeRoomIdRef.current) return;
    leavePublicRoom(activeRoomIdRef.current);
    setActiveRoomId(null);
    setMessageList([]);
    joinPublicLobby();
  }, [leavePublicRoom, joinPublicLobby]);

  const send = useCallback(
    (text) => {
      const value = (text || '').trim();
      if (!value) return;
      if (activeRoomIdRef.current) {
        console.debug('✉️ send → room', activeRoomIdRef.current);
        messages.sendPublicMessage(value);
      } else {
        console.debug('✉️ send (no room) → server will auto-create');
        sendViaHub(null, value);
      }
    },
    [messages, sendViaHub]
  );

  const markRead = useCallback(() => {
    if (!activeRoomIdRef.current) return;
    console.debug('✅ markRead → room', activeRoomIdRef.current);
    messages.markRead?.(activeRoomIdRef.current);
  }, [messages]);

  const sendTyping = useCallback(
    (isTyping = true) => {
      if (!activeRoomIdRef.current) return;
      isTyping ? typing.handleInputFocus?.() : typing.handleInputBlur?.();
    },
    [typing]
  );

  return useMemo(
    () => ({
      activeRoomId,
      openRoom,
      closeRoom,
      messages: { ...messages, list: messageList }, // UI reads from here
      typing,
      unread,
      roomUsers,
      send,
      markRead,
      sendTyping
    }),
    [
      activeRoomId,
      openRoom,
      closeRoom,
      messages,
      messageList,
      typing,
      unread,
      roomUsers,
      send,
      markRead,
      sendTyping
    ]
  );
=======
 * 🎯 Purpose: One hook to rule the public chat UX — joins lobby/rooms, wires messages,
 *             typing, unread counters, and cookie sync.
 *
 * 📤 Emits via SocketHub helpers (under the hood): public:join_room, public:leave_room,
 *     public:join_lobby, public:leave_lobby, public:count_unread (bootstrap), etc.
 *
 * 📥 Listens in composed hooks: message events, typing indicators, unread tallies,
 *     and presence lists for lobby/room users.
 *
 * 🧰 Returns:
 *   • activeRoomId
 *   • openRoom(public_conversation_id)
 *   • closeRoom()
 *   • messages, typing, unread, roomUsers (composed domains)
 *   • send(text), markRead(), sendTyping(isTyping)
 */

'use client'; // ⚛️ Client-only: uses state/effect/hooks and talks to socket

// 🧩 React primitives
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// 🧠 Socket hub (low-level transport + helpers)
import useSocketHub from '@/hooks/socket/useSocketHub';

// 💬 Message domain (send/edit/remove/list/markRead)
import usePublicMessageEvents from '@/hooks/socket/usePublicMessageEvents';

// ⌨️ Typing domain (remote/local typing signals)
import usePublicTypingIndicator from '@/hooks/socket/usePublicTypingIndicator';

// 🔔 Unread domain (counters for user/admin views)
import usePublicUnreadMessages from '@/hooks/socket/usePublicUnreadMessages';

// 🧑‍🤝‍🧑 Presence domain (lobby + room users)
import usePublicRoomUsers from '@/hooks/socket/usePublicRoomUsers';

export default function usePublicLiveChat() {
  // 🧭 Hub API — room/lobby control + cookies + unread bootstrap
  const {
    joinPublicRoom, // 🚪➡️ enter specific room
    leavePublicRoom, // 🚪⬅️ exit specific room
    joinPublicLobby, // 🛋️➡️ enter lobby
    leavePublicLobby, // 🛋️⬅️ exit lobby

    // 🍪 Cookie helpers (remember last room)
    enablePublicCookieSync, // 🔗 keep cookie in sync with events
    getLastPublicRoomFromCookie, // 📜 read last room id

    // 🔄 Unread counters initial load for a room
    requestPublicUnreadBootstrap
  } = useSocketHub();

  // 🧱 Compose specialized domains (kept separate for clarity)
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef
}
