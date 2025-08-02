import { useSession } from 'next-auth/react';

export default function TypingIndicator({
  isTyping,
  isTypingLocal,
  typingUser,
  showLocalForDebug = false
}) {
  const { data: session } = useSession();
  const myId = session?.user?.user_id;

  const showSelf = showLocalForDebug && isTypingLocal;
  const showOther = isTyping && typingUser && typingUser.user_id !== myId;

  if (!showSelf && !showOther) {
    return <div style={{ minHeight: 24 }} />; // Reserve space
  }

  let label = '';
  if (showSelf) {
    label = `You are typing…`;
  } else if (showOther) {
    label = `${typingUser.name || 'Someone'} is writing…`;
  }

  return (
    <div className="flex items-center mb-1 min-h-[24px] px-1">
      <span className="text-sm italic w-full text-center blink">{label}</span>
    </div>
  );
}
