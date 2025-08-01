/**
 *   ===================== NotificationCenter.js =====================
 * 🔔
 * NOTIFICATION CENTER – Socket-only, smooth preview/drawer, client-slicing!
 * - Preview top 3, then paginated drawer (7 first, then 10 per "next").
 * - Never fetches via Axios; all state lives in-memory (from socket).
 * - All UI slicing, counting, and expansion handled on the client.
 * ===================================================================
 */

'use client';

import { useRef, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import RefreshNotificationsButton from 'backup_files/Socket_Backup_Files/RefreshNotificationsButton';
/* import useRefreshNotifications from '@/hooks/socket/useRefreshNotifications'; */
import useNotifications from '@/hooks/socket/storage/useNotifications';
import { useRouter } from 'next/navigation';

const DEFAULT_COUNT = 3; // 👑 Preview at top
const DRAWER_FIRST_PAGE_COUNT = 7; // 📄 First batch after preview
const DRAWER_PAGE_SIZE = 10; // 🔢 Next batch size

const notificationCardClasses = (notif) =>
  `w-4/5 mx-auto mb-2 rounded-xl shadow transition-all
     flex flex-col justify-center
     ${!notif.is_read ? 'border-l-4 border-blue-500 bg-gradient-to-r from-blue-950/50 via-gray-900 to-gray-900' : 'bg-gray-900/70'}`;

export default function NotificationCenter({ userRole = 'user' }) {
  // 🟣 Get user session for ID (used in useNotifications)
  const { data: session } = useSession();
  const userId = session?.user?.user_id;

  // 🟩 Get notifications and helpers from socket-driven hook
  const {
    notifications,
    unreadCount,
    markAsRead,
    getPreview,
    getDrawerSlice,
    resortNotifications,
    refreshNotifications
  } = useNotifications(userId);

  /* const { requestRefresh: refreshNotifications } = useRefreshNotifications(userId); */
  // 🟠 UI state for drawer and expanded notifications
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPage, setDrawerPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState({});
  const [visibleDrawerCount, setVisibleDrawerCount] = useState(0); // 🔢 How many in the drawer are revealed
  const prevDrawerPageRef = useRef(1); // 🔁 Used to know if page changed

  // 🟡 Only fetch notifications once per user session!
  /* const alreadyFetchedRef = useRef(false); */
  const router = useRouter();

  /*   // ✅ Clean and simple one-time fetch logic (socketHub already ensures no infinite loop!)
  useEffect(() => {
    if (userId) refreshNotifications();
  }, [userId, refreshNotifications]); */

  // 🟨 Client-side slicing for preview at top
  const topPreview = getPreview(DEFAULT_COUNT);

  // Gather all batches for the drawer
  let drawerSlice = [];
  if (drawerOpen) {
    let startIdx = DEFAULT_COUNT;
    let endIdx = DEFAULT_COUNT;
    if (drawerPage === 1) {
      endIdx += DRAWER_FIRST_PAGE_COUNT;
    } else if (drawerPage > 1) {
      endIdx += DRAWER_FIRST_PAGE_COUNT + (drawerPage - 1) * DRAWER_PAGE_SIZE;
    }
    drawerSlice = getDrawerSlice(startIdx, endIdx);
  }
  // 🟣 Gradual reveal: animate in new notifications
  useEffect(() => {
    // Only animate if the drawer is open and the page has changed
    if (drawerOpen && drawerPage !== prevDrawerPageRef.current) {
      let start = visibleDrawerCount;
      let end = drawerSlice.length;
      let diff = end - start;
      if (diff <= 0) return;

      // Animation duration per notification (adjust as needed)
      const totalDuration = 1500; // 1.5 seconds
      const perNotification = totalDuration / diff;

      let i = start;
      const interval = setInterval(() => {
        setVisibleDrawerCount((count) => {
          if (count < end) return count + 1;
          clearInterval(interval);
          return count;
        });
        i++;
        if (i >= end) {
          clearInterval(interval);
        }
      }, perNotification);

      prevDrawerPageRef.current = drawerPage;

      return () => clearInterval(interval);
    } else if (!drawerOpen) {
      // Reset on close
      setVisibleDrawerCount(0);
      prevDrawerPageRef.current = 1;
    }
  }, [drawerOpen, drawerPage, drawerSlice.length]);

  // 🟫 Total notification count
  const totalNotifications = notifications.length;

  // 🟪 How many notifications are currently shown (preview + drawer)
  const shownCount = drawerOpen
    ? Math.min(
        DEFAULT_COUNT +
          (drawerPage === 1
            ? drawerSlice.length
            : DRAWER_FIRST_PAGE_COUNT + (drawerPage - 1) * DRAWER_PAGE_SIZE),
        totalNotifications
      )
    : Math.min(DEFAULT_COUNT, totalNotifications);

  useEffect(() => {
    if (drawerOpen && drawerPage === 1) {
      setVisibleDrawerCount(drawerSlice.length);
      prevDrawerPageRef.current = 1;
    }
  }, [drawerOpen, drawerPage, drawerSlice.length]);

  // 🟧 Are there more notifications left after the current drawer?
  const moreToShow = drawerOpen
    ? shownCount < totalNotifications
    : totalNotifications > DEFAULT_COUNT;

  // 🟨 Helper: should the "See More" be shown at all?
  const canSeeMore = !drawerOpen && totalNotifications > DEFAULT_COUNT;

  // 🟫 Helper: should we show the Open Content button?
  // Only exclude for user, not admin
  const shouldShowButton = (notif) => {
    if (userRole === 'admin') return Boolean(notif.link); // Admin: show if link exists, period.
    return Boolean(notif.link) && notif.type !== 'newUserRegistration'; // User: never show for registration
  };

  // 🟦 Expand/collapse logic, plus marking as read (optimistic)
  const toggleExpanded = (id, notif) => {
    // 🟢 If opening an unread notification, mark as read in socket backend (and local state)
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

  // --- RENDER ---
  return (
    <div className="container-style flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-4 lg:p-8">
      {/* 📰 Header: Title + unread badge + refresh button */}
      <div className="flex justify-between items-center w-full mb-6 max-w-xl">
        <h2 className="text-2xl sm:text-3xl font-bold flex items-center">
          🔔 Notifications
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-sm ml-2">
              {unreadCount}
            </span>
          )}
        </h2>
        {/* 🔄 Manual refresh via socket (handled in button/hook) */}
        <RefreshNotificationsButton userId={userId} />
      </div>
      <hr className="border border-gray-600 w-11/12 max-w-xl mb-6" />

      {/* 1️⃣ Preview notifications */}
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
                  {/* 🟦 Dot for unread */}
                  {!notif.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                  {/* 🟦 Title text, left-aligned, large */}
                  <span className="text-md">{notif.title}</span>
                </div>
                {/* ➕/➖ Icon to right */}
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

      {/* 3️⃣ Drawer, paginated with buttons (not Pagination component) */}
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
                      {/* 🟦 Dot for unread */}
                      {!notif.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                      {/* 🟦 Title text, left-aligned, large */}
                      <span className="text-md">{notif.title}</span>
                    </div>
                    {/* ➕/➖ Icon to right */}
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
              <button
                className="btn-primary"
                onClick={() => {
                  setDrawerPage((prev) => prev + 1);
                }}
              >
                👇 View next batch
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
