// 📄 src/app/admin/liveChat/AdminBubbleChat.js
'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState, useCallback } from 'react';
import { BsChatDotsFill } from 'react-icons/bs';
import { useSession } from 'next-auth/react';
import useSocketHub from '@/hooks/socket/useSocketHub';
import BubbleChatWindow from './BubbleChatWindow';

export default function AdminBubbleChat() {
  const {
    listen,
    subscribeReceiveMessage,
    subscribeAdminUnread,
    requestOnlineUsers,
    /* subscribeRoomUsers, */
  } = useSocketHub();
  const { data: session } = useSession();
  const [openWindows, setOpenWindows] = useState([]); // { conversation_id, name }[]
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // ─── Derived state ───────────────────────────────────────────
  const isAdmin = session?.user?.role === 'admin';

  // ─── Callbacks (always below hooks) ─────────────────────────
  const handleNewRoom = useCallback(({ conversation_id, name }) => {
    setOpenWindows((wins) =>
      wins.some((w) => w.conversation_id === conversation_id)
        ? wins
        : [...wins, { conversation_id, name: name || 'User' }],
    );
  }, []);

  const handleIncomingMsg = useCallback(
    (msg) => {
      handleNewRoom(msg);
    },
    [handleNewRoom],
  );

  const handleCloseWindow = useCallback((id) => {
    setOpenWindows((wins) => wins.filter((w) => w.conversation_id !== id));
  }, []);

  // ─── Subscriptions ────────────────────────────────────────────
  useEffect(() => {
    // 1. New support room events
    const offRoom = listen('support_room_created', handleNewRoom);
    // 2. Any incoming bubble message
    const offMsg = onReceive(handleIncomingMsg);
    // 3. Admin-wide unread counter
    const offCount = onAdminUnread((count) => setUnreadCount(count));
    // 4. Kick off initial online-users fetch
    /* const offRoomUsers = listen('room_users_update', subscribeRoomUsers); */

    return () => {
      offRoom();
      offMsg();
      offCount();
      offRoomUsers();
    };
  }, [
    listen,
    subscribeReceiveMessage,
    subscribeAdminUnread,
    requestOnlineUsers,
    handleNewRoom,
    handleIncomingMsg,
    /* subscribeRoomUsers, */
  ]);

  // ─── Early exit for non-admins ────────────────────────────────
  if (!isAdmin) return null;
  // ─── Render ───────────────────────────────────────────────────
  return createPortal(
    <>
      {/* Toggle bubble icon */}
      <div
        className="fixed bottom-8 left-8 z-100 cursor-pointer"
        onClick={() => setIsVisible((v) => !v)}
      >
        <div className="w-16 h-16 bg-green-600 rounded-full shadow-xl flex items-center justify-center hover:bg-green-700 transition">
          <BsChatDotsFill className="text-3xl text-white" />
        </div>
        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
            {unreadCount}
          </div>
        )}
      </div>

      {/* Open windows */}
      {isVisible &&
        openWindows.map((chat, idx) => (
          <div
            key={chat.conversation_id}
            className="fixed bottom-28 left-8 z-100"
            style={{ right: `${idx * 340 + 8}px` }}
          >
            <BubbleChatWindow
              conversation_id={chat.conversation_id}
              name={chat.name}
              isAdmin={true}
              onClose={() => handleCloseWindow(chat.conversation_id)}
            />
          </div>
        ))}
    </>,
    typeof window !== 'undefined' ? document.body : null,
  );
}
