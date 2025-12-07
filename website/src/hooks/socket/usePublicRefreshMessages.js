/**
 *   ========== usePublicRefreshMessages.js ==========
 * 🔄 Request/receive full message refresh for a public conversation.
 */
import { useCallback } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function usePublicRefreshMessages(public_conversation_id) {
  const { refreshPublicMessages, listen } = useSocketHub();

  const requestRefresh = useCallback(() => {
    if (!public_conversation_id) {
      console.warn('[usePublicRefreshMessages] No public_conversation_id, skipping refresh');
      return;
    }
    refreshPublicMessages(public_conversation_id);
  }, [public_conversation_id, refreshPublicMessages]);

  const listenForRefresh = useCallback(
    (handler) =>
      listen('public_message:refreshed', (data) => {
        if (
          data.public_conversation_id === public_conversation_id &&
          Array.isArray(data.messages)
        ) {
          handler(data.messages);
        }
      }),
    [public_conversation_id, listen]
  );

  return { requestRefresh, onRefreshed: listenForRefresh };
}
