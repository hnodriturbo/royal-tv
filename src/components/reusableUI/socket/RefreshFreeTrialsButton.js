// components/reusableUI/socket/RefreshFreeTrialsButton.js
// 🔁 RefreshFreeTrialsButton.js — translate button text

'use client';

import { useSession } from 'next-auth/react';
import useFreeTrials from '@/hooks/socket/useFreeTrials';
import { useState } from 'react';
import { useTRoot } from '@/lib/i18n/client';

const RefreshFreeTrialStatusButton = () => {
  const { data: session } = useSession();
  const userId = session?.user?.user_id;
  const { refreshFreeTrialStatus } = useFreeTrials(userId);
  const [loading, setLoading] = useState(false);
  const t = useTRoot(); // 🌍

  const handleRefreshClick = () => {
    setLoading(true);
    refreshFreeTrialStatus();
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <button
      onClick={handleRefreshClick}
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
};

export default RefreshFreeTrialStatusButton;
