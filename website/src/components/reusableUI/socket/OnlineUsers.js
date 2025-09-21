/**
 * OnlineUsers Component 📡
 * - Badge with currently online users (roles + names)
 * - Hides itself on the dedicated live‑chat room page
 * - Locale-aware chat route detection
 */
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import useSocketHub from '@/hooks/socket/useSocketHub';

const OnlineUsers = () => {
  const t = useTranslations();
  const pathname = usePathname();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { requestOnlineUsers, onOnlineUsersUpdate } = useSocketHub();

  useEffect(() => {
    const stopListening = onOnlineUsersUpdate(setOnlineUsers);
    requestOnlineUsers();
    return () => stopListening();
  }, [requestOnlineUsers, onOnlineUsersUpdate]);

  // Locale-aware: /{locale}/admin/liveChat/{id}
  const parts = (pathname || '/').replace(/\/$/, '').split('/'); // ['', 'en', 'admin', 'liveChat', '{id}']
  const isChatRoomPage = parts.length >= 5 && parts[2] === 'admin' && parts[3] === 'liveChat';

  if (isChatRoomPage) return null;
  if (!onlineUsers.length) return null;

  return (
    <div className="container-style-sm mb-4">
      <h2 className="text-lg font-bold text-center mb-2">{t('socket.ui.online_users.title')}</h2>
      <div className="flex flex-wrap gap-2 justify-center">
        {onlineUsers.map((singleUser) => (
          <div key={singleUser.user_id} className="text-white text-sm">
            <span className="text-green-500 mr-1">●</span>
            {singleUser.name}
            <span className="ml-1 text-xs text-gray-300">
              ({t(`socket.ui.roles.${singleUser.role || 'guest'}`)})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnlineUsers;
