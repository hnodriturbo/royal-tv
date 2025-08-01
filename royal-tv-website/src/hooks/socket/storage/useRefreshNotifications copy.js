/**
 *   ========== useRefreshNotifications.js ==========
 * 🔄
 * Triggers a refresh of all notifications for the current user (via socket emit).
 * - No socketConnected logic needed—handled by useSocketHub!
 * - Used for manual refresh actions (refresh button, etc).
 * ================================================
 */

import logger from '@/lib/logger';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function useRefreshNotifications(userId) {
  // 🎛️ Get guarded socket emit for notifications
  const { requestNotifications } = useSocketHub();

  // 🔄 Manual refresh trigger (call this to refresh!)
  function requestRefresh() {
    // 🟢 [LOG] User manually requested notification refresh
    if (!userId) {
      logger.warn('⚠️ [REFRESH BUTTON] No userId found, skipping refresh.');
      return;
    }
    requestNotifications(userId);
  }

  return { requestRefresh };
}
