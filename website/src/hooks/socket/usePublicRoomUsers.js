/**
<<<<<<< HEAD
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
=======
 * ================= usePublicRoomUsers (client) =================
 * 👥 Track live presence for a single public room
 * --------------------------------------------------------------
 * Args:
 *   • public_conversation_id: string
 *
 * Returns:
 *   • usersInPublicRoom: Array<{ user_id?, public_identity_id?, role, name }>
 *   • joinPublicRoom()
 *   • leavePublicRoom()
 */
'use client';

import { useEffect, useState } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function usePublicRoomUsers(public_conversation_id) {
  // 📌 Reactive list of people currently in the room
  const [usersInPublicRoom, setUsersInPublicRoom] = useState([]);

  // 🛰️ Public room helpers from the hub
  const { joinPublicRoom, leavePublicRoom, onPublicRoomUsersUpdate } = useSocketHub();

  useEffect(() => {
    if (!public_conversation_id) return; // 🛡️ Guard

    // 👂 Live updates (server emits when someone joins/leaves)
    const stop = onPublicRoomUsersUpdate((payload) => {
      if (payload.public_conversation_id === public_conversation_id) {
        setUsersInPublicRoom(Array.isArray(payload.users) ? payload.users : []);
      }
    });

    // 🚪 Enter the room now
    joinPublicRoom(public_conversation_id);

    // 🧹 Leave + unbind on unmount
    return () => {
      leavePublicRoom(public_conversation_id);
      stop && stop();
    };
  }, [public_conversation_id, joinPublicRoom, leavePublicRoom, onPublicRoomUsersUpdate]);

  return {
    usersInPublicRoom,
    joinPublicRoom: () => joinPublicRoom(public_conversation_id), // 🔘 Manual rejoin
    leavePublicRoom: () => leavePublicRoom(public_conversation_id) // 🔘 Manual leave
  };
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef
}
