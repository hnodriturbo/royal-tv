// RefreshFreeTrialsButton.js — translate button text
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

import useFreeTrialStatus from '@/hooks/socket/useFreeTrialStatus';

const RefreshFreeTrialStatusButton = () => {
  const { data: session } = useSession();
  const userId = session?.user?.user_id;
  const { refreshStatus } = useFreeTrialStatus(userId);
  const [loading, setLoading] = useState(false);
  const t = useTranslations();

  const handleRefreshClick = () => {
    setLoading(true);
    refreshStatus();
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <button type="button" onClick={handleRefreshClick} aria-busy={loading}>
      {loading ? (
        <>
          <span className="animate-spin" aria-hidden>
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
