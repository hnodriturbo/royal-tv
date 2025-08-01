/**
 *   ========== RefreshNotificationsButton.js ==========
 * 🔄
 * Manual “pull” refresh for THIS user’s notifications.
 * - Uses the same hook your NotificationCenter uses.
 * ================================================
 */
'use client';

import { useSession } from 'next-auth/react';
import useNotifications from '@/hooks/socket/useNotifications';

export default function RefreshNotificationsButton({ userId: userIdProp }) {
  const { data: session } = useSession();
  const userId = userIdProp || session?.user?.user_id;

  const { refreshNotifications, loading } = useNotifications(userId);

  return (
    <button
      onClick={() => refreshNotifications()}
      disabled={loading}
      className="btn-outline-secondary btn-sm flex items-center gap-1"
    >
      {loading ? (
        <>
          <span className="animate-spin">⟳</span> Refreshing...
        </>
      ) : (
        <>⟳ Refresh</>
      )}
    </button>
  );
}
