/**
 *   ==================== useRoomUsers.js ====================
 * 👥 Real-time tracker for users in a chat room (conversation).
 */
import { useState, useEffect } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function useRoomUsers(conversation_id) {
  const [usersInRoom, setUsersInRoom] = useState([]);
  const { joinRoom, leaveRoom, onRoomUsersUpdate } = useSocketHub();

  useEffect(() => {
    if (!conversation_id) return;
    const stop = onRoomUsersUpdate((data) => {
      if (data.conversation_id === conversation_id) setUsersInRoom(data.users);
    });
    joinRoom(conversation_id);
    return () => {
      leaveRoom(conversation_id);
      stop && stop();
    };
  }, [conversation_id, joinRoom, leaveRoom, onRoomUsersUpdate]);

  return {
    usersInRoom,
    joinRoom: () => joinRoom(conversation_id),
    leaveRoom: () => leaveRoom(conversation_id)
  };
}
