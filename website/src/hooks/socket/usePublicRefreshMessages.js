/**
 *   ========== usePublicRefreshMessages.js ==========
 * 🔄 Request/receive full message refresh for a public conversation.
 */
import { useCallback } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function usePublicRefreshMessages(public_conversation_id) {
  const { guardedEmit, guardedListen } = useSocketHub();

  const requestRefresh = useCallback(() => {
    guardedEmit('public_message:refresh', { public_conversation_id });
  }, [public_conversation_id, guardedEmit]);

  const listenForRefresh = useCallback(
    (handler) =>
      guardedListen('public_message:refreshed', (data) => {
        if (
          data.public_conversation_id === public_conversation_id &&
          Array.isArray(data.messages)
        ) {
          handler(data.messages);
        }
      }),
    [public_conversation_id, guardedListen]
  );

  return { requestRefresh, onRefreshed: listenForRefresh };
}
