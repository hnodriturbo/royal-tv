/**
 *   ========== useRefreshNotifications.js ==========
 * 🔄
 * Bulletproof hook for manually refreshing notifications via socket.
 * - Emits refresh (or fetch) event for latest notifications.
 * - Displays a "refreshed!" message after completion.
 * - Can be used ANYWHERE in your app—NotificationCenter, buttons, etc.
 * =================================================
 */

import { useCallback, useState } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';
import useAppHandlers from '@/hooks/useAppHandlers'; // For displayMessage

export default function useRefreshNotifications(user_id) {
  // 1️⃣ UI state for showing spinner/disable
  const [loading, setLoading] = useState(false);

  // 2️⃣ SocketHub: correct refresh function, and notification event
  const { refreshNotifications, onNotificationsUpdate } = useSocketHub();
  const { displayMessage } = useAppHandlers();

  // 3️⃣ Wrapped refresh function (useCallback)
  const refresh = useCallback(() => {
    if (!user_id) return;
    setLoading(true);

    // Emit to backend—triggers notifications_list event
    refreshNotifications(user_id);

    // Listen for the next notifications update, then show message & stop loading
    // Only triggers ONCE per refresh
    const stop = onNotificationsUpdate(() => {
      setLoading(false);
      displayMessage('🔄 All notifications refreshed!');
      stop(); // Unsubscribe after first update
    });
  }, [user_id, refreshNotifications, onNotificationsUpdate, displayMessage]);

  return {
    refreshNotifications: refresh, // Call this to refresh (e.g., after REST or via button)
    loading
  };
}
