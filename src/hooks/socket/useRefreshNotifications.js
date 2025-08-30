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
import { useTranslations, useLocale } from 'next-intl'; // 🌐 i18n for user-facing text

export default function useRefreshNotifications(user_id) {
  const [loading, setLoading] = useState(false);
  const { refreshNotifications, onNotificationsList } = useSocketHub();
  const { displayMessage } = useAppHandlers();
  const t = useTranslations(); // 🎯 Get translator

  const refresh = useCallback(() => {
    if (!user_id) return;
    setLoading(true);

    refreshNotifications(user_id);

    const stop = onNotificationsList(() => {
      setLoading(false);
      displayMessage(
        t('socket.hooks.useRefreshNotifications.all_notifications_refreshed') // 🌐 Translated message
      );
      stop();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user_id, refreshNotifications, onNotificationsList, displayMessage]);

  return {
    refreshNotifications: refresh,
    loading
  };
}
