/**
 *   ========== RefreshNotificationsButton.js ==========
 * 🔄
 * Manual refresh button for notifications.
 * - Calls requestRefresh() when clicked.
 * - Shows loading state while refreshing.
 * ===============================================
 */
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import useRefreshNotifications from '@/hooks/socket/storage/useRefreshNotifications';

const RefreshNotificationsButton = () => {
  // 👤 Grab current user's session
  const { data: session } = useSession();
  const userId = session?.user?.user_id;

  // 🎛️ Grab refresh hook logic
  const { requestRefresh } = useRefreshNotifications(userId);
  const [loading, setLoading] = useState(false);

  // 🟢 Handle refresh click
  const handleRefreshClick = () => {
    setLoading(true);
    requestRefresh();
    setTimeout(() => setLoading(false), 1000); // Simple fake loading spinner effect
  };

  return (
    <button
      onClick={handleRefreshClick}
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
};

export default RefreshNotificationsButton;
