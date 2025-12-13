'use client';

/**
 * PublicTypingIndicator.js
 * ========================
 * 👀 Show public live chat typing status (public_message:user_typing)
 * - Reads real-time typing state from usePublicTypingIndicator()
 * - Renders localized typing labels for admin/user/you
 */

import { useTranslations } from 'next-intl'; // 🌐 i18n hook
import usePublicTypingIndicator from '@/hooks/socket/usePublicTypingIndicator'; // ⌨️ Public typing hook

export default function PublicTypingIndicator({ public_conversation_id, className = '' }) {
  const t = useTranslations(); // 🌍 translations (socket.ui.publicLiveChat.*)
  const { isTyping, typingUser, isTypingLocal } = usePublicTypingIndicator(public_conversation_id); // 🔌

  // 🧱 Keep layout stable when nothing is happening
  if (!isTyping && !isTypingLocal) {
    return <div className={`min-h-[20px] ${className}`} />; // 📐 Preserve spacing
  }

  let label = ''; // 🏷️ What I show to the user

  // 👥 Remote user is typing (server sends typingUser in payload)
  if (isTyping) {
    const name = typingUser?.name || typingUser?.username || 'User'; // 🧑‍💬 Friendly name fallback

    if (typingUser?.role === 'admin') {
      // 🧑‍💼 Admin is typing
      label = t('socket.ui.publicLiveChat.typing_admin') || 'Admin is typing…'; // 🛟 Safe fallback
    } else {
      // 👤 User/guest is typing
      label = t('socket.ui.publicLiveChat.typing_user', { name }) || `${name} is typing…`; // 🛟 Safe fallback
    }
  } else if (isTypingLocal) {
    // 🫵 Local typing (optional UI hint)
    label = t('socket.ui.publicLiveChat.typing_you') || 'You are typing…'; // 🛟 Safe fallback
  }

  // 🧱 Keep layout stable if label is empty for any reason
  if (!label) {
    return <div className={`min-h-[20px] ${className}`} />; // 📐 Preserve spacing
  }

  return (
    <div className={`text-xs italic opacity-80 ${className}`} role="status" aria-live="polite">
      {label}
    </div>
  );
}
