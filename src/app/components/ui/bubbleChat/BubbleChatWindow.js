// 📄 src/app/components/BubbleChatWindow.js
'use client';

import { useState, useEffect, useCallback } from 'react';
import { BsX } from 'react-icons/bs';
import { useSession } from 'next-auth/react';
import { useChatRoom } from '@/hooks/socket/useChatRoom';

export default function BubbleChatWindow({
  conversation_id,
  name = 'You',
  onClose,
  isAdmin = false,
}) {
  // ─── Hooks ─────────────────────────────────────────────────────
  const { data: session } = useSession();
  const { join, send, typing, messages, users } = useChatRoom(conversation_id, {
    chatType: 'bubble',
  });
  const [draft, setDraft] = useState('');

  // ─── Join on mount ──────────────────────────────────────────────
  useEffect(() => {
    join();
  }, [join]);

  // ─── Handlers ──────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    if (!draft.trim()) return;
    send(draft);
    setDraft('');
    typing(false);
  }, [draft, send, typing]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      } else {
        typing(true);
      }
    },
    [handleSend, typing],
  );

  // ─── Presence indicator ────────────────────────────────────────
  const otherRole = isAdmin ? 'user' : 'admin';
  const otherOnline = users.some((u) => u.role === otherRole);

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="w-[320px] h-[400px] bg-gray-800 shadow-xl rounded-lg flex flex-col z-50">
      <header
        className={`flex justify-between items-center p-2 rounded-t-lg text-white ${
          isAdmin ? 'bg-green-600' : 'bg-blue-600'
        }`}
      >
        <span>{isAdmin ? `Chat with ${name}` : 'Live Support Chat'}</span>
        <div className="flex items-center gap-1 text-xs text-gray-300">
          <span className={otherOnline ? 'text-green-400' : 'text-red-400'}>
            ●
          </span>
          <span>
            {isAdmin ? 'User' : 'Admin'} {otherOnline ? 'online' : 'offline'}
          </span>
        </div>
        <BsX className="text-2xl cursor-pointer" onClick={onClose} />
      </header>

      <div className="flex-1 overflow-y-auto p-3 text-white">
        {messages.map((m) => {
          const isOwn = m.sender_is_admin === isAdmin;
          const author = isOwn ? 'You' : m.name || (isAdmin ? 'User' : 'Admin');
          return (
            <div key={m.message_id} className="my-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-gray-400">
                  {author}
                  <span className="ml-1 italic text-[10px] text-gray-500">
                    ({m.status})
                  </span>
                </span>
              </div>
              <p className="text-sm">{m.message}</p>
            </div>
          );
        })}
      </div>

      <footer className="flex border-t border-gray-700 p-2">
        <input
          type="text"
          className="flex-1 rounded-l px-2 py-1 outline-none text-black"
          placeholder="Type a message…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={handleSend}
          className="rounded-r bg-blue-600 px-3 text-white hover:bg-blue-700"
        >
          Send
        </button>
      </footer>
    </div>
  );
}
