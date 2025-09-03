/**
 *   ========== RefreshNotifications.js ==========
 * 🔄
 * Loader button to refresh notifications for the current user.
 * - Uses useRefreshNotifications for bulletproof refresh + message.
 * - Works anywhere (client or dashboard), auto-detects user from session if not provided.
 * =================================================
 */
'use client';

import { useSession } from 'next-auth/react';
import useRefreshNotifications from '@/hooks/socket/useRefreshNotifications';
import { useTranslations } from 'next-intl';

export default function RefreshNotifications({ user_id: userIdProp }) {
  const { data: session } = useSession();
  const user_id = userIdProp || session?.user?.user_id;
  const { refreshNotifications, loading } = useRefreshNotifications(user_id);
  const t = useTranslations(); // 🌍

  return (
    <button type="button" onClick={RefreshNotifications}>
      {loading ? (
        <>
          <span className="animate-spin" aria-hidden="true">
            ⟳
          </span>{' '}
          {String(t('socket.ui.common.refreshing') ?? '')}
        </>
      ) : (
        <>⟳ {String(t('socket.ui.common.refresh') ?? '')}</>
      )}
    </button>
  );
}
