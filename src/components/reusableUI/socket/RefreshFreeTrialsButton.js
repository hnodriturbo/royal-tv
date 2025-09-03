// components/reusableUI/socket/RefreshFreeTrialsButton.js
// 🔁 RefreshFreeTrialsButton.js — translate button text

'use client';

import { useSession } from 'next-auth/react';
/* import useFreeTrials from '@/hooks/socket/useFreeTrialStatus'; */
import useFreeTrialStatus from '@/hooks/socket/useFreeTrialStatus';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

const RefreshFreeTrialStatusButton = () => {
  const { data: session } = useSession();
  const userId = session?.user?.user_id;
  /* const { refreshFreeTrialStatus } = useFreeTrialStatus(userId); */
  const { refreshStatus } = useFreeTrialStatus(userId);
  const [loading, setLoading] = useState(false);
  const t = useTranslations(); // 🌍

  const handleRefreshClick = () => {
    setLoading(true);
    /* refreshFreeTrialStatus(); */
    refreshStatus();
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <button type="button" onClick={handleRefreshClick}>
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
};

export default RefreshFreeTrialStatusButton;
