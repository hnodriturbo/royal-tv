/**
 *   ========== useRefreshMessages.js ==========
 * 🔄
 * Simple, focused hook for requesting and receiving full message refresh
 * in any chat room (admin/user).
 * ============================================
 * USAGE:
 *   const { requestRefresh, onRefreshed } = useRefreshMessages(conversation_id);
 */

import { useCallback } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function useRefreshMessages(conversation_id) {
  const { refreshMessages, onMessagesRefreshed } = useSocketHub();

  // 🟩 Emit request (call the server) to refresh messages for this conversation
  const requestRefresh = useCallback(() => {
    refreshMessages('live', conversation_id);
  }, [conversation_id, refreshMessages]);

  // 🟦 Listen for refreshed messages for this convo
  const listenForRefresh = useCallback(
    (handler) =>
      onMessagesRefreshed((data) => {
        if (
          data.conversation_id === conversation_id &&
          data.chatType === 'live' &&
          Array.isArray(data.messages)
        ) {
          handler(data.messages);
        }
      }),
    [conversation_id, onMessagesRefreshed]
  );

  return {
    requestRefresh,
    onRefreshed: listenForRefresh // always call this in a useEffect!
  };
}
