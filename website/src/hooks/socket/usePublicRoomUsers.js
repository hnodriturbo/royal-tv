/**
 * ========== usePublicRoomUsers (client) ==========
 * 🧑‍🤝‍🧑 Presence list for a single room.
 * 🚫 No auto-join here — let usePublicLiveChat control joins.
 */
'use client';

import { useEffect, useMemo, useState } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function usePublicRoomUsers(public_conversation_id) {
  const { onPublicPresenceUpdate } = useSocketHub();
  const [users, setUsers] = useState([]);

  // 👂 Presence updates (filter by this room)
  useEffect(() => {
    const off = onPublicPresenceUpdate(({ room_id, users }) => {
      if (!public_conversation_id || room_id !== public_conversation_id) return;
      setUsers(Array.isArray(users) ? users : []);
    });
    return off;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [public_conversation_id]); // keep deps minimal to avoid resub loops

  return useMemo(() => ({ usersInRoom: users }), [users]);
}
