/**
 * 🟢 useIsAdminOnline.js
 * ---------------------
 * Custom hook to check if any admin is online and return their info.
 * Real-time updates from your socket system. Works with one or many admins!
 *
 * Usage:
 *   const { isAdminOnline, adminInfo, singleAdmin } = useIsAdminOnline();
 */

import { useState, useEffect } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub'; // 🟢 Central socket hub

const useIsAdminOnline = () => {
  // 1️⃣ State: true if any admin is online, false if not
  const [isAdminOnline, setIsAdminOnline] = useState(false);
  // 2️⃣ State: array of online admin info (can be empty)
  const [adminInfo, setAdminInfo] = useState([]);

  // 3️⃣ Get request and listener helpers from socket hub
  const { requestOnlineUsers, onOnlineUsersUpdate } = useSocketHub();

  useEffect(() => {
    // 4️⃣ Listen for online users update via socket
    const stop = onOnlineUsersUpdate((users) => {
      // 🟢 Filter only admins from user array
      const admins = Array.isArray(users) ? users.filter((user) => user.role === 'admin') : [];
      setIsAdminOnline(admins.length > 0); // ✅ True if any admin online
      setAdminInfo(admins); // 📦 Store all online admins' info
    });

    // 5️⃣ Request initial user list right away
    requestOnlineUsers();

    // 6️⃣ Cleanup listener on unmount or dependencies change
    return stop;
  }, [requestOnlineUsers, onOnlineUsersUpdate]);

  // 7️⃣ Helper: if only one admin online, return that object (else null)
  const singleAdmin = adminInfo.length === 1 ? adminInfo[0] : null;

  // 8️⃣ Return everything as an object for easy use elsewhere
  return { isAdminOnline, adminInfo, singleAdmin };
};

export default useIsAdminOnline;
