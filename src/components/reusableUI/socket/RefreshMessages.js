/**
 *   ======================== RefreshMessages.js ========================
 * 🔄 Reusable "Refresh Chat Messages" button for a live chat room
 * - Translated via useTranslations() 🌍
 * - Emits socket refresh for provided conversation_id
 * =====================================================================
 */
'use client';

import { useEffect } from 'react';
import useRefreshMessages from '@/hooks/socket/useRefreshMessages';
import { useTranslations } from 'next-intl'; // 🌍 i18n root translator

const RefreshMessages = ({ conversation_id, onRefreshed }) => {
  const t = useTranslations(); // 🌍 translation hook

  // 🧠 Get refresh triggers for this room
  const { requestRefresh, onRefreshed: onRefreshedHook } = useRefreshMessages(conversation_id);

  // 👂 Wire optional callback to the socket "refreshed" event
  useEffect(() => {
    if (!onRefreshed) return; // 🙅 Skip if no callback given
    const stopListening = onRefreshedHook(onRefreshed);
    return () => stopListening(); // 🧼 Cleanup on unmount
  }, [onRefreshed, onRefreshedHook]);

  // 🖱️ Render translated button
  return (
    <button type="button" onClick={requestRefresh}>
      {String(t('socket.ui.refresh_messages.button_text') ?? '')}
    </button>
  );
};

export default RefreshMessages;
