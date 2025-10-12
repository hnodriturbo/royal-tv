/**
<<<<<<< HEAD
 * PublicLiveChatWidget (client)
 * ============================
 * 💬 Minimal chat widget using the composed hook.
 *   • Auto-creates a conversation on first send
 *   • Sticky last room via cookie
 *   • Dark UI + readable bubbles
 *   • z-index 1000
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import usePublicLiveChat from '@/hooks/socket/usePublicLiveChat';
import useIsAdminOnline from '@/hooks/socket/useIsAdminOnline';

export default function PublicLiveChatWidget() {
  const t = useTranslations();

  const {
    activeRoomId,
    closeRoom,
    messages,
    typing,
    unread,
    roomUsers,
    send,
    markRead,
    sendTyping
  } = usePublicLiveChat();

  const { isAdminOnline } = useIsAdminOnline();

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');

  const msgs = messages?.list ?? [];
  const unreadBadge = useMemo(() => (unread?.total > 0 ? unread.total : null), [unread]);

  useEffect(() => {
    if (open && activeRoomId) markRead();
  }, [open, activeRoomId, markRead]);

  const onSubmit = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    send(text);
    setInput('');
  };

  return (
    <>
      {/* 🎛️ Floating toggle (z-1000) */}
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="fixed bottom-4 left-8 z-[1000] rounded-full shadow-lg px-4 py-2 text-sm border bg-neutral-900 text-neutral-50"
        aria-expanded={open}
        aria-label={t('socket.ui.publicLiveChat.main.toggle_open')}
        title={t('socket.ui.publicLiveChat.main.toggle_open')}
      >
        {t('socket.ui.publicLiveChat.main.main_title')}
        {unreadBadge ? (
          <span
            className="ml-2 inline-flex min-w-5 h-5 items-center justify-center text-xs rounded-full border px-2 bg-neutral-800"
            aria-label={t('socket.ui.publicLiveChat.main.unread_badge_sr')}
          >
            {unreadBadge}
          </span>
        ) : null}
      </button>

      {/* 🪟 Chat panel (z-1000) */}
      {open && (
        <div className="fixed bottom-16 left-8 z-[1000] w-96 max-w-[92vw] max-h-[400px] rounded-2xl border border-neutral-700 bg-neutral-900 text-neutral-50 shadow-2xl overflow-hidden flex flex-col">
          {/* 🧭 Header */}
          <div className="px-4 py-3 border-b border-neutral-800 flex items-center justify-between">
            <div className="text-sm font-semibold tracking-wide">
              {t('socket.ui.publicLiveChat.main.main_title')}
              <span className="ml-2 text-xs opacity-70">
                {isAdminOnline
                  ? `• ${t('socket.ui.publicLiveChat.main.admin_online')}`
                  : `• ${t('socket.ui.publicLiveChat.main.bot_standby')}`}
              </span>
            </div>
            <button
              className="text-xs underline underline-offset-2 opacity-80 hover:opacity-100"
              onClick={() => {
                closeRoom();
                setOpen(false);
              }}
              aria-label={t('socket.ui.publicLiveChat.main.toggle_close')}
              title={t('socket.ui.publicLiveChat.main.toggle_close')}
            >
              {t('socket.ui.publicLiveChat.main.toggle_close')}
            </button>
          </div>

          {/* 👥 Presence */}
          <div className="px-4 py-2 text-xs border-b border-neutral-800 bg-neutral-850/50">
            <span className="opacity-70">{t('socket.ui.publicLiveChat.main.users_label')}:</span>{' '}
            {(roomUsers?.usersInRoom || []).map((u) => u?.name || u?.user_id).join(', ') || '—'}
          </div>

          {/* 💬 Messages (bubbles) */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {msgs.length === 0 && (
              <div className="text-xs opacity-70 px-2">
                {t('socket.ui.publicLiveChat.main.empty_state')}
              </div>
            )}

            {msgs.map((m) => {
              const mine = false; // if you have current user_id, you can set mine = (m.sender_user_id === currentUserId)
              return (
                <div key={m.public_message_id} className={`max-w-[85%] ${mine ? 'ml-auto' : ''}`}>
                  <div className="opacity-50 text-[10px] mb-0.5 px-1">
                    {m.sender_user_id
                      ? `user:${String(m.sender_user_id).slice(0, 6)}`
                      : `guest:${String(m.sender_guest_id || '').slice(0, 6)}`}
                  </div>
                  <div
                    className={`rounded-2xl px-3 py-2 leading-snug text-sm
                    ${mine ? 'bg-indigo-600 text-white' : 'bg-neutral-800 text-neutral-50'}
                  `}
                  >
                    {m.message}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ⌨️ Typing */}
          {typing?.typingUser && (
            <div className="px-4 py-1 text-xs opacity-70 border-t border-neutral-800">
              someone is typing…
            </div>
          )}

          {/* 📨 Composer */}
          <form
            onSubmit={onSubmit}
            className="flex items-center gap-2 p-2 border-t border-neutral-800 bg-neutral-850/50"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => sendTyping(true)}
              onBlur={() => sendTyping(false)}
              className="w-full rounded-xl border border-neutral-700 bg-white text-neutral-900 px-3 py-2 text-sm outline-none"
              placeholder={t('socket.ui.publicLiveChat.main.input_placeholder')}
              aria-label={t('socket.ui.publicLiveChat.main.input_placeholder')}
            />
            <button
              className="px-3 py-2 rounded-xl border border-neutral-700 bg-neutral-100 text-neutral-900 text-sm hover:bg-white"
              type="submit"
            >
              {t('socket.ui.publicLiveChat.main.send_button')}
            </button>
          </form>
        </div>
      )}
    </>
=======
 * ================= PublicChatLauncher (client) =================
 * 🟣 Floating button that opens/closes the Public Chat panel
 * - No translations inside; keep hooks pure and UI decides wording.
 */
'use client';

import { useState } from 'react';

export default function PublicChatLauncher() {
  // 🎛️ Local toggle for panel visibility
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* 🔘 Toggle button */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="rounded-2xl px-4 py-2 shadow-md border bg-white hover:bg-neutral-50"
      >
        {isOpen ? '🟣 Close Chat' : '🟣 Open Chat'}
      </button>

      {/* 🪟 Simple panel placeholder */}
      {isOpen && (
        <div className="mt-2 w-[360px] h-[520px] rounded-2xl shadow-xl border bg-white overflow-hidden">
          <div className="h-full grid place-items-center text-sm text-neutral-500">
            {/* 🧪 Placeholder so you can wire hooks */}
            Public Chat – hook playground
          </div>
        </div>
      )}
    </div>
<<<<<<< HEAD
>>>>>>> ee83db8 (Public Live Chat hooks updates and creations, update of publicRoomEvents.js and generic errors in i18n translations for the message error event and function to use. Also created the bone structure of the widget component.)
=======
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef
>>>>>>> bc2f6b48e4f33acee4e379eb2af0f051da5bc534
  );
}
