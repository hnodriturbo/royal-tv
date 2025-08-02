// components/reusableUI/socket/RefreshFreeTrialsButton.js
'use client';
import { useSession } from 'next-auth/react';
import useFreeTrials from '@/hooks/socket/useFreeTrials';
import { useState } from 'react';

const RefreshFreeTrialStatusButton = () => {
  const { data: session } = useSession();
  const userId = session?.user?.user_id;
  const { refreshFreeTrialStatus } = useFreeTrials(userId);
  const [loading, setLoading] = useState(false);

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
          <span className="animate-spin">⟳</span> Refreshing...
        </>
      ) : (
        <>⟳ Refresh</>
      )}
    </button>
  );
};

export default RefreshFreeTrialStatusButton;
