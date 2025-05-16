// 📁 hooks/socket/useOnlineUsers.js
import { useState, useEffect } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function useOnlineUsers() {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { requestOnlineUsers, onOnlineUsersUpdate } = useSocketHub();

  useEffect(() => {
    const stop = onOnlineUsersUpdate(setOnlineUsers);
    requestOnlineUsers();
    return () => stop();
  }, [requestOnlineUsers, onOnlineUsersUpdate]);

  return onlineUsers;
}
