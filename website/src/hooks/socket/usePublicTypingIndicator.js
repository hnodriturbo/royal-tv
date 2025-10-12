/**
<<<<<<< HEAD
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
=======
 * ============== usePublicTypingIndicator (client) ==============
 * ⌨️ Typing indicator for a public room (remote + local)
 * --------------------------------------------------------------
 * Args:
 *   • public_conversation_id: string
 *
 * Returns:
 *   • isSomeoneTyping: boolean
 *   • typingUserInfo: { name, role, user_id?, public_identity_id? } | null
 *   • isTypingLocal: boolean
 *   • handleInputChange(e): string
 *   • handleInputFocus()
 *   • handleInputBlur()
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function usePublicTypingIndicator(public_conversation_id) {
  // 👀 Remote typing state
  const [isSomeoneTyping, setIsSomeoneTyping] = useState(false);
  const [typingUserInfo, setTypingUserInfo] = useState(null);

  // 🙋 Local typing state
  const [isTypingLocal, setIsTypingLocal] = useState(false);
  const typingTimeoutRef = useRef();

  // 🛰️ Hub methods for public typing
  const { sendPublicTypingStatus, onPublicTyping } = useSocketHub();

  // 👂 Others typing in this room
  useEffect(() => {
    if (!public_conversation_id) return; // 🛡️ Guard
    const stop = onPublicTyping((payload) => {
      if (payload.public_conversation_id !== public_conversation_id) return;
      if (payload.isTyping) {
        setIsSomeoneTyping(true);
        setTypingUserInfo({
          name: payload.name,
          role: payload.role,
          user_id: payload.user_id,
          public_identity_id: payload.public_identity_id
        });
      } else {
        setIsSomeoneTyping(false);
        setTypingUserInfo(null);
      }
    });
    return () => stop();
  }, [public_conversation_id, onPublicTyping]);

  // 🖊️ Input change = start typing + debounce end
  const handleInputChange = useCallback(
    (event) => {
      if (!public_conversation_id) return event?.target?.value ?? '';
      setIsTypingLocal(true);
      sendPublicTypingStatus(public_conversation_id, true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTypingLocal(false);
        sendPublicTypingStatus(public_conversation_id, false);
      }, 1200);
      return event?.target?.value ?? '';
    },
    [public_conversation_id, sendPublicTypingStatus]
  );

  // 👆 Focus = begin typing signal
  const handleInputFocus = useCallback(() => {
    if (!public_conversation_id) return;
    setIsTypingLocal(true);
    sendPublicTypingStatus(public_conversation_id, true);
  }, [public_conversation_id, sendPublicTypingStatus]);

  // 👋 Blur = stop typing signal
  const handleInputBlur = useCallback(() => {
    if (!public_conversation_id) return;
    setIsTypingLocal(false);
    sendPublicTypingStatus(public_conversation_id, false);
  }, [public_conversation_id, sendPublicTypingStatus]);

  return {
    isSomeoneTyping,
    typingUserInfo,
    isTypingLocal,
    handleInputChange,
    handleInputFocus,
    handleInputBlur
  };
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef
}
