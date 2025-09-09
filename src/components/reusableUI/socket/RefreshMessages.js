/**
 * RefreshMessages.js — Reusable "Refresh Chat Messages" button
 */
'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

import useRefreshMessages from '@/hooks/socket/useRefreshMessages';

const RefreshMessages = ({ conversation_id, onRefreshed }) => {
  const t = useTranslations();
  const { requestRefresh, onRefreshed: onRefreshedHook } = useRefreshMessages(conversation_id);

  useEffect(() => {
    if (!onRefreshed) return;
    const stop = onRefreshedHook(onRefreshed);
    return () => stop();
  }, [onRefreshed, onRefreshedHook]);

  return (
    <button
      type="button"
      onClick={requestRefresh}
      aria-label={String(t('socket.ui.refresh_messages.button_text') ?? '')}
    >
      {String(t('socket.ui.refresh_messages.button_text') ?? '')}
    </button>
  );
};

export default RefreshMessages;
