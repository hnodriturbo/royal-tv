/**
 *   ===================== SeeAllNotifications.js =====================
 * 🗂️
 * SEE ALL NOTIFICATIONS – Socket-only, all-in-one view!
 * - Displays ALL notifications: unread at top, then read.
 * - Styled and structured just like NotificationCenter.
 * ===================================================================
 * ⚙️ PROPS:
 *   userRole: string // 'admin' or 'user'
 * ===================================================================
 * 📌 USAGE:
 *   <SeeAllNotifications userRole="admin" />
 *   <SeeAllNotifications userRole="user" />
 * ===================================================================
 */

'use client';

import { useState } from 'react'; // 🔄 For expanded state
import { useSession } from 'next-auth/react'; // 👤 Session
import RefreshNotifications from '@/components/reusableUI/socket/RefreshNotifications';
import useNotifications from '@/hooks/socket/useNotifications'; // 🪝 Socket-driven notifications
import { useRouter } from 'next/navigation'; // 🧭 Navigation
import useModal from '@/hooks/useModal';

// 🎨 Consistent notification card styling (your latest version)
const notificationCardClasses = (notif) =>
  `w-4/5 mx-auto mb-2 rounded-xl shadow transition-all
     flex flex-col justify-center
     ${!notif.is_read ? 'border-l-4 border-blue-500 bg-gradient-to-r from-blue-950/50 via-gray-900 to-gray-900' : 'bg-gray-900/70'}`;

