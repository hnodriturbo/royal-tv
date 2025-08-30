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
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from '@/i18n';
import useSocketHub from '@/hooks/socket/useSocketHub';
import { useTranslations } from 'next-intl';

const OnlineUsers = () => {
  const t = useTranslations(); // 🌍 translator
  const currentPathname = usePathname();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { requestOnlineUsers, onOnlineUsersUpdate } = useSocketHub();

  useEffect(() => {
    const stopListening = onOnlineUsersUpdate(setOnlineUsers);
    requestOnlineUsers();
    return () => stopListening();
  }, [requestOnlineUsers, onOnlineUsersUpdate]); // ⚠️ no `t` here

  const isChatRoomPage = /^\/admin\/liveChat\/([a-f\d]{24}|[a-f\d-]{36})$/i.test(currentPathname);
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
