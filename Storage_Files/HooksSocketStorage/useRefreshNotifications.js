/**
 *   ========== useRefreshNotifications.js ==========
 * 🔄
 * Handy hook to request notifications refresh (for this user only!)
 * - Emits 'refresh_notifications' over socket to current session.
 * - Use anywhere you want to trigger a "pull" refresh.
 * ================================================
 */
import logger from '@/lib/core/logger';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function useRefreshNotifications() {
  // 🟢 Grab the socket-based refresh emitter (scoped to this user!)
  const { requestNotificationsRefresh } = useSocketHub();

  // 🟣 Call this to trigger a refresh_notifications event for THIS user
  const refreshNotifications = () => {
    logger.log('refresh Notifications called!');
    requestNotificationsRefresh(); // Only this socket/user!
  };

  return { refreshNotifications };
}
