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

export default function RefreshNotifications({ user_id: userIdProp }) {
  // 🟢 Use prop if provided, otherwise fallback to session user
  const { data: session } = useSession();
  const user_id = userIdProp || session?.user?.user_id;

  const { refreshNotifications, loading } = useRefreshNotifications(user_id);

  return (
    <button
      onClick={refreshNotifications}
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
