'use client';

/**
 * usePublicTypingIndicator.js
 * 👀 Typing indicator for public live chat (mirrors useTypingIndicator.js)
 */
import { useEffect, useState, useRef, useCallback } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function usePublicTypingIndicator(public_conversation_id) {
  const [isTyping, setIsTyping] = useState(false); // 👥 Remote typing flag
  const [typingUser, setTypingUser] = useState(null); // 🧑‍💬 Remote typist identity
  const [isTypingLocal, setIsTypingLocal] = useState(false); // 🫵 Local typing flag
  const typingTimeoutRef = useRef(null); // ⏲️ Debounce timer handle

  const { sendPublicTypingStatus, onPublicTypingStatus } = useSocketHub(); // 📡 Socket helpers

  // 👂 Listen for public typing events (server emits: { public_conversation_id, user, isTyping })
  useEffect(() => {
    if (!public_conversation_id) return; // 🧭 No room, no listener

    const stop = onPublicTypingStatus((payload) => {
      const eventPublicConversationId = payload?.public_conversation_id; // 🏷️ Room from event
      if (eventPublicConversationId !== public_conversation_id) return; // 🚪 Ignore other rooms

      const remoteIsTyping = Boolean(payload?.isTyping); // ✅ Normalize
      if (remoteIsTyping) {
        setIsTyping(true); // ✅ Show remote typing
        setTypingUser(payload?.user || null); // 🧑‍💬 Save remote identity
        return;
      }

      setIsTyping(false); // 🛑 Hide remote typing
      setTypingUser(null); // 🧹 Clear identity
    });

    return () => stop?.(); // 🧼 Unsubscribe
  }, [public_conversation_id, onPublicTypingStatus]);

  // ⌨️ Input change → emit typing true + debounce typing false
  const handleInputChange = useCallback(
    (event) => {
      setIsTypingLocal(true); // 🫵 Local typing on
      sendPublicTypingStatus(public_conversation_id, true); // 📡 Broadcast start

      clearTimeout(typingTimeoutRef.current); // 🧯 Reset timer
      typingTimeoutRef.current = setTimeout(() => {
        setIsTypingLocal(false); // 🛑 Local typing off
        sendPublicTypingStatus(public_conversation_id, false); // 📡 Broadcast stop
      }, 1200);

      return event.target.value; // 🧾 Keep your current pattern
    },
    [public_conversation_id, sendPublicTypingStatus]
  );

  // 🎯 Focus → typing true
  const handleInputFocus = useCallback(() => {
    setIsTypingLocal(true); // 🫵 Local typing on
    sendPublicTypingStatus(public_conversation_id, true); // 📡 Broadcast start
  }, [public_conversation_id, sendPublicTypingStatus]);

  // 💤 Blur → typing false
  const handleInputBlur = useCallback(() => {
    setIsTypingLocal(false); // 🛑 Local typing off
    sendPublicTypingStatus(public_conversation_id, false); // 📡 Broadcast stop
  }, [public_conversation_id, sendPublicTypingStatus]);

  return {
    isTyping, // 👥 Remote typing
    typingUser, // 🧑‍💬 Remote user object from server
    isTypingLocal, // 🫵 Local typing (optional debug)
    handleInputChange, // ⌨️ Wire to input onChange
    handleInputFocus, // 🎯 Wire to input onFocus
    handleInputBlur // 💤 Wire to input onBlur
  };
}
