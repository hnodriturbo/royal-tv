/**
 *   ===================== NotificationCenter.js =====================
 * 🔔
 * NOTIFICATION CENTER – Unread at top, sorted, prop for all-at-once!
 * ===================================================================
 */

'use client';

import logger from '@/lib/logger';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import RefreshNotificationsButton from 'backup_files/Socket_Backup_Files/RefreshNotificationsButton';
import useSocketHub from '@/hooks/socket/useSocketHub.js';
import axiosInstance from '@/lib/axiosInstance';

const DEFAULT_COUNT = 3;
const DRAWER_FIRST_PAGE_COUNT = 7;
const DRAWER_PAGE_SIZE = 10;
const FETCH_SIZE = 10;

const notificationCardClasses = (notif) =>
  `container-style-sm mx-auto mb-2 rounded-2xl shadow transition
  ${!notif.is_read ? 'border-l-4 border-blue-500 bg-gradient-to-r from-blue-950/50 via-gray-900 to-gray-900' : 'bg-gray-900/70'}
  max-w-xl`;

export default function NotificationCenter({ userRole = 'user', showAllNotifications = false }) {
  const { listen, socket } = useSocketHub();
  const { data: session } = useSession();

  const [notifications, setNotifications] = useState([]);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPage, setDrawerPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState({});
  // Scroll position ref
  const firstNewNotificationRef = useRef(null);
  const [scrollToNew, setScrollToNew] = useState(false); // Add this new state

  // 🟦 Role-aware API path
  const notificationsApiPath =
    userRole === 'admin' ? '/api/admin/notifications' : '/api/user/notifications';

  // 🟩 --- Universal sort: unread first, both sorted by createdAt desc ---
  function sortNotificationsByUnreadAndDate(notifs) {
    const unread = notifs
      .filter((n) => !n.is_read)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const read = notifs
      .filter((n) => n.is_read)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return [...unread, ...read];
  }

  // 🔄 Fetch notifications (all for showAllNotifications, paginated otherwise)
  const fetchNotificationsBatch = useCallback(
    async (batchPage = 0) => {
      try {
        const res = await axiosInstance.get(notificationsApiPath, {
          params: {
            page: batchPage,
            pageSize: showAllNotifications ? 9999 : FETCH_SIZE
          }
        });
        setNotifications((prev) => {
          // 🟦 For showAll, always use the full result, no merge
          if (showAllNotifications) {
            return res.data.notifications || [];
          }
          // Otherwise merge new unique ones
          const all = [...prev];
          for (const notif of res.data.notifications || []) {
            if (!all.some((n) => n.notification_id === notif.notification_id)) {
              all.push(notif);
            }
          }
          return all;
        });
        setTotalNotifications(res.data.total ?? 0);
        setUnreadCount(res.data.unreadCount ?? 0);
      } catch (err) {
        logger.error('❌ Failed to fetch notifications:', err);
      }
    },
    [notificationsApiPath, showAllNotifications]
  );

  // On mount, fetch initial batch/all
  useEffect(() => {
    fetchNotificationsBatch(0);
  }, [fetchNotificationsBatch]);

  // When paginating drawer, fetch next batch if needed (not in showAllNotifications mode)
  useEffect(() => {
    if (showAllNotifications || !drawerOpen) return;
    let neededIndex = 0;
    if (drawerPage === 1) {
      neededIndex = DEFAULT_COUNT + DRAWER_FIRST_PAGE_COUNT;
    } else if (drawerPage > 1) {
      neededIndex =
        DEFAULT_COUNT +
        DRAWER_FIRST_PAGE_COUNT +
        (drawerPage - 2) * DRAWER_PAGE_SIZE +
        DRAWER_PAGE_SIZE;
    }
    if (neededIndex > notifications.length && notifications.length < totalNotifications) {
      const batchPage = Math.floor(neededIndex / FETCH_SIZE);
      fetchNotificationsBatch(batchPage);
    }
  }, [
    drawerOpen,
    drawerPage,
    notifications.length,
    totalNotifications,
    fetchNotificationsBatch,
    showAllNotifications
  ]);

  // Scroll effects
  useEffect(() => {
    if (scrollToNew && firstNewNotificationRef.current) {
      firstNewNotificationRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setScrollToNew(false); // reset for next time
    }
  }, [drawerPage, scrollToNew]);

  // Socket: refresh on push
  useEffect(() => {
    const stopNotif = listen?.('notification_received', () => {
      handleRefresh();
    });
    return () => stopNotif && stopNotif();
  }, [listen, showAllNotifications]); // eslint-disable-line

  const markAsRead = async (notification_id) => {
    if (!notification_id) return;
    try {
      socket?.emit('mark_notification_read', { notification_id });
      setTimeout(() => {
        handleRefresh();
      }, 300);
    } catch (err) {
      logger.error('❌ Failed to mark notification as read (socket):', err);
    }
  };

  const toggleExpanded = (id, notif) => {
    if (!notif.is_read && !expandedIds[id]) markAsRead(id);
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleRefresh = useCallback(() => {
    setNotifications([]);
    setDrawerPage(1);
    setDrawerOpen(false);
    setExpandedIds({});
    fetchNotificationsBatch(0);
  }, [fetchNotificationsBatch]);

  const handleViewNext = () => {
    setDrawerPage((prev) => prev + 1);
    setScrollToNew(true); // Tell effect below to scroll after next render
  };

  const handleSeeLess = () => {
    setDrawerOpen(false);
    setDrawerPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAction = (notif) => {
    if (notif.link) window.location.assign(notif.link);
  };
  const shouldShowButton = (notif) => Boolean(notif.link) && notif.type !== 'newUserRegistration';

  // 🍩 --- Main Display Logic ---

  // 1️⃣ FLAT MODE (showAllNotifications = true): sort all, show as single list
  if (showAllNotifications) {
    const allSorted = sortNotificationsByUnreadAndDate(notifications);

    return (
      <div className="container-style flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-4 lg:p-8 mt-10">
        <div className="flex justify-between items-center w-full mb-6 max-w-xl">
          <h2 className="text-2xl sm:text-3xl font-bold flex items-center">
            🔔 All Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-sm ml-2">
                {unreadCount}
              </span>
            )}
          </h2>
          <RefreshNotificationsButton handleRefresh={handleRefresh} />
        </div>
        <hr className="border border-gray-600 w-11/12 max-w-xl mb-6" />

        {/* Flat full list */}
        <div className="flex flex-col items-center gap-3 mb-4 w-full">
          {allSorted.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No notifications yet.</div>
          ) : (
            allSorted.map((notif) => (
              <div
                key={notif.notification_id}
                className={`${notificationCardClasses(notif)} transition-all duration-700`}
              >
                <button
                  onClick={() => toggleExpanded(notif.notification_id, notif)}
                  className="w-full text-left flex justify-between items-center px-5 py-3"
                >
                  <div className={`flex items-center gap-2 ${!notif.is_read ? 'font-bold' : ''}`}>
                    {!notif.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                    <span className="text-base sm:text-lg">{notif.title}</span>
                  </div>
                  <span className="ml-2">{expandedIds[notif.notification_id] ? '−' : '+'}</span>
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
                      <div className="flex flex-col sm:flex-row gap-3 mt-2">
                        <button
                          onClick={() => handleAction(notif)}
                          className="btn-primary btn-sm w-fit"
                        >
                          Open Content
                        </button>
                      </div>
                    )}
                    <div className="mt-2 pt-3 border-t border-gray-800 text-xs text-gray-500">
                      <div>{new Date(notif.createdAt).toLocaleString()}</div>
                      {notif.type && <div>Type: {notif.type}</div>}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // 2️⃣ NORMAL MODE: preview 3, then 7, then 10, always unread at top of each group
  // --- Slicing and sorting for preview/drawer logic ---
  // Preview: unread at top, sorted within unread/read by date
  const allSorted = sortNotificationsByUnreadAndDate(notifications);

  const topPreview = allSorted.slice(0, DEFAULT_COUNT);
  let drawerSlice = [];
  if (drawerPage === 1) {
    drawerSlice = allSorted.slice(DEFAULT_COUNT, DEFAULT_COUNT + DRAWER_FIRST_PAGE_COUNT);
  } else if (drawerPage > 1) {
    const startIdx = DEFAULT_COUNT + DRAWER_FIRST_PAGE_COUNT + (drawerPage - 2) * DRAWER_PAGE_SIZE;
    const endIdx = startIdx + DRAWER_PAGE_SIZE;
    drawerSlice = allSorted.slice(startIdx, endIdx);
  }
  const totalShownAfterPreview =
    DEFAULT_COUNT +
    DRAWER_FIRST_PAGE_COUNT +
    (drawerPage - 2) * DRAWER_PAGE_SIZE +
    DRAWER_PAGE_SIZE;

  // The index of the last notification currently shown (0-based)
  let lastShownIndex = 0;

  if (drawerOpen) {
    if (drawerPage === 1) {
      lastShownIndex = DEFAULT_COUNT + drawerSlice.length - 1;
    } else if (drawerPage > 1) {
      const previousFullPages = drawerPage - 2;
      const previousFullPagesCount =
        previousFullPages > 0 ? previousFullPages * DRAWER_PAGE_SIZE : 0;
      lastShownIndex =
        DEFAULT_COUNT + DRAWER_FIRST_PAGE_COUNT + previousFullPagesCount + drawerSlice.length - 1;
    }
  }

  // Show "View next 10..." **only if** there are more to show
  const moreToShow = lastShownIndex + 1 < totalNotifications;

  // How many are we displaying? (always 3 preview + all shown in drawer)
  let shownCount = DEFAULT_COUNT; // always 3

  if (drawerOpen) {
    if (drawerPage === 1) {
      shownCount += drawerSlice.length;
    } else if (drawerPage > 1) {
      const previousFullPages = drawerPage - 2;
      const previousFullPagesCount =
        previousFullPages > 0 ? previousFullPages * DRAWER_PAGE_SIZE : 0;
      shownCount += DRAWER_FIRST_PAGE_COUNT + previousFullPagesCount + drawerSlice.length;
    }
  }

  // Clamp to total notifications
  if (shownCount > totalNotifications) shownCount = totalNotifications;

  return (
    <div className="container-style flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-4 lg:p-8 mt-10">
      <div className="flex justify-between items-center w-full mb-6 max-w-xl">
        <h2 className="text-2xl sm:text-3xl font-bold flex items-center">
          🔔 Notifications
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-sm ml-2">
              {unreadCount}
            </span>
          )}
        </h2>
        <RefreshNotificationsButton handleRefresh={handleRefresh} />
      </div>
      <hr className="border border-gray-600 w-11/12 max-w-xl mb-6" />

      {/* Preview */}
      <div className="flex flex-col items-center gap-3 mb-4 w-full">
        {topPreview.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No notifications yet.</div>
        ) : (
          topPreview.map((notif, idx) => (
            <div
              key={notif.notification_id}
              ref={drawerPage > 1 && idx === 0 ? firstNewNotificationRef : null}
              className={notificationCardClasses(notif)}
            >
              <button
                onClick={() => toggleExpanded(notif.notification_id, notif)}
                className="w-full text-left flex justify-between items-center px-5 py-3"
              >
                <div className={`flex items-center gap-2 ${!notif.is_read ? 'font-bold' : ''}`}>
                  {!notif.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                  <span className="text-base sm:text-lg">{notif.title}</span>
                </div>
                <span className="ml-2">{expandedIds[notif.notification_id] ? '−' : '+'}</span>
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
                    <div className="flex flex-col sm:flex-row gap-3 mt-2">
                      <button
                        onClick={() => handleAction(notif)}
                        className="btn-primary btn-sm w-fit"
                      >
                        Open Content
                      </button>
                    </div>
                  )}
                  <div className="mt-2 pt-3 border-t border-gray-800 text-xs text-gray-500">
                    <div>{new Date(notif.createdAt).toLocaleString()}</div>
                    {notif.type && <div>Type: {notif.type}</div>}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- BOTTOM BAR (Buttons Always at Bottom) --- */}
      {/* Only show buttons when not showing all notifications */}
      {!drawerOpen && totalNotifications > DEFAULT_COUNT && (
        <div className="flex flex-row w-full max-w-xl justify-between items-center my-4 gap-2">
          <button
            className="btn btn-secondary"
            onClick={() => {
              setDrawerOpen(true);
              setDrawerPage(1);
            }}
          >
            👇 See More ({totalNotifications})
          </button>
        </div>
      )}

      {/* Drawer */}
      <div
        className={`transition-all duration-1000 w-full ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        {drawerOpen && (
          <>
            <div className="flex flex-col items-center gap-3 mb-4">
              {drawerSlice.length === 0 ? (
                <div className="text-center text-gray-400 py-4">No additional notifications.</div>
              ) : (
                drawerSlice.map((notif, idx) => (
                  <div
                    key={notif.notification_id}
                    ref={drawerPage > 1 && idx === 0 ? firstNewNotificationRef : null}
                    className={notificationCardClasses(notif)}
                  >
                    <button
                      onClick={() => toggleExpanded(notif.notification_id, notif)}
                      className="w-full text-left flex justify-between items-center px-5 py-3"
                    >
                      <div
                        className={`flex items-center gap-2 ${!notif.is_read ? 'font-bold' : ''}`}
                      >
                        {!notif.is_read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                        <span className="text-base sm:text-lg">{notif.title}</span>
                      </div>
                      <span className="ml-2">{expandedIds[notif.notification_id] ? '−' : '+'}</span>
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
                          <div className="flex flex-col sm:flex-row gap-3 mt-2">
                            <button
                              onClick={() => handleAction(notif)}
                              className="btn-primary btn-sm w-fit"
                            >
                              Open Content
                            </button>
                          </div>
                        )}
                        <div className="mt-2 pt-3 border-t border-gray-800 text-xs text-gray-500">
                          <div>{new Date(notif.createdAt).toLocaleString()}</div>
                          {notif.type && <div>Type: {notif.type}</div>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {/* --- Drawer BOTTOM BAR --- */}
            <div className="flex flex-row w-full max-w-xl items-center my-4 gap-2">
              {/* Left: Show next 10 (if more) */}
              {moreToShow ? (
                <>
                  <div className="flex-1 flex justify-start">
                    <button className="btn btn-primary" onClick={handleViewNext}>
                      View next 10 of {totalNotifications}
                    </button>
                  </div>
                  {/* Center: See Less */}
                  <div className="flex-1 flex justify-center">
                    <button className="btn btn-secondary" onClick={handleSeeLess}>
                      ⬆️ See Less
                    </button>
                  </div>
                  {/* Right: Show All */}
                  <div className="flex-1 flex justify-end">
                    <button
                      className="btn-outline-primary btn-sm"
                      onClick={() =>
                        handleRefresh() || window.location.assign(`/${userRole}/notifications`)
                      }
                    >
                      🗂️ Show All Notifications
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-1" /> {/* Empty left for alignment */}
                  <div className="flex-1 flex justify-center">
                    <button className="btn btn-secondary" onClick={handleSeeLess}>
                      ⬆️ See Less
                    </button>
                  </div>
                  <div className="flex-1 flex justify-end">
                    <button
                      className="btn-outline-primary btn-sm"
                      onClick={() =>
                        handleRefresh() || window.location.assign(`/${userRole}/notifications`)
                      }
                    >
                      🗂️ Show All Notifications
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Show range */}
            <div className="w-full max-w-xl flex justify-center text-sm mt-1 mb-4">
              {drawerOpen ? (
                <>
                  {/* 📈 Show correct range */}
                  Showing 1–{shownCount} of {totalNotifications} notifications
                </>
              ) : (
                <>
                  Showing 1–{shownCount} of {totalNotifications} notifications
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
