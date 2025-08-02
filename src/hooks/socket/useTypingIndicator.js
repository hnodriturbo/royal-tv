/**
 * useTypingIndicator.js
 * 👀
 * Typing indicator logic for live chat only (bubble removed).
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function useTypingIndicator(conversation_id) {
  const [isTyping, setIsTyping] = useState(false); // Remote typing
  const [typingUser, setTypingUser] = useState(null); // Who is typing
  const [isTypingLocal, setIsTypingLocal] = useState(false); // You
  const typingTimeoutRef = useRef();

  const { sendTypingStatus, onTyping } = useSocketHub();

  // Listen for "user_typing" events from others
  useEffect(() => {
    if (!conversation_id) return;
    const stop = onTyping(({ conversation_id: cid, isTyping: status, name, role, user_id }) => {
      if (cid === conversation_id && status) {
        setIsTyping(true);
        setTypingUser({ name, role, user_id });
      } else if (cid === conversation_id && !status) {
        setIsTyping(false);
        setTypingUser(null);
      }
    });
    return () => stop();
  }, [conversation_id, onTyping]);

  // Handler: input change
  const handleInputChange = useCallback(
    (e) => {
      setIsTypingLocal(true);
      sendTypingStatus(conversation_id, true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTypingLocal(false);
        sendTypingStatus(conversation_id, false);
      }, 1200);
      return e.target.value;
    },
    [conversation_id, sendTypingStatus]
  );

  // Handler: input focus
  const handleInputFocus = useCallback(() => {
    setIsTypingLocal(true);
    sendTypingStatus(conversation_id, true);
  }, [conversation_id, sendTypingStatus]);

  // Handler: input blur
  const handleInputBlur = useCallback(() => {
    setIsTypingLocal(false);
    sendTypingStatus(conversation_id, false);
  }, [conversation_id, sendTypingStatus]);

  return {
    isTyping,
    typingUser,
    isTypingLocal,
    handleInputChange,
    handleInputFocus,
    handleInputBlur
  };
}
