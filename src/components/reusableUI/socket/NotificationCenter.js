/**
 * NotificationCenter.js
 * SOCKET-DRIVEN NOTIFICATION CENTER – preview/drawer, paginated expand.
 * - Locale-aware navigation for "See All" and per-notification links
 * - Smooth progressive reveal
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';

import RefreshNotifications from '@/components/reusableUI/socket/RefreshNotifications';
import useModal from '@/hooks/useModal';
import useNotifications from '@/hooks/socket/useNotifications';
import { SafeString } from '@/lib/ui/SafeString';

const PREVIEW_COUNT = 3;
const FIRST_DRAWER_COUNT = 7;
const DRAWER_PAGE_SIZE = 10;

const notificationCardClasses = (notif) =>
  `w-4/5 mx-auto mb-2 rounded-xl shadow transition-all
   flex flex-col justify-center
   ${!notif.is_read ? 'border-l-4 border-blue-500 bg-gradient-to-r from-blue-950/50 via-gray-900 to-gray-900' : 'bg-gray-900/70'}`;

export default function NotificationCenter({ userRole = 'user' }) {
  const t = useTranslations();
  const locale = useLocale();
  const { data: session } = useSession();
  const user_id = session?.user?.user_id;
  const router = useRouter();
  const { openModal, hideModal } = useModal();

  const visibleCountRef = useRef(0);

  const {
    notifications,
    unreadCount,
    markAsRead,
    getPreview,
    getDrawerSlice,
    resortNotifications,
    /* refreshNotifications, */
    removeNotification,
    clearAllNotifications
  } = useNotifications(user_id);

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

  useEffect(() => {
    visibleCountRef.current = visibleDrawerCount;
  }, [visibleDrawerCount]);

  useEffect(() => {
    if (drawerOpen && drawerPage !== prevDrawerPageRef.current) {
      let start = visibleCountRef.current;
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

  useEffect(() => {
    if (drawerOpen && drawerPage === 1) {
      setVisibleDrawerCount(drawerSlice.length);
      prevDrawerPageRef.current = 1;
    }
  }, [drawerOpen, drawerPage, drawerSlice.length]);

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

  const shouldShowButton = (notif) => {
    if (userRole === 'admin') return Boolean(notif.link);
    return Boolean(notif.link) && notif.type !== 'newUserRegistration';
  };

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
                type="button"
                onClick={() => toggleExpanded(notif.notification_id, notif)}
                className="w-full text-left flex justify-between items-center px-5 py-3"
                aria-expanded={!!expandedIds[notif.notification_id]}
              >
                <div className={`flex items-center gap-2 ${!notif.is_read ? 'font-bold' : ''}`}>
                  {!notif.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                  <span className="text-md">
                    {SafeString(notif.title, 'NotificationCenter.title') ?? ''}
                  </span>
                </div>
                <span className="ml-2 text-lg">
                  {expandedIds[notif.notification_id] ? '−' : '+'}
                </span>
              </button>
              <div
                className={`overflow-hidden transition-all duration-700 ${expandedIds[notif.notification_id] ? 'max-h-96' : 'max-h-0'}`}
              >
                <div
                  className={
                    expandedIds[notif.notification_id]
                      ? 'px-5 pb-2 pt-1 border-t border-gray-700 max-h-56 overflow-y-auto custom-scrollbar'
                      : 'px-5 pb-2 pt-1 border-t border-gray-700'
                  }
                >
                  <div className="text-gray-300 mb-3 mt-2">
                    <p className="whitespace-pre-wrap">
                      {SafeString(notif.body, 'NotificationCenter.body')}
                    </p>
                  </div>
                  {shouldShowButton(notif) && typeof notif.link === 'string' && (
                    <div className="flex justify-between items-center mt-3">
                      {/* 🗑️ Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteNotificationModal(notif.notification_id)}
                        title={SafeString(t('socket.ui.notifications.actions.delete') ?? '')}
                      >
                        🗑️ {SafeString(t('socket.ui.notifications.actions.delete') ?? '')}
                      </button>
                      {/* 🔗 Open link (locale-aware) */}
                      <button
                        type="button"
                        onClick={() => router.push(`/${locale}${SafeString(notif.link, '/')}`)}
                      >
                        {SafeString(t('socket.ui.notifications.actions.open') ?? '')}
                      </button>
                    </div>
                  )}
                  <div className="mt-2 pt-3 border-t border-gray-800 text-xs text-gray-500">
                    <div>{new Date(notif.createdAt).toLocaleString()}</div>
                    {notif.type && (
                      <div>
                        <span>
                          {SafeString(t('socket.ui.notifications.type_label'))}
                          {': '}
                          {SafeString(notif.type)}
                        </span>
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
            <button type="button" onClick={() => setDrawerPage((prev) => prev + 1)}>
              👇 {SafeString(t('socket.ui.notifications.see_more') ?? '')}
            </button>
          )}
          {!drawerOpen && totalNotifications > 0 && (
            <div className="w-full flex-1 justify-end mb-2 pr-2 text-sm">
              {t('socket.ui.notifications.total', { count: totalNotifications })}
            </div>
          )}
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={() => router.push(`/${locale}/${String(userRole ?? 'user')}/notifications`)}
            >
              🗂️ {String(t('socket.ui.notifications.see_all') ?? '')}
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
                    type="button"
                    onClick={() => toggleExpanded(notif.notification_id, notif)}
                    className="w-full text-left flex justify-between items-center px-5 py-3"
                    aria-expanded={!!expandedIds[notif.notification_id]}
                  >
                    <div className={`flex items-center gap-2 ${!notif.is_read ? 'font-bold' : ''}`}>
                      {!notif.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                      <span className="text-md">
                        {String(SafeString(notif.title, 'NotificationCenter.title') ?? '')}
                      </span>
                    </div>
                    <span className="ml-2 text-lg">
                      {expandedIds[notif.notification_id] ? '−' : '+'}
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-700 ${expandedIds[notif.notification_id] ? 'max-h-96' : 'max-h-0'}`}
                  >
                    <div
                      className={
                        expandedIds[notif.notification_id]
                          ? 'px-5 pb-2 pt-1 border-t border-gray-700 max-h-56 overflow-y-auto custom-scrollbar'
                          : 'px-5 pb-2 pt-1 border-t border-gray-700'
                      }
                    >
                      <div className="text-gray-300 mb-3 mt-2">
                        <p className="whitespace-pre-wrap">
                          {SafeString(notif.body, 'NotificationCenter.body')}
                        </p>
                      </div>
                      {shouldShowButton(notif) && (
                        <div className="flex justify-between items-center mt-3">
                          <button
                            type="button"
                            onClick={() => handleDeleteNotificationModal(notif.notification_id)}
                            title={String(t('socket.ui.notifications.actions.delete') ?? '')}
                          >
                            🗑️ {String(t('socket.ui.notifications.actions.delete') ?? '')}
                          </button>
                          <button
                            type="button"
                            onClick={() => router.push(`/${locale}${String(notif.link ?? '/')}`)}
                          >
                            {String(t('socket.ui.notifications.actions.open') ?? '')}
                          </button>
                        </div>
                      )}
                      <div className="mt-2 pt-3 border-t border-gray-800 text-xs text-gray-500">
                        <div>{new Date(notif.createdAt).toLocaleString()}</div>
                        {notif.type && (
                          <div>
                            {SafeString(t('socket.ui.notifications.type_label'))}:{' '}
                            {SafeString(notif.type)}
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
                  👇 {SafeString(t('socket.ui.notifications.see_more'), '')}
                </button>
              ) : null}
            </div>
            <div className="flex-1 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  setDrawerPage(1);
                }}
              >
                ⬆️ {SafeString(t('socket.ui.notifications.see_less') ?? '')}
              </button>
            </div>
            {notifications.length > 0 && (
              <div className="flex-1 flex justify-end">
                <Link
                  href={`/${locale}/${userRole}/notifications`}
                  className="btn-outline-primary text-center block"
                >
                  🗂️ {t('socket.ui.notifications.see_all')}
                </Link>
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
            type="button"
            onClick={handleClearAllNotificationsModal}
            className="px-5 py-2 rounded-lg bg-red-700 hover:bg-red-900 border border-red-500 text-white font-bold shadow transition"
            title={SafeString(t('socket.ui.notifications.actions.clear_all') ?? '')}
          >
            🧨 {SafeString(t('socket.ui.notifications.actions.clear_all') ?? '')}
          </button>
        </div>
      )}
    </div>
  );
}
