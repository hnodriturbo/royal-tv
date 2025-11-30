/**
 *   ==================== usePublicRoomUsers.js ====================
 * 👥 Real-time tracker for users in a public chat room
 */
import { useState, useEffect } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function usePublicRoomUsers(public_conversation_id) {
  const [usersInRoom, setUsersInRoom] = useState([]);
  const { joinPublicRoom, leavePublicRoom, listen } = useSocketHub();

  useEffect(() => {
    if (!public_conversation_id) return;

    // Listen for presence updates
    const stop = listen('public_presence:update', (data) => {
      if (data.room_id === public_conversation_id) {
        setUsersInRoom(data.users || []);
      }
    });

    // Join the room
    joinPublicRoom(public_conversation_id);

    return () => {
      // Leave the room
      leavePublicRoom(public_conversation_id);
      stop && stop();
    };
  }, [public_conversation_id, joinPublicRoom, leavePublicRoom, listen]);

  return {
    usersInRoom,
    joinRoom: () => joinPublicRoom(public_conversation_id),
    leaveRoom: () => leavePublicRoom(public_conversation_id)
  };
}
