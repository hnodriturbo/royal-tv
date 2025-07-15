/**
 *   ==================== useRoomUsers.js ====================
 * 👥
 * Real-time tracker for users in a chat room (conversation).
 * - Subscribes to room_users_update.
 * - Returns [users, joinRoom, leaveRoom].
 * ===========================================================
 * PROPS:
 *   conversation_id: string        // The conversation/room to watch
 * ===========================================================
 * USAGE:
 *   const { usersInRoom, joinRoom, leaveRoom } = useRoomUsers(conversation_id);
 * ===========================================================
 */

import { useState, useEffect } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function useRoomUsers(conversation_id) {
  // 🧑‍🤝‍🧑 State for users in room
  const [usersInRoom, setUsersInRoom] = useState([]);
  const { joinRoom, leaveRoom, onRoomUsersUpdate } = useSocketHub();

  useEffect(() => {
    if (!conversation_id) return;
    // 👂 Listen for user changes in this room
    const stop = onRoomUsersUpdate((data) => {
      if (data.conversation_id === conversation_id) setUsersInRoom(data.users);
    });
    // 🚪 Join room on mount
    joinRoom('live', conversation_id);
    // 🧹 Clean up on unmount
    return () => {
      leaveRoom('live', conversation_id);
      stop();
    };
    // eslint-disable-next-line
  }, [conversation_id, joinRoom, leaveRoom, onRoomUsersUpdate]);

  return {
    usersInRoom,
    joinRoom: () => joinRoom('live', conversation_id),
    leaveRoom: () => leaveRoom('live', conversation_id)
  };
}
