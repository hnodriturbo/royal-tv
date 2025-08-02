/**
 *   ======================== RefreshSocket.js ========================
 * 🔄
 * HEADLINE: Refresh Chat Messages Button
 * - Reusable refresh button for any live chat room.
 * =====================================================================
 */

'use client';

import { useEffect } from 'react';
import useRefreshMessages from '@/hooks/socket/useRefreshMessages';

const RefreshMessages = ({ conversation_id, onRefreshed }) => {
  // 1️⃣ Use Refresh Logic for this room
  const { requestRefresh, onRefreshed: onRefreshedHook } = useRefreshMessages(conversation_id);

  // 2️⃣ Use useEffect to listen for refreshed message if callback is provided
  useEffect(() => {
    if (!onRefreshed) return;
    const stop = onRefreshedHook(onRefreshed);
    return () => stop();
  }, [onRefreshed, onRefreshedHook]);

  // 3️⃣ Render button
  return (
    <button onClick={requestRefresh} className="btn-secondary" title="Refresh messages">
      🔃 Refresh Messages
    </button>
  );
};
export default RefreshMessages;
