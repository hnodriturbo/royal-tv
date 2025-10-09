/**
 * usePublicLiveChat (client hook)
 * ===============================
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
}
