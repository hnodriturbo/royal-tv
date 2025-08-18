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
import { useTRoot } from '@/lib/i18n/client';

export default function RefreshNotifications({ user_id: userIdProp }) {
  const { data: session } = useSession();
  const user_id = userIdProp || session?.user?.user_id;
  const { refreshNotifications, loading } = useRefreshNotifications(user_id);
  const t = useTRoot(); // 🌍

  return (
    <button
      onClick={refreshNotifications}
      disabled={loading}
      className="btn-outline-secondary btn-sm flex items-center gap-1"
    >
      {loading ? (
        <>
          <span className="animate-spin">⟳</span> {t('socket.ui.common.refreshing')}
        </>
      ) : (
        <>⟳ {t('socket.ui.common.refresh')}</>
      )}
    </button>
  );
}
