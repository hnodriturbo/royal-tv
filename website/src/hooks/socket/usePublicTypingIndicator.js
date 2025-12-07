/**
 * usePublicTypingIndicator.js
 * 👀 Typing indicator for public live chat (mirrors useTypingIndicator.js)
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function usePublicTypingIndicator(public_conversation_id) {
  const [isTyping, setIsTyping] = useState(false); // Remote typing
  const [typingUser, setTypingUser] = useState(null); // Who is typing
  const [isTypingLocal, setIsTypingLocal] = useState(false); // You
  const typingTimeoutRef = useRef();

  const { sendPublicTypingStatus, onPublicTypingStatus } = useSocketHub();

  // Listen for "public_message:user_typing" events from others
  useEffect(() => {
    if (!public_conversation_id) return;
    const stop = onPublicTypingStatus('public_message:user_typing', (data) => {
      if (data.public_conversation_id === public_conversation_id) {
        if (data.isTyping) {
          setIsTyping(true);
          setTypingUser(data.user);
        } else {
          setIsTyping(false);
          setTypingUser(null);
        }
      }
    });
    return () => stop();
  }, [public_conversation_id, onPublicTypingStatus]);

  // Handler: input change
  const handleInputChange = useCallback(
    (e) => {
      setIsTypingLocal(true);
      sendPublicTypingStatus(public_conversation_id, true);
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTypingLocal(false);
        sendPublicTypingStatus(public_conversation_id, false);
      }, 1200);
      return e.target.value;
    },
    [public_conversation_id, sendPublicTypingStatus]
  );

  // Handler: input focus
  const handleInputFocus = useCallback(() => {
    setIsTypingLocal(true);
    sendPublicTypingStatus(public_conversation_id, true);
  }, [public_conversation_id, sendPublicTypingStatus]);

  // Handler: input blur
  const handleInputBlur = useCallback(() => {
    setIsTypingLocal(false);
    sendPublicTypingStatus(public_conversation_id, false);
  }, [public_conversation_id, sendPublicTypingStatus]);

  return {
    isTyping,
    typingUser,
    isTypingLocal,
    handleInputChange,
    handleInputFocus,
    handleInputBlur
  };
}
