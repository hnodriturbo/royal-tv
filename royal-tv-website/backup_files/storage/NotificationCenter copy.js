/**
 *   ===================== NotificationCenter.js =====================
 * 🔔
 * NOTIFICATION CENTER – Role-aware, paginated, no duplicates!
 * ===================================================================
 */

'use client';

import logger from '@/lib/logger';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Pagination from '@/components/reusableUI/Pagination';
import RefreshNotificationsButton from 'backup_files/Socket_Backup_Files/RefreshNotificationsButton';
import useSocketHub from '@/hooks/socket/useSocketHub.js';
import axiosInstance from '@/lib/axiosInstance'; // 🆕 Use axiosInstance, not fetch

const DEFAULT_COUNT = 3; // Top preview count
const DRAWER_PAGE_SIZE = 7; // Next batch per drawer page

const notificationCardClasses = (notif) =>
  `container-style-sm mx-auto mb-2 rounded-2xl shadow transition
  ${!notif.is_read ? 'border-l-4 border-blue-500 bg-gradient-to-r from-blue-950/50 via-gray-900 to-gray-900' : 'bg-gray-900/70'}
  max-w-xl`;

export default function NotificationCenter({ userRole = 'user' }) {
  const { data: session } = useSession();

  // 1️⃣ Main state
  const [topNotifications, setTopNotifications] = useState([]);
  const [drawerNotifications, setDrawerNotifications] = useState([]);
  const [drawerPage, setDrawerPage] = useState(1); // Drawer page starts at 1 (never 0)
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTotal, setDrawerTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expandedIds, setExpandedIds] = useState({});

  const { listen, socket } = useSocketHub();

  // 2️⃣ API path per role
  const notificationsApiPath =
    userRole === 'admin' ? '/api/admin/notifications' : '/api/user/notifications';

  // 3️⃣ Fetch top 3 (page 0, size 3)
  const fetchTopNotifications = useCallback(async () => {
    try {
      const res = await axiosInstance.get(notificationsApiPath, {
        params: { page: 0, pageSize: DEFAULT_COUNT }
      });
      setTopNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount ?? 0);
      setDrawerTotal(res.data.total ?? 0);
    } catch (err) {
      logger.error('❌ Failed to fetch top notifications:', err);
    }
  }, [notificationsApiPath]);

  // 4️⃣ Fetch drawer notifications (page >= 1, size DRAWER_PAGE_SIZE)
  const fetchDrawerNotifications = useCallback(
    async (page = 1) => {
      try {
        const res = await axiosInstance.get(notificationsApiPath, {
          params: { page, pageSize: DRAWER_PAGE_SIZE }
        });
        setDrawerNotifications(res.data.notifications || []);
        setDrawerTotal(res.data.total ?? 0);
        setUnreadCount(res.data.unreadCount ?? 0);
      } catch (err) {
        logger.error('❌ Failed to fetch drawer notifications:', err);
      }
    },
    [notificationsApiPath]
  );

  // 5️⃣ On mount: get top notifications
  useEffect(() => {
    fetchTopNotifications();
  }, [fetchTopNotifications]);

  // 6️⃣ When opening drawer, fetch page 1 of drawer (notifications 4–13)
  useEffect(() => {
    if (drawerOpen) fetchDrawerNotifications(drawerPage);
  }, [drawerOpen, drawerPage, fetchDrawerNotifications]);

  // 7️⃣ Socket: refresh on push
  useEffect(() => {
    const stopNotif = listen?.('notification_received', () => {
      fetchTopNotifications();
      if (drawerOpen) fetchDrawerNotifications(drawerPage);
    });
    return () => stopNotif && stopNotif();
  }, [listen, fetchTopNotifications, fetchDrawerNotifications, drawerOpen, drawerPage]);

  // 8️⃣ Mark as read (by socket)
  const markAsRead = async (notification_id) => {
    if (!notification_id) return;
    try {
      socket?.emit('mark_notification_read', { notification_id });
      setTimeout(() => {
        fetchTopNotifications();
        if (drawerOpen) fetchDrawerNotifications(drawerPage);
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

  const refreshAll = () => {
    fetchTopNotifications();
    if (drawerOpen) fetchDrawerNotifications(drawerPage);
  };

  const handleDrawerPageChange = (page) => setDrawerPage(page);

  const handleSeeAll = () => {
    window.location.assign(`/${userRole}/notifications`);
  };

  const handleAction = (notif) => {
    if (notif.link) window.location.assign(notif.link);
  };

  const shouldShowButton = (notif) => Boolean(notif.link) && notif.type !== 'newUserRegistration';

  // --- Style for scrollable notification body (when open) ---
  const openBodyClass =
    'px-5 pb-2 pt-1 border-t border-gray-700 max-h-56 overflow-y-auto custom-scrollbar';

  // 🟦 Render
  return (
    <div className="container-style flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-4 lg:p-8 mt-10">
      {/* Header */}
      <div className="flex justify-between items-center w-full mb-6 max-w-xl">
        <h2 className="text-2xl sm:text-3xl font-bold flex items-center">
          🔔 Notifications
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-sm ml-2">
              {unreadCount}
            </span>
          )}
        </h2>
        <RefreshNotificationsButton onClick={refreshAll} />
      </div>
      <hr className="border border-gray-600 w-11/12 max-w-xl mb-6" />

      {/* Top notifications (always up to 3) */}
      <div className="flex flex-col items-center gap-3 mb-4 w-full">
        {topNotifications.length === 0 ? (
          <div className="text-center text-gray-400 py-8">No notifications yet.</div>
        ) : (
          topNotifications.map((notif) => (
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
                className={`overflow-hidden transition-all duration-300 ${
                  expandedIds[notif.notification_id] ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div
                  className={
                    expandedIds[notif.notification_id]
                      ? openBodyClass
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

      {/* Controls: See More / See All */}
      <div className="flex flex-col sm:flex-row justify-between items-center my-4 gap-2 w-full max-w-xl">
        {drawerTotal > DEFAULT_COUNT && (
          <button
            className="btn btn-secondary"
            onClick={() => {
              setDrawerOpen((open) => !open);
              if (!drawerOpen) setDrawerPage(1); // Always start at first drawer page when opening
            }}
          >
            {drawerOpen ? '⬆️ See Less' : `👇 See More (${drawerTotal - DEFAULT_COUNT})`}
          </button>
        )}
        <button onClick={handleSeeAll} className="btn-outline-primary btn-sm">
          🗂️ See All Notifications
        </button>
      </div>

      {/* Drawer (shows when open, paginated) */}
      <div
        className={`transition-all duration-500 w-full ${
          drawerOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        {drawerOpen && (
          <>
            <div className="flex flex-col items-center gap-3 mb-4">
              {drawerNotifications.length === 0 ? (
                <div className="text-center text-gray-400 py-4">No additional notifications.</div>
              ) : (
                drawerNotifications.map((notif) => (
                  <div key={notif.notification_id} className={notificationCardClasses(notif)}>
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
                      className={`overflow-hidden transition-all duration-300 ${
                        expandedIds[notif.notification_id] ? 'max-h-96' : 'max-h-0'
                      }`}
                    >
                      <div
                        className={
                          expandedIds[notif.notification_id]
                            ? openBodyClass
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
            {drawerTotal - DEFAULT_COUNT > DRAWER_PAGE_SIZE && (
              <div className="flex justify-center my-4">
                <Pagination
                  totalItems={drawerTotal - DEFAULT_COUNT}
                  itemsPerPage={DRAWER_PAGE_SIZE}
                  currentPage={drawerPage}
                  onPageChange={handleDrawerPageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
