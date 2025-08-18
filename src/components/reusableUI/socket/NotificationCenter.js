/**
 *   ===================== NotificationCenter.js =====================
 * 🔔
 * SOCKET-DRIVEN NOTIFICATION CENTER – Smooth preview/drawer, paginated expand!
 * - 100% in-memory (from socket), never fetches via REST/Axios.
 * - Preview top 3, first "See More" reveals next 7, then 10 at a time.
 * - No Pagination component: all "See More"/"See Less"/"See All Notifications" buttons are styled and worded the same everywhere.
 * - Page never scrolls/jumps when showing more.
 * ===================================================================
 */

'use client';

import { useRef, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import RefreshNotifications from '@/components/reusableUI/socket/RefreshNotifications';
import useNotifications from '@/hooks/socket/useNotifications';
import { useRouter } from '@/lib/language';
import useModal from '@/hooks/useModal';
import { useTRoot } from '@/lib/i18n/client'; // 🌍 translator

const PREVIEW_COUNT = 3;
const FIRST_DRAWER_COUNT = 7;
const DRAWER_PAGE_SIZE = 10;

const notificationCardClasses = (notif) =>
  `w-4/5 mx-auto mb-2 rounded-xl shadow transition-all
   flex flex-col justify-center
   ${!notif.is_read ? 'border-l-4 border-blue-500 bg-gradient-to-r from-blue-950/50 via-gray-900 to-gray-900' : 'bg-gray-900/70'}`;

export default function NotificationCenter({ userRole = 'user' }) {
  const t = useTRoot(); // 🌍
  const { data: session } = useSession();
  const user_id = session?.user?.user_id;
  const router = useRouter();
  const { openModal, hideModal } = useModal();

  const {
    notifications,
    unreadCount,
    markAsRead,
    getPreview,
    getDrawerSlice,
    resortNotifications,
    refreshNotifications,
    removeNotification,
    clearAllNotifications
  } = useNotifications(user_id);

  // 🗑️ delete single modal (strings localized at open time)
  const handleDeleteNotificationModal = (notification_id) => {
    openModal('deleteNotification', {
      title: t('socket.ui.notifications.modals.delete.title'),
      description: t('socket.ui.notifications.modals.delete.description'),
      confirmButtonType: 'Danger',
      confirmButtonText: t('socket.ui.notifications.modals.delete.confirm'),
      cancelButtonText: t('socket.ui.notifications.modals.common.cancel'),
      onConfirm: () => {
        removeNotification(notification_id);
        hideModal();
      },
      onCancel: hideModal
    });
  };

  // 🧨 clear all modal
  const handleClearAllNotificationsModal = () => {
    openModal('clearAllNotifications', {
      title: t('socket.ui.notifications.modals.clear_all.title'),
      description: t('socket.ui.notifications.modals.clear_all.description'),
      confirmButtonType: 'Danger',
      confirmButtonText: t('socket.ui.notifications.modals.clear_all.confirm'),
      cancelButtonText: t('socket.ui.notifications.modals.common.cancel'),
      onConfirm: () => {
        clearAllNotifications();
        hideModal();
      },
      onCancel: hideModal
    });
  };

  // 🔢 UI state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPage, setDrawerPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState({});
  const [visibleDrawerCount, setVisibleDrawerCount] = useState(0);
  const prevDrawerPageRef = useRef(1);

  // 🔪 client slicing
  const topPreview = getPreview(PREVIEW_COUNT);

  let drawerSlice = [];
  if (drawerOpen) {
    let startIdx = PREVIEW_COUNT;
    let endIdx = PREVIEW_COUNT;
    if (drawerPage === 1) {
      endIdx += FIRST_DRAWER_COUNT;
    } else if (drawerPage > 1) {
      endIdx += FIRST_DRAWER_COUNT + (drawerPage - 1) * DRAWER_PAGE_SIZE;
    }
    drawerSlice = getDrawerSlice(startIdx, endIdx);
  }

  // 🎞️ gradual reveal animation
  useEffect(() => {
    if (drawerOpen && drawerPage !== prevDrawerPageRef.current) {
      let start = visibleDrawerCount;
      let end = drawerSlice.length;
      let diff = end - start;
      if (diff <= 0) return;

      const totalDuration = 1500;
      const perNotification = totalDuration / diff;

      let i = start;
      const interval = setInterval(() => {
        setVisibleDrawerCount((count) => {
          if (count < end) return count + 1;
          clearInterval(interval);
          return count;
        });
        i++;
        if (i >= end) clearInterval(interval);
      }, perNotification);

      prevDrawerPageRef.current = drawerPage;
      return () => clearInterval(interval);
    } else if (!drawerOpen) {
      setVisibleDrawerCount(0);
      prevDrawerPageRef.current = 1;
    }
  }, [drawerOpen, drawerPage, drawerSlice.length]);

  // 📥 when first open, show all in batch
  useEffect(() => {
    if (drawerOpen && drawerPage === 1) {
      setVisibleDrawerCount(drawerSlice.length);
      prevDrawerPageRef.current = 1;
    }
  }, [drawerOpen, drawerPage, drawerSlice.length]);

  // 🔢 counts for footer
  const totalNotifications = notifications.length;
  const shownCount = drawerOpen
    ? Math.min(
        PREVIEW_COUNT +
          (drawerPage === 1
            ? drawerSlice.length
            : FIRST_DRAWER_COUNT + (drawerPage - 1) * DRAWER_PAGE_SIZE),
        totalNotifications
      )
    : Math.min(PREVIEW_COUNT, totalNotifications);

  const moreToShow = drawerOpen
    ? shownCount < totalNotifications
    : totalNotifications > PREVIEW_COUNT;
  const canSeeMore = !drawerOpen && totalNotifications > PREVIEW_COUNT;

  // 🧠 show open-content button?
  const shouldShowButton = (notif) => {
    if (userRole === 'admin') return Boolean(notif.link);
    return Boolean(notif.link) && notif.type !== 'newUserRegistration';
  };

  // ⤵️ expand/collapse + mark read
  const toggleExpanded = (id, notif) => {
    if (!notif.is_read && !expandedIds[id]) {
      markAsRead(id);
      setExpandedIds((prev) => ({ ...prev, [id]: true }));
      return;
    }
    if (notif.is_read && expandedIds[id]) {
      setExpandedIds((prev) => ({ ...prev, [id]: false }));
      setTimeout(() => {
        resortNotifications();
      }, 700);
      return;
    }
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="container-style flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-4 lg:p-8">
      {/* 📰 header */}
      <div className="flex justify-between items-center w-full mb-6 max-w-xl">
        <h2 className="text-2xl sm:text-3xl font-bold flex items-center">
          🔔 {t('socket.ui.notifications.title')}
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-sm ml-2">
              {unreadCount}
            </span>
          )}
        </h2>
        <RefreshNotifications user_id={user_id} />
      </div>
      <hr className="border border-gray-600 w-11/12 max-w-xl mb-6" />

      {/* 👀 preview */}
      <div className="flex flex-col items-center gap-3 mb-4 w-full">
        {topPreview.length === 0 ? (
          <div className="text-center text-gray-400 py-8">{t('socket.ui.notifications.empty')}</div>
        ) : (
          topPreview.map((notif) => (
            <div key={notif.notification_id} className={notificationCardClasses(notif)}>
              <button
                onClick={() => toggleExpanded(notif.notification_id, notif)}
                className="w-full text-left flex justify-between items-center px-5 py-3"
              >
                <div className={`flex items-center gap-2 ${!notif.is_read ? 'font-bold' : ''}`}>
                  {!notif.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                  <span className="text-md">{notif.title}</span>
                </div>
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
                      <button
                        className="px-2 py-1 rounded bg-red-700 hover:bg-red-900 text-white text-xs border border-red-500 transition"
                        onClick={() => handleDeleteNotificationModal(notif.notification_id)}
                        title={t('socket.ui.notifications.actions.delete')}
                      >
                        🗑️ {t('socket.ui.notifications.actions.delete')}
                      </button>
                      <button
                        className="btn-primary btn-sm"
                        onClick={() => router.push(notif.link)}
                      >
                        {t('socket.ui.notifications.actions.open')}
                      </button>
                    </div>
                  )}
                  <div className="mt-2 pt-3 border-t border-gray-800 text-xs text-gray-500">
                    <div>{new Date(notif.createdAt).toLocaleString()}</div>
                    {notif.type && (
                      <div>
                        {t('socket.ui.notifications.type_label')}: {notif.type}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ⬇️ bottom controls (when drawer closed) */}
      {!drawerOpen && (
        <div className="flex flex-row w-full max-w-xl justify-between items-center my-4 gap-2">
          {canSeeMore && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                setDrawerOpen(true);
                setDrawerPage(1);
              }}
            >
              👇 {t('socket.ui.notifications.see_more')}
            </button>
          )}
          {!drawerOpen && totalNotifications > 0 && (
            <div className="w-full flex-1 justify-end mb-2 pr-2 text-sm">
              {t('socket.ui.notifications.total', { count: totalNotifications })}
            </div>
          )}
          {notifications.length > 0 && (
            <button
              className="btn-outline-primary btn-sm"
              onClick={() => router.push(`/${userRole}/notifications`)}
            >
              🗂️ {t('socket.ui.notifications.see_all')}
            </button>
          )}
        </div>
      )}

      {/* 🗂️ drawer */}
      {drawerOpen && (
        <div className="w-full transition-all duration-700">
          <div className="flex flex-col items-center gap-3 mb-4">
            {drawerSlice.length === 0 ? (
              <div className="text-center text-gray-400 py-4">
                {t('socket.ui.notifications.empty_more')}
              </div>
            ) : (
              drawerSlice.slice(0, visibleDrawerCount).map((notif) => (
                <div key={notif.notification_id} className={notificationCardClasses(notif)}>
                  <button
                    onClick={() => toggleExpanded(notif.notification_id, notif)}
                    className="w-full text-left flex justify-between items-center px-5 py-3"
                  >
                    <div className={`flex items-center gap-2 ${!notif.is_read ? 'font-bold' : ''}`}>
                      {!notif.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                      <span className="text-md">{notif.title}</span>
                    </div>
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
                          <button
                            className="px-2 py-1 rounded bg-red-700 hover:bg-red-900 text-white text-xs border border-red-500 transition"
                            onClick={() => handleDeleteNotificationModal(notif.notification_id)}
                            title={t('socket.ui.notifications.actions.delete')}
                          >
                            🗑️ {t('socket.ui.notifications.actions.delete')}
                          </button>
                          <button
                            className="btn-primary btn-sm"
                            onClick={() => router.push(notif.link)}
                          >
                            {t('socket.ui.notifications.actions.open')}
                          </button>
                        </div>
                      )}
                      <div className="mt-2 pt-3 border-t border-gray-800 text-xs text-gray-500">
                        <div>{new Date(notif.createdAt).toLocaleString()}</div>
                        {notif.type && (
                          <div>
                            {t('socket.ui.notifications.type_label')}: {notif.type}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-row w-full max-w-xl items-center my-4 gap-2">
            <div className="flex-1 flex justify-start">
              {moreToShow ? (
                <button className="btn-primary" onClick={() => setDrawerPage((prev) => prev + 1)}>
                  👇 {t('socket.ui.notifications.see_more')}
                </button>
              ) : null}
            </div>
            <div className="flex-1 flex justify-center">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setDrawerOpen(false);
                  setDrawerPage(1);
                }}
              >
                ⬆️ {t('socket.ui.notifications.see_less')}
              </button>
            </div>
            {notifications.length > 0 && (
              <div className="flex-1 flex justify-end">
                <button
                  className="btn-outline-primary"
                  onClick={() => router.push(`/${userRole}/notifications`)}
                >
                  🗂️ {t('socket.ui.notifications.see_all')}
                </button>
              </div>
            )}
          </div>

          <div className="w-full max-w-xl flex justify-center text-sm mt-1 mb-4">
            {drawerOpen && (
              <>
                {t('socket.ui.notifications.showing_range', {
                  start: 1,
                  end: shownCount,
                  total: totalNotifications
                })}
              </>
            )}
          </div>
        </div>
      )}

      {/* 🚨 danger zone */}
      {notifications.length > 0 && (
        <div className="w-full max-w-sm mx-auto border border-red-700 rounded-2xl bg-red-950/60 flex flex-col items-center p-6 shadow-lg">
          <h3 className="text-lg font-bold text-red-400 mb-2 flex items-center">
            <span className="mr-2">⚠️</span>
            {t('socket.ui.notifications.danger_zone')}
          </h3>
          <button
            className="px-5 py-2 rounded-lg bg-red-700 hover:bg-red-900 border border-red-500 text-white font-bold shadow transition"
            onClick={handleClearAllNotificationsModal}
          >
            🧨 {t('socket.ui.notifications.actions.clear_all')}
          </button>
        </div>
      )}
    </div>
  );
}
