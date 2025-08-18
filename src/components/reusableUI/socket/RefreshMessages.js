/**
 *   ======================== RefreshMessages.js ========================
 * 🔄 Reusable "Refresh Chat Messages" button for a live chat room
 * - Translated via useTRoot() 🌍
 * - Emits socket refresh for provided conversation_id
 * =====================================================================
 */
'use client';

import { useEffect } from 'react';
import useRefreshMessages from '@/hooks/socket/useRefreshMessages';
import { useTRoot } from '@/lib/i18n/client'; // 🌍 i18n root translator

const RefreshMessages = ({ conversation_id, onRefreshed }) => {
  const t = useTRoot(); // 🌍 translation hook

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
    <button
      onClick={requestRefresh}
      className="btn-secondary"
      title={t('socket.ui.refresh_messages.button_title')} // 🏷️ Tooltip text
    >
      {t('socket.ui.refresh_messages.button_text')}
      {/* 🏷️ Button label */}
    </button>
  );
};

export default RefreshMessages;
