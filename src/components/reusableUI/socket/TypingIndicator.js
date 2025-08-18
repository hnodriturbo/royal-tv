// 🗨️ TypingIndicator.js — localized labels, safe deps
import { useSession } from 'next-auth/react';
import { useTRoot } from '@/lib/i18n/client';

export default function TypingIndicator({
  isTyping,
  isTypingLocal,
  typingUser,
  showLocalForDebug = false
}) {
  const { data: session } = useSession();
  const t = useTRoot(); // 🌍 translator
  const myId = session?.user?.user_id;

  // 🧪 decide which indicator to show
  const showSelf = showLocalForDebug && isTypingLocal; // 👤 local debug typing
  const showOther = isTyping && typingUser && typingUser.user_id !== myId; // 👥 remote typing

  if (!showSelf && !showOther) {
    return <div style={{ minHeight: 24 }} />; // 🧱 reserve space to avoid layout jump
  }

  // 🏷️ build label using i18n
  let label = '';
  if (showSelf) {
    label = t('socket.ui.typing.you'); // 💬 "You are typing…"
  } else if (showOther) {
    label = t('socket.ui.typing.other', {
      name: typingUser.name || t('socket.ui.common.someone')
    }); // 💬 "{name} is writing…"
  }

  return (
    <div className="flex items-center mb-1 min-h-[24px] px-1">
      <span className="text-sm italic w-full text-center blink">{label}</span>
    </div>
  );
}
