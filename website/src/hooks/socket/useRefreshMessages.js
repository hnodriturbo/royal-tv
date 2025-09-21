/**
 *   ========== useRefreshMessages.js ==========
 * 🔄 Request/receive full message refresh for a conversation.
 */
import { useCallback } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function useRefreshMessages(conversation_id) {
  const { refreshMessages, onMessagesRefreshed } = useSocketHub();

  const requestRefresh = useCallback(() => {
    refreshMessages(conversation_id);
  }, [conversation_id, refreshMessages]);

  const listenForRefresh = useCallback(
    (handler) =>
      onMessagesRefreshed((data) => {
        if (data.conversation_id === conversation_id && Array.isArray(data.messages)) {
          handler(data.messages);
        }
      }),
    [conversation_id, onMessagesRefreshed]
  );

  return { requestRefresh, onRefreshed: listenForRefresh };
}
