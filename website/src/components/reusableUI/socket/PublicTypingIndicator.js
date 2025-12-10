'use client';
/**
 * PublicTypingIndicator.js
 * ========================
 * 👀 Typing indicator wired to public live chat socket events
 * - Uses usePublicTypingIndicator for real-time typing state
 * - Renders i18n-aware messages for user/admin/you
 */

import { useTranslations } from 'next-intl';
import usePublicTypingIndicator from '@/hooks/socket/usePublicTypingIndicator';

export default function PublicTypingIndicator({ public_conversation_id, className = '' }) {
  const t = useTranslations(); // 🌍 socket.ui.publicLiveChat.*
  const { isTyping, typingUser, isTypingLocal } = usePublicTypingIndicator(public_conversation_id);

  // 🧱 Keep layout stable when nothing is happening
  if (!isTyping && !isTypingLocal) {
    return <div className={`min-h-[20px] ${className}`} />;
  }

  let label = '';

  // 👥 Remote user is typing (data from public_message:user_typing)
  if (isTyping && typingUser) {
    const name = typingUser.name || typingUser.username || 'User';

    if (typingUser.role === 'admin') {
      // 🧑‍💼 Admin is typing
      label = t('socket.ui.publicLiveChat.typing_admin', {
        defaultValue: 'Admin is typing…'
      });
    } else {
      // 👤 Named user/guest is typing
      label = t('socket.ui.publicLiveChat.typing_user', {
        name,
        defaultValue: `${name} is typing…`
      });
    }
  } else if (isTyping && !typingUser) {
    // 🧩 Fallback when server did not send user object
    label = t('socket.ui.publicLiveChat.typing_user', {
      name: 'User',
      defaultValue: 'User is typing…'
    });
  } else if (isTypingLocal) {
    // 🧑 You are typing
    label = t('socket.ui.publicLiveChat.typing_you', {
      defaultValue: 'You are typing…'
    });
  }

  if (!label) {
    return <div className={`min-h-[20px] ${className}`} />;
  }

  return (
    <div className={`text-xs italic opacity-80 ${className}`} role="status" aria-live="polite">
      {label}
    </div>
  );
}
