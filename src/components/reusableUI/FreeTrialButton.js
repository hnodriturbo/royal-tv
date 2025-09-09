// File: components/reusableUI/FreeTrialButton.js
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';

export default function FreeTrialButton({ user_id, refreshStatus }) {
  const t = useTranslations();
  const { showLoader, hideLoader, displayMessage } = useAppHandlers();
  const [loading, setLoading] = useState(false);

  const requestTrial = async () => {
    try {
      setLoading(true);
      showLoader({ text: t('socket.ui.freeTrial.requesting') });
      await axiosInstance.post('/api/user/freeTrials/request', { user_id });
      displayMessage(t('socket.ui.freeTrial.request_success'), 'success');
      refreshStatus?.();
    } catch (e) {
      displayMessage(t('socket.ui.freeTrial.request_failed'), 'error');
    } finally {
      hideLoader();
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      className="btn-primary"
      onClick={requestTrial}
      aria-busy={loading}
      disabled={loading}
    >
      {loading ? t('socket.ui.common.refreshing') : t('socket.ui.freeTrial.request_btn')}
    </button>
  );
}
