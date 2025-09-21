'use client';

/**
 * TypingIndicator.js
 * Minimal, a11y-friendly typing indicator for chat.
 */

export default function TypingIndicator({
  isTyping = false,
  typingUser = null,
  isTypingLocal = false,
  showLocalForDebug = false,
  className = ''
}) {
  if (!isTyping && !(showLocalForDebug && isTypingLocal)) {
    return <div className="min-h-[24px]" />; // keep layout
  }

  const name = typingUser?.name || typingUser?.username || 'Someone';

  return (
    <div className={`text-sm italic opacity-80 ${className}`} role="status" aria-live="polite">
      {isTyping ? `${name} is typing…` : showLocalForDebug ? 'You are typing…' : ''}
    </div>
  );
}
