/**
 *   ===================== NotificationCenter.js =====================
 * 🔔
 * NOTIFICATION CENTER – Simple preview, paginated drawer, custom buttons!
 * - Preview top 3, then paginated drawer (7 first, then 10 per "next").
 * - No pagination component, all buttons in bottom bar, smooth scroll.
 * ===================================================================
 */

'use client';

import logger from '@/lib/logger';
import { useRef, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // 🧭 SPA navigation

import RefreshNotificationsButton from 'backup_files/Socket_Backup_Files/RefreshNotificationsButton';
import useSocketHub from '@/hooks/socket/useSocketHub.js';
import axiosInstance from '@/lib/axiosInstance';

const DEFAULT_COUNT = 3; // 👑 Preview at top
const DRAWER_FIRST_PAGE_COUNT = 7; // 📄 First batch after preview
const DRAWER_PAGE_SIZE = 10; // 🔢 Next batch size

const notificationCardClasses = (notif) =>
  `container-style-sm mx-auto mb-2 rounded-2xl shadow transition
  ${!notif.is_read ? 'border-l-4 border-blue-500 bg-gradient-to-r from-blue-950/50 via-gray-900 to-gray-900' : 'bg-gray-900/70'}
  max-w-xl`;

export default function NotificationCenter({ userRole = 'user' }) {
  // 🗝️ State
  const [notifications, setNotifications] = useState([]);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPage, setDrawerPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState({});
  const firstDrawerRef = useRef(null);
  const [scrollToNew, setScrollToNew] = useState(false);

  const { listen, socket } = useSocketHub();
  const { data: session } = useSession();
  const router = useRouter();

  // 🟦 API path (role aware)
  const notificationsApiPath =
    userRole === 'admin' ? '/api/admin/notifications' : '/api/user/notifications';

  // 🔄 Fetch all batches needed so far (for preview + current drawer)
  const fetchNotifications = useCallback(async () => {
    // Calculate needed notifications up to current drawer page
    let needed = DEFAULT_COUNT;
    if (drawerOpen) {
      if (drawerPage === 1) {
        needed += DRAWER_FIRST_PAGE_COUNT;
      } else if (drawerPage > 1) {
        needed += DRAWER_FIRST_PAGE_COUNT + (drawerPage - 1) * DRAWER_PAGE_SIZE;
      }
    }
    try {
      const res = await axiosInstance.get(notificationsApiPath, {
        params: { page: 0, pageSize: Math.max(needed, 20) }
      });
      setNotifications(res.data.notifications || []);
      setTotalNotifications(res.data.total ?? 0);
      setUnreadCount(res.data.unreadCount ?? 0);
    } catch (err) {
      logger.error('❌ Failed to fetch notifications:', err);
    }
  }, [notificationsApiPath, drawerOpen, drawerPage]);

  // 🟩 Initial + whenever drawer/page changes
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // 🔁 Refresh on socket event
  useEffect(() => {
    const stopNotif = listen?.('notification_received', fetchNotifications);
    return () => stopNotif && stopNotif();
  }, [listen, fetchNotifications]);

  // 🔵 Mark as read
  const markAsRead = async (notification_id) => {
    if (!notification_id) return;
    try {
      socket?.emit('mark_notification_read', { notification_id });
      setTimeout(fetchNotifications, 300);
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

  // 🌀 Full refresh (reset to top preview)
  const handleRefresh = () => {
    setDrawerOpen(false);
    setDrawerPage(1);
    setExpandedIds({});
    fetchNotifications();
  };

  // 📱 Scroll to first notification in drawer after page change
  useEffect(() => {
    if (scrollToNew && firstDrawerRef.current) {
      firstDrawerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setScrollToNew(false);
    }
  }, [drawerPage, scrollToNew]);

  // 🟨 Slicing logic for preview and drawer
  const topPreview = notifications.slice(0, DEFAULT_COUNT);

  // Drawer slice logic (always after the preview)
  let drawerSlice = [];
  if (drawerOpen) {
    if (drawerPage === 1) {
      drawerSlice = notifications.slice(DEFAULT_COUNT, DEFAULT_COUNT + DRAWER_FIRST_PAGE_COUNT);
    } else if (drawerPage > 1) {
      const startIdx =
        DEFAULT_COUNT + DRAWER_FIRST_PAGE_COUNT + (drawerPage - 2) * DRAWER_PAGE_SIZE;
      const endIdx = startIdx + DRAWER_PAGE_SIZE;
      drawerSlice = notifications.slice(startIdx, endIdx);
    }
  }

  // 🚦 Button display logic
  // How many notifications are currently displayed (preview + drawer)
  const shownCount = drawerOpen
    ? Math.min(
        DEFAULT_COUNT +
          (drawerPage === 1
            ? drawerSlice.length
            : DRAWER_FIRST_PAGE_COUNT + (drawerPage - 1) * DRAWER_PAGE_SIZE),
        totalNotifications
      )
    : Math.min(DEFAULT_COUNT, totalNotifications);

  // Are there more notifications left after the current drawer?
  const moreToShow = drawerOpen
    ? shownCount < totalNotifications
    : totalNotifications > DEFAULT_COUNT;

  // 🟧 Helper: should the "See More" be shown at all?
  const canSeeMore = !drawerOpen && totalNotifications > DEFAULT_COUNT;

  // 🟫 Open content button logic
  const shouldShowButton = (notif) => Boolean(notif.link) && notif.type !== 'newUserRegistration';

  // --- RENDER ---
  return (
    <div className="container-style flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-4 lg:p-8 mt-10">
      {/* 📰 Header */}
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

      {/* 1️⃣ Preview notifications */}
      <div className="flex flex-col items-center gap-3 mb-4 w-full">
        {topPreview.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No notifications yet.</div>
        ) : (
          topPreview.map((notif, idx) => (
            <div key={notif.notification_id} className={notificationCardClasses(notif)}>
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
                        // This doesn't navigate for now; wire up later as needed!
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

      {/* 2️⃣ Bottom controls */}
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
              👇 See More
            </button>
          )}
          <div className="flex-1" />
          <button
            className="btn-outline-primary btn-sm"
            onClick={() => router.push(`/${userRole}/notifications`)}
          >
            🗂️ See All Notifications
          </button>
        </div>
      )}

      {/* 3️⃣ Drawer, paginated with buttons not Pagination component */}
      {drawerOpen && (
        <div className="w-full transition-all duration-700">
          <div className="flex flex-col items-center gap-3 mb-4">
            {drawerSlice.length === 0 ? (
              <div className="text-center text-gray-400 py-4">No additional notifications.</div>
            ) : (
              drawerSlice.map((notif, idx) => (
                <div
                  key={notif.notification_id}
                  ref={idx === 0 ? firstDrawerRef : null}
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
                          <button className="btn-primary btn-sm w-fit">Open Content</button>
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

          {/* 4️⃣ Drawer bottom bar: buttons + count */}
          <div className="flex flex-row w-full max-w-xl items-center my-4 gap-2 justify-between">
            {moreToShow && (
              <button
                className="btn-primary"
                onClick={() => {
                  setDrawerPage((prev) => prev + 1);
                  setScrollToNew(true);
                }}
              >
                👇 View next 10
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={() => {
                setDrawerOpen(false);
                setDrawerPage(1);
                setScrollToNew(false);
              }}
            >
              ⬆️ See Less
            </button>
            <button
              className="btn-outline-primary"
              onClick={() => router.push(`/${userRole}/notifications`)}
            >
              🗂️ See All Notifications
            </button>
          </div>

          {/* 5️⃣ Notification range count */}
          <div className="w-full max-w-xl flex justify-center text-sm mt-1 mb-4">
            {drawerOpen && (
              <>
                Showing 1–{shownCount} of {totalNotifications} notifications
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
