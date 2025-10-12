/**
 * ================= usePublicRoomUsers (client) =================
 * 👥 Live presence list for a single public room
 * ---------------------------------------------------------------
 * Args:
 *   • public_conversation_id: string
 *
 * Returns:
 *   • usersInRoom: Array<{ user_id?, public_identity_id?, role, name }>
 *
 * Note:
 *   • Joins/leaves are orchestrated by usePublicLiveChat; this hook only listens.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function usePublicRoomUsers(public_conversation_id) {
  // 🧭 Socket hub bridge (typed events)
  const { onPublicPresenceUpdate } = useSocketHub();

  // 🧑‍🤝‍🧑 Reactive roster for the current room
  const [users, setUsers] = useState([]);

  // 👂 Presence updates scoped to this room
  useEffect(() => {
    if (!onPublicPresenceUpdate) return;
    const off = onPublicPresenceUpdate(({ room_id, public_conversation_id: id, users }) => {
      // 🔎 Some hubs send {room_id}, others {public_conversation_id}; allow both
      const target = id || room_id;
      if (!public_conversation_id || target !== public_conversation_id) return;
      setUsers(Array.isArray(users) ? users : []); // ✅ Safe fallback
    });
    return () => off && off();
  }, [public_conversation_id, onPublicPresenceUpdate]);

  // 📦 Stable shape for consumers
  return useMemo(() => ({ usersInRoom: users }), [users]);
}
