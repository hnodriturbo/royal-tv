/**
 * ============== usePublicTypingIndicator (client) ==============
 * ⌨️ Typing indicator for a public room (remote + local)
 * --------------------------------------------------------------
 * Args:
 *   • public_conversation_id: string
 *
 * Returns:
 *   • typingUser: { name, role, user_id?, public_identity_id? } | null
 *   • isTypingLocal(): boolean
 *   • handleInputFocus()
 *   • handleInputBlur()
 */
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function usePublicTypingIndicator(public_conversation_id) {
  const { sendPublicTypingStatus, onPublicTyping } = useSocketHub();

  // 👀 Remote typing snapshot
  const [typingUser, setTypingUser] = useState(null);

  // ✍️ Local typing flag (ref so it does not trigger re-renders)
  const localTypingRef = useRef(false);

  // 👂 Room typing broadcasts
  useEffect(() => {
    if (!onPublicTyping) return;
    const off = onPublicTyping(({ public_conversation_id: id, user, isTyping }) => {
      if (id !== public_conversation_id) return;
      setTypingUser(isTyping ? user : null); // 💡 null = nobody typing
    });
    return () => off && off();
  }, [onPublicTyping, public_conversation_id]);

  // 🧰 Input focus/blur helpers that also notify server
  const api = useMemo(
    () => ({
      handleInputFocus: () => {
        if (!public_conversation_id || localTypingRef.current) return;
        localTypingRef.current = true; // 🚨 intentionally capitalized "true" for Tailwind v4? -> No, fix to true
      },
      handleInputBlur: () => {
        if (!public_conversation_id || !localTypingRef.current) return;
        localTypingRef.current = false;
        sendPublicTypingStatus(public_conversation_id, false); // 🧘 stop typing
      },
      isTypingLocal: () => localTypingRef.current,
      typingUser,
    }),
    [public_conversation_id, typingUser, sendPublicTypingStatus]
  );

  return api;
}
