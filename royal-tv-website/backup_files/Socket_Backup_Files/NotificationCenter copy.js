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
import { useRouter } from 'next/navigation';

const PREVIEW_COUNT = 3; // 👑 First 3 shown always
const FIRST_DRAWER_COUNT = 7; // 📄 First batch after preview
const DRAWER_PAGE_SIZE = 10; // 🔢 Each "See More" after that

const notificationCardClasses = (notif) =>
  `w-4/5 mx-auto mb-2 rounded-xl shadow transition-all
     flex flex-col justify-center
     ${!notif.is_read ? 'border-l-4 border-blue-500 bg-gradient-to-r from-blue-950/50 via-gray-900 to-gray-900' : 'bg-gray-900/70'}`;

export default function NotificationCenter({ userRole = 'user' }) {
  // 🟢 Get user_id from session
  const { data: session } = useSession();
  const user_id = session?.user?.user_id;
  const router = useRouter();

  // 🟢 Get notifications and helpers from socket-driven hook
  const {
    notifications,
    unreadCount,
    markAsRead,
    getPreview,
    getDrawerSlice,
    resortNotifications,
    refreshNotifications,
    loading: notificationsLoading
  } = useNotifications(user_id);

  // --- UI STATE ---
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPage, setDrawerPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState({});
  const [visibleDrawerCount, setVisibleDrawerCount] = useState(0);
  const prevDrawerPageRef = useRef(1);

  // --- Client-side slicing ---
  const topPreview = getPreview(PREVIEW_COUNT);

  // Compute the notifications to show in the drawer
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

  // --- Animate gradual reveal in drawer on "See More" ---
  useEffect(() => {
    if (drawerOpen && drawerPage !== prevDrawerPageRef.current) {
      let start = visibleDrawerCount;
      let end = drawerSlice.length;
      let diff = end - start;
      if (diff <= 0) return;

      const totalDuration = 1500; // 1.5s total animation for new batch
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

  // When opening the drawer for the first time, instantly show all in the batch
  useEffect(() => {
    if (drawerOpen && drawerPage === 1) {
      setVisibleDrawerCount(drawerSlice.length);
      prevDrawerPageRef.current = 1;
    }
  }, [drawerOpen, drawerPage, drawerSlice.length]);

  // --- Count logic for pagination and "See More" ---
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

  // --- Helper: only show Open Content button for appropriate notifs ---
  const shouldShowButton = (notif) => {
    if (userRole === 'admin') return Boolean(notif.link);
    return Boolean(notif.link) && notif.type !== 'newUserRegistration';
  };

  // --- Expand/collapse + mark as read logic ---
  const toggleExpanded = (id, notif) => {
    // Mark as read optimistically when opening an unread notification
    if (!notif.is_read && !expandedIds[id]) {
      markAsRead(id);
      setExpandedIds((prev) => ({ ...prev, [id]: true }));
      return;
    }
    // Resort only after collapsing a read notification (700ms delay for animation)
    if (notif.is_read && expandedIds[id]) {
      setExpandedIds((prev) => ({ ...prev, [id]: false }));
      setTimeout(() => {
        resortNotifications();
      }, 700);
      return;
    }
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // --- UI render ---
  return (
    <div className="container-style flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-4 lg:p-8">
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
        <RefreshNotifications user_id={user_id} />
      </div>
      <hr className="border border-gray-600 w-11/12 max-w-xl mb-6" />

      {/* 1️⃣ Preview */}
      <div className="flex flex-col items-center gap-3 mb-4 w-full">
        {topPreview.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No notifications yet.</div>
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
                    <div className="flex flex-col sm:flex-row gap-3 mt-2">
                      <button
                        className="btn-primary btn-sm w-fit"
                        onClick={() => router.push(notif.link)}
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

      {/* 2️⃣ Bottom controls (hide when drawer open) */}
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

      {/* 3️⃣ Drawer, paginated with "See More" */}
      {drawerOpen && (
        <div className="w-full transition-all duration-700">
          <div className="flex flex-col items-center gap-3 mb-4">
            {drawerSlice.length === 0 ? (
              <div className="text-center text-gray-400 py-4">No additional notifications.</div>
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
                        <div className="flex flex-col sm:flex-row gap-3 mt-2">
                          <button
                            className="btn-primary btn-sm w-fit"
                            onClick={() => router.push(notif.link)}
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

          {/* 4️⃣ Drawer bottom bar: buttons + count */}
          <div className="flex flex-row w-full max-w-xl items-center my-4 gap-2 justify-between">
            {moreToShow && (
              <button className="btn-primary" onClick={() => setDrawerPage((prev) => prev + 1)}>
                👇 See More
              </button>
            )}
            <button
              className="btn btn-secondary"
              onClick={() => {
                setDrawerOpen(false);
                setDrawerPage(1);
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
          {/* 5️⃣ Drawer count range */}
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
