/**
 * ========== usePublicTypingIndicator (client) ==========
 * ⌨️ Track local/remote typing state for a single room.
 */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function usePublicTypingIndicator(public_conversation_id) {
  const { sendPublicTypingStatus, onPublicTyping } = useSocketHub();
  const [typingUser, setTypingUser] = useState(null);
  const localTypingRef = useRef(false);

  // 👂 Room typing broadcasts
  useEffect(() => {
    const off = onPublicTyping(({ public_conversation_id: id, user, isTyping }) => {
      if (id !== public_conversation_id) return;
      setTypingUser(isTyping ? user : null);
    });
    return off;
  }, [onPublicTyping, public_conversation_id]);

  // 🧰 Small helpers for text input focus/blur
  return useMemo(
    () => ({
      handleInputFocus: () => {
        if (!public_conversation_id || localTypingRef.current) return;
        localTypingRef.current = true;
        sendPublicTypingStatus(public_conversation_id, true);
      },
      handleInputBlur: () => {
        if (!public_conversation_id || !localTypingRef.current) return;
        localTypingRef.current = false;
        sendPublicTypingStatus(public_conversation_id, false);
      },
      isTypingLocal: () => localTypingRef.current,
      typingUser
    }),
    [public_conversation_id, typingUser, sendPublicTypingStatus]
  );
}
