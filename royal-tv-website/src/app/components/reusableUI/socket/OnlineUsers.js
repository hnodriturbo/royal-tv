'use client';

/**
 * OnlineUsers Component 📡
 * ----------------------
 * Shows a small badge with currently online users (roles + names).
 * Hides itself on the dedicated live‑chat room page to maximise space.
 *
 * Socket events
 *   • request_online_users      – one‑shot: ask server for full list
 *   • online_users_update       – push:   receive updated array
 */

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import useSocketHub from '@/hooks/socket/useSocketHub';

const OnlineUsers = () => {
  // 🧭 detect current route
  const currentPathname = usePathname(); // example → '/admin/liveChat/main'

  // 🌐 tracked list of users
  const [onlineUsers, setOnlineUsers] = useState([]); // // holds { user_id, name, role }

  // 🔌 socket helpers – note the correct names from useSocketHub
  const {
    requestOnlineUsers, // // emit('request_online_users')
    onOnlineUsersUpdate, // // listen('online_users_update')
  } = useSocketHub();

  // 📡 subscribe once when component mounts
  useEffect(() => {
    // 📨 start listening – returns an off() function
    const stopListening = onOnlineUsersUpdate(setOnlineUsers);
    // 🆙 ask server for the current snapshot (covers hard refresh + route changes)
    requestOnlineUsers();
    // 🧹 clean‑up subscription on unmount
    return () => stopListening();
  }, [requestOnlineUsers, onOnlineUsersUpdate]);

  // 🚧 hide component inside a single‑conversation page to keep UI clean
  //     Conversation IDs are typically 24‑char Mongo IDs or 36‑char UUIDs
  const isChatRoomPage =
    /^\/admin\/liveChat\/([a-f\d]{24}|[a-f\d-]{36})$/i.test(currentPathname);
  if (isChatRoomPage) return null; // // nothing to display on that page

  // 💤 no users yet – prevent empty container flash
  if (!onlineUsers.length) return null;

  // 🖼️ UI
  return (
    <div className="container-style-sm mb-4">
      {/* 🟢 headline */}
      <h2 className="text-lg font-bold text-center mb-2">🟢 Online Users</h2>

      {/* 👥 colourful list */}
      <div className="flex flex-wrap gap-2 justify-center">
        {onlineUsers.map((singleUser) => (
          <div key={singleUser.user_id} className="text-white text-sm">
            <span className="text-green-500 mr-1">●</span>
            {singleUser.name}
            <span className="ml-1 text-xs text-gray-300">
              ({singleUser.role})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnlineUsers; // 🏁 done – plug & play 🎉