export default function SeeAllNotifications({ userRole = 'user' }) {
  // 🟣 Get session & userId
  const { data: session } = useSession();
  const userId = session?.user?.user_id;
  const router = useRouter();

  // 🔔 Fetch all notifications (from socket)
  const {
    notifications,
    unreadCount,
    markAsRead,
    resortNotifications,
    removeNotification,
    clearAllNotifications,
    loading: notificationsLoading
  } = useNotifications(userId);

  const { openModal, hideModal } = useModal();

  const handleDeleteNotificationModal = (notification_id) => {
    openModal('deleteNotification', {
      title: 'Delete Notification',
      description: 'Are you sure you want to delete this notification? This cannot be undone.',
      confirmButtonType: 'Danger',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      onConfirm: () => {
        removeNotification(notification_id); // Your delete logic from before!
        hideModal();
      },
      onCancel: hideModal
    });
  };

  const handleClearAllNotificationsModal = () => {
    openModal('clearAllNotifications', {
      title: 'Delete ALL Notifications',
      description:
        'Are you sure you want to permanently delete ALL notifications? This cannot be undone!',
      confirmButtonType: 'Danger',
      confirmButtonText: 'Delete All',
      cancelButtonText: 'Cancel',
      onConfirm: () => {
        clearAllNotifications(); // Your bulk clear logic
        hideModal();
      },
      onCancel: hideModal
    });
  };

  // 📑 Split: unread first (newest first), then read (newest first)
  const unreadNotifications = notifications
    .filter((n) => !n.is_read)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const readNotifications = notifications
    .filter((n) => n.is_read)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const allSortedNotifications = [...unreadNotifications, ...readNotifications];

  // ⬇️ Expanded state for each notification
  const [expandedIds, setExpandedIds] = useState({});

  // 🟦 Expand/collapse logic, plus marking as read (optimistic)
  const handleToggleExpanded = (id, notif) => {
    // 🟢 If opening an unread notification, mark as read, don't resort
    if (!notif.is_read && !expandedIds[id]) {
      markAsRead(id);
      setExpandedIds((prev) => ({ ...prev, [id]: true }));
      return;
    }
    // 🔵 If closing an expanded, read notification, collapse & reorder after animation
    if (notif.is_read && expandedIds[id]) {
      setExpandedIds((prev) => ({ ...prev, [id]: false }));
      setTimeout(() => {
        resortNotifications(); // Only reorder after the collapse animation (e.g., 700ms)
      }, 700);
      return;
    }
    // 🟣 Toggle for all other cases
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 👮‍♂️ Should we show the "Open Content" button?
  const shouldShowButton = (notif) => {
    if (userRole === 'admin') return Boolean(notif.link);
    return Boolean(notif.link) && notif.type !== 'newUserRegistration';
  };

  return (
    <div className="container-style flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-4 lg:p-8 mt-10">
      {/* 📰 Header: Title + unread badge + refresh button */}
      <div className="flex justify-between items-center w-full mb-6 max-w-xl">
        <h2 className="text-2xl sm:text-3xl font-bold flex items-center">
          🗂️ All Notifications
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-sm ml-2">
              {unreadCount}
            </span>
          )}
        </h2>
        {/* 🔄 Refresh via socket */}
        <RefreshNotifications user_id={userId} />
      </div>
      <hr className="border border-gray-600 w-11/12 max-w-xl mb-6" />

      {/* 📬 ALL notifications – just render as-is, don’t sort here */}
      <div className="flex flex-col items-center gap-3 mb-4 w-full">
        {notifications.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No notifications yet.</div>
        ) : (
          notifications.map((notif) => (
            <div key={notif.notification_id || notif.id} className={notificationCardClasses(notif)}>
              <button
                onClick={() => handleToggleExpanded(notif.notification_id, notif)}
                className="w-full text-left flex justify-between items-center px-5 py-3"
              >
                <div className={`flex items-center gap-2 ${!notif.is_read ? 'font-bold' : ''}`}>
                  {/* 🟦 Dot for unread */}
                  {!notif.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                  {/* 🟦 Title text */}
                  <span className="text-md">{notif.title}</span>
                </div>
                {/* ➕/➖ Icon */}
                <span className="ml-2 text-lg">
                  {expandedIds[notif.notification_id] ? '−' : '+'}
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-700 ${
                  expandedIds[notif.notification_id] ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div
                  className={
                    expandedIds[notif.notification_id]
                      ? 'px-5 pb-2 pt-1 border-t border-gray-700 max-h-56 overflow-y-auto custom-scrollbar'
                      : 'px-5 pb-2 pt-1 border-t border-gray-700'
                  }
                >
                  <div className="text-gray-300 mb-3 mt-2">
                    <p className="whitespace-pre-wrap">{notif.body}</p>
                  </div>
                  {shouldShowButton(notif) && (
                    <div className="flex justify-between items-center mt-3">
                      {/* 🗑️ Delete notification */}
                      <button
                        className="px-2 py-1 rounded bg-red-700 hover:bg-red-900 text-white text-xs border border-red-500 transition"
                        onClick={() => handleDeleteNotificationModal(notif.notification_id)}
                        title="Delete notification"
                      >
                        🗑️ Delete
                      </button>
                      {/* 🗑️ "Open Content" */}
                      <button
                        className="btn-primary btn-sm"
                        onClick={() => router.push(notif.link)}
                      >
                        Open Content
                      </button>
                    </div>
                  )}
                  <div className="mt-2 pt-3 border-t border-gray-800 text-xs text-gray-500">
                    <div>{notif.createdAt ? new Date(notif.createdAt).toLocaleString() : ''}</div>
                    {notif.type && <div>Type: {notif.type}</div>}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {/* 🚨 Danger Zone: Clear All Notifications */}
      {notifications.length > 0 && (
        <div className="w-full max-w-sm mx-auto border border-red-700 rounded-2xl bg-red-950/60 flex flex-col items-center p-6 shadow-lg">
          <h3 className="text-lg font-bold text-red-400 mb-2 flex items-center">
            <span className="mr-2">⚠️</span>
            Danger Zone
          </h3>
          {/*           <p className="mb-4 text-red-300 text-sm text-center">
            This will <b>permanently delete all notifications</b> for your account. This cannot be
            undone!
          </p> */}
          <button
            className="px-5 py-2 rounded-lg bg-red-700 hover:bg-red-900 border border-red-500 text-white font-bold shadow transition"
            onClick={handleClearAllNotificationsModal}
          >
            🧨 Clear All Notifications
          </button>
        </div>
      )}
    </div>
  );
}
