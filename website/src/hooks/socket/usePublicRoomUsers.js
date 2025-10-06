/**
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
}
