/**
 *   ===================== SeeAllNotifications.js =====================
 * 🗂️ All notifications (socket-driven) — unread first, then read
 * - Translated via useTRoot() 🌍
 * - Matches NotificationCenter styling
 * - Admin/user logic unchanged
 * ===================================================================
 */
'use client';

import { useState } from 'react'; // 🔄 Local expand/collapse state
import { useSession } from 'next-auth/react'; // 👤 Session
import RefreshNotifications from '@/components/reusableUI/socket/RefreshNotifications';
import useNotifications from '@/hooks/socket/useNotifications'; // 🪝 Socket notifications
import { useRouter } from '@/lib/language'; // 🧭 Navigation
import useModal from '@/hooks/useModal';
import { useTRoot } from '@/lib/i18n/client'; // 🌍 i18n root translator

// 🎨 Consistent notification card styling (stable)
const notificationCardClasses = (singleNotification) =>
  `w-4/5 mx-auto mb-2 rounded-xl shadow transition-all
     flex flex-col justify-center
     ${
       !singleNotification.is_read
         ? 'border-l-4 border-blue-500 bg-gradient-to-r from-blue-950/50 via-gray-900 to-gray-900'
         : 'bg-gray-900/70'
     }`;

export default function SeeAllNotifications({ userRole = 'user' }) {
  const t = useTRoot(); // 🌍 translation hook
  const { data: session } = useSession(); // 🧾 current user session
  const userId = session?.user?.user_id; // 🪪 user id
  const router = useRouter(); // 🧭 router for links

  // 🔔 Socket notifications API
  const {
    notifications,
    unreadCount,
    markAsRead,
    resortNotifications,
    removeNotification,
    clearAllNotifications,
    loading: notificationsLoading // 💤 kept for potential spinners
  } = useNotifications(userId);

  const { openModal, hideModal } = useModal(); // 🪟 modal helpers

  // 🗑️ Delete single notification (confirm modal)
  const handleDeleteNotificationModal = (notification_id) => {
    openModal('deleteNotification', {
      title: t('socket.ui.see_all_notifications.delete_title'), // 🏷️ title
      description: t('socket.ui.see_all_notifications.delete_description'), // 📝 body
      confirmButtonType: 'Danger',
      confirmButtonText: t('socket.ui.see_all_notifications.delete_button'),
      cancelButtonText: t('socket.ui.see_all_notifications.cancel_button'),
      onConfirm: () => {
        removeNotification(notification_id); // 🧹 delete and close
        hideModal();
      },
      onCancel: hideModal
    });
  };

  // 🧨 Clear all notifications (confirm modal)
  const handleClearAllNotificationsModal = () => {
    openModal('clearAllNotifications', {
      title: t('socket.ui.see_all_notifications.delete_all_title'),
      description: t('socket.ui.see_all_notifications.delete_all_description'),
      confirmButtonType: 'Danger',
      confirmButtonText: t('socket.ui.see_all_notifications.delete_all_button'),
      cancelButtonText: t('socket.ui.see_all_notifications.cancel_button'),
      onConfirm: () => {
        clearAllNotifications(); // 🧨 remove all
        hideModal();
      },
      onCancel: hideModal
    });
  };

  // ⬇️ Keep local expand/collapse state by id
  const [expandedIds, setExpandedIds] = useState({});

  // 🎛️ Toggle expand and manage read state / reordering
  const handleToggleExpanded = (notification_id, singleNotification) => {
    // 🟢 Opening unread → mark as read
    if (!singleNotification.is_read && !expandedIds[notification_id]) {
      markAsRead(notification_id);
      setExpandedIds((previous) => ({ ...previous, [notification_id]: true }));
      return;
    }
    // 🔵 Closing read → collapse then resort (after animation)
    if (singleNotification.is_read && expandedIds[notification_id]) {
      setExpandedIds((previous) => ({ ...previous, [notification_id]: false }));
      setTimeout(() => {
        resortNotifications();
      }, 700);
      return;
    }
    // 🟣 Default toggle
    setExpandedIds((previous) => ({ ...previous, [notification_id]: !previous[notification_id] }));
  };

  // 🔗 Should we show the "Open Content" button?
  const shouldShowButton = (singleNotification) => {
    if (userRole === 'admin') return Boolean(singleNotification.link);
    return Boolean(singleNotification.link) && singleNotification.type !== 'newUserRegistration';
  };

  return (
    <div className="container-style flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-4 lg:p-8 mt-10">
      {/* 📰 Header: title + unread badge + refresh button */}
      <div className="flex justify-between items-center w-full mb-6 max-w-xl">
        <h2 className="text-2xl sm:text-3xl font-bold flex items-center">
          {t('socket.ui.see_all_notifications.title')}
          {/* 🏷️ page title */}
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-sm ml-2">
              {unreadCount}
              {/* 🔴 unread count */}
            </span>
          )}
        </h2>
        {/* 🔄 Refresh via socket */}
        <RefreshNotifications user_id={userId} />
      </div>

      <hr className="border border-gray-600 w-11/12 max-w-xl mb-6" />

      {/* 📬 All notifications list */}
      <div className="flex flex-col items-center gap-3 mb-4 w-full">
        {notifications.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            {t('socket.ui.see_all_notifications.no_notifications')}
            {/* 📨 empty state */}
          </div>
        ) : (
          notifications.map((singleNotification) => (
            <div
              key={singleNotification.notification_id || singleNotification.id}
              className={notificationCardClasses(singleNotification)}
            >
              {/* 🧰 Header row: title + expand icon */}
              <button
                onClick={() =>
                  handleToggleExpanded(singleNotification.notification_id, singleNotification)
                }
                className="w-full text-left flex justify-between items-center px-5 py-3"
              >
                <div
                  className={`flex items-center gap-2 ${
                    !singleNotification.is_read ? 'font-bold' : ''
                  }`}
                >
                  {/* 🔵 Dot for unread */}
                  {!singleNotification.is_read && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  )}
                  {/* 🏷️ Title text (already localized when created) */}
                  <span className="text-md">{singleNotification.title}</span>
                </div>
                {/* ➕/➖ Icon */}
                <span className="ml-2 text-lg">
                  {expandedIds[singleNotification.notification_id] ? '−' : '+'}
                </span>
              </button>

              {/* 📥 Collapsible body */}
              <div
                className={`overflow-hidden transition-all duration-700 ${
                  expandedIds[singleNotification.notification_id] ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div
                  className={
                    expandedIds[singleNotification.notification_id]
                      ? 'px-5 pb-2 pt-1 border-t border-gray-700 max-h-56 overflow-y-auto custom-scrollbar'
                      : 'px-5 pb-2 pt-1 border-t border-gray-700'
                  }
                >
                  {/* 📝 Body text (already localized) */}
                  <div className="text-gray-300 mb-3 mt-2">
                    <p className="whitespace-pre-wrap">{singleNotification.body}</p>
                  </div>

                  {/* 🔗 Action buttons */}
                  {shouldShowButton(singleNotification) && (
                    <div className="flex justify-between items-center mt-3">
                      {/* 🗑️ Delete notification */}
                      <button
                        className="px-2 py-1 rounded bg-red-700 hover:bg-red-900 text-white text-xs border border-red-500 transition"
                        onClick={() =>
                          handleDeleteNotificationModal(singleNotification.notification_id)
                        }
                        title={t('socket.ui.see_all_notifications.delete_notification')}
                      >
                        🗑️ {t('socket.ui.see_all_notifications.delete_button')}
                      </button>

                      {/* 🔓 Open content link */}
                      <button
                        className="btn-primary btn-sm"
                        onClick={() => router.push(singleNotification.link)}
                      >
                        {t('socket.ui.see_all_notifications.open_content')}
                      </button>
                    </div>
                  )}

                  {/* 🗓️ Meta info */}
                  <div className="mt-2 pt-3 border-t border-gray-800 text-xs text-gray-500">
                    <div>
                      {singleNotification.createdAt
                        ? new Date(singleNotification.createdAt).toLocaleString()
                        : ''}
                    </div>
                    {singleNotification.type && <div>Type: {singleNotification.type}</div>}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 🚨 Danger Zone: Clear all */}
      {notifications.length > 0 && (
        <div className="w-full max-w-sm mx-auto border border-red-700 rounded-2xl bg-red-950/60 flex flex-col items-center p-6 shadow-lg">
          <h3 className="text-lg font-bold text-red-400 mb-2 flex items-center">
            <span className="mr-2">⚠️</span>
            {t('socket.ui.see_all_notifications.danger_zone')}
            {/* ⚠️ title */}
          </h3>

          <button
            className="px-5 py-2 rounded-lg bg-red-700 hover:bg-red-900 border border-red-500 text-white font-bold shadow transition"
            onClick={handleClearAllNotificationsModal}
          >
            🧨 {t('socket.ui.see_all_notifications.clear_all_notifications')}
            {/* 💣 CTA */}
          </button>
        </div>
      )}
    </div>
  );
}
