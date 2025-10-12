/**
 * PublicLiveChatWidget (client)
 * ============================
 * 💬 Minimal-floating public chat widget with polished styling.
 *   • Auto-reopen last room via cookies
 *   • Fixed height with internal scroll
 *   • Rounded message bubbles + subtle separators
 *   • Soft header/footer; small unread badge
 *   • ✖ Close (clear everything: leave & wipe) + "_" Minimize (leave but keep cache)
 *   • 🟢 Admin online indicator
 */
'use client';

import { useMemo, useRef, useState } from 'react';
import usePublicLiveChat from '@/hooks/socket/usePublicLiveChat';
import { useTranslations } from 'next-intl'; // 🌐 i18n

export default function PublicLiveChatWidget() {
  // 🧠 Main orchestrator (rooms, messages, typing, unread, presence)
  const chat = usePublicLiveChat();

  // 🌐 Translator
  const t = useTranslations();

  // 🔀 Open/close state
  const [isOpen, setIsOpen] = useState(true);

  // 📝 Local input
  const [draft, setDraft] = useState('');

  // 💾 Local cache for minimized state (keeps last messages)
  const cachedMessagesRef = useRef([]);

  // 🔔 Small unread badge (per-room)
  const unread = chat?.unread?.total ?? 0;

  // ⌨️ Typing indicator snapshot
  const typingName = chat?.typing?.typingUser?.name;

  // 👥 Presence snapshot → detect admin online
  const usersInRoom = chat?.roomUsers?.usersInRoom || chat?.presence?.usersInRoom || [];
  const adminOnline =
    Array.isArray(usersInRoom) && usersInRoom.some((person) => person?.role === 'admin');

  // 🧼 Send then clear
  const handleSend = () => {
    const value = draft.trim();
    if (!value) return;
    chat.send(value); // ✉️ send
    setDraft(''); // 🧽 clear
    chat.sendTyping(false); // 🛑 stop typing
  };

  // ↵ Enter to send
  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  // 📦 Decide which messages to show (live or cached)
  const liveList = chat?.messages?.list || [];
  const messagesToShow = liveList.length > 0 ? liveList : cachedMessagesRef.current;

  // 🗂️ Helpers to leave rooms/lobby safely
  const leaveAll = () => {
    const roomId =
      chat?.room?.public_conversation_id || chat?.currentRoomId || chat?.roomId || null; // 🔎 best-effort
    // 🚪 Leave room (any API the hook exposes)
    chat?.leaveRoom?.(roomId);
    chat?.closeRoom?.();
    // 🛋️ Leave lobby (any API the hook exposes)
    chat?.leaveLobby?.();
    chat?.leavePublicLobby?.();
  };

  // ✖ Close → clear everything (leave room+lobby, clear cache & cookie, clear draft)
  const handleCloseClear = () => {
    cachedMessagesRef.current = []; // 🧽 wipe cache
    setDraft(''); // 🧽 wipe input
    chat?.clearLastPublicRoomCookie?.(); // 🍪 forget last room (if available)
    leaveAll(); // 🚪 leave everywhere
    setIsOpen(false); // 🔒 close UI
  };

  // "_" Minimize → keep cache (leave room+lobby but remember messages)
  const handleMinimizeKeep = () => {
    cachedMessagesRef.current = liveList.slice(-200); // 💾 keep recent messages
    leaveAll(); // 🚪 leave everywhere
    setIsOpen(false); // 🔒 close UI
  };

  // 🧭 Empty-state helper
  const empty = !messagesToShow?.length;

  // 🔒 Closed-state compact reopen button (with unread)
  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)} // 🔓 reopen
        className="fixed bottom-4 left-4 z-[1000] rounded-full px-4 h-10 shadow-lg bg-slate-900 text-white text-sm hover:bg-slate-800 inline-flex items-center gap-2"
        title={t('socket.ui.publicLiveChat.main.toggle_open')}
        aria-label={t('socket.ui.publicLiveChat.main.toggle_open')}
      >
        {/* 💬 label */}
        {t('socket.ui.publicLiveChat.main.toggle_open')}
        {unread > 0 && (
          <span className="ml-1 inline-flex min-w-[1.25rem] h-5 items-center justify-center rounded-full text-xs bg-white/20 px-2">
            {unread}
            <span className="sr-only">{t('socket.ui.publicLiveChat.main.unread_badge_sr')}</span>
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-[1000] w-[22rem]">
      {/* 🧰 Widget card */}
      <div className="rounded-2xl shadow-xl border border-black/5 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 pointer-events-auto">
        {/* 🎛️ Header */}
        <div className="flex items-center justify-between px-3 py-2 rounded-t-2xl bg-gradient-to-r from-slate-900 to-slate-700 text-white">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">
              {t('socket.ui.publicLiveChat.main.main_title')}
            </span>{' '}
            {/* 🏷️ Title */}
            {unread > 0 && (
              <span className="ml-1 inline-flex min-w-[1.25rem] h-5 items-center justify-center rounded-full text-[10px] bg-white/20 px-2">
                {unread}
                <span className="sr-only">
                  {t('socket.ui.publicLiveChat.main.unread_badge_sr')}
                </span>
              </span>
            )}
            {/* 🟢 Admin online pill */}
            {adminOnline && (
              <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-emerald-200">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {t('socket.ui.publicLiveChat.main.admin_online')}
              </span>
            )}
          </div>

          {/* Controls: "_" minimize & "×" close */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleMinimizeKeep} // 🗕 minimize (keep)
              className="w-7 h-7 grid place-items-center rounded-full hover:bg-white/10 text-base"
              aria-label={t('socket.ui.publicLiveChat.main.toggle_close')}
              title="_"
            >
              <span aria-hidden>_</span> {/* 🗕 glyph */}
            </button>
            <button
              type="button"
              onClick={handleCloseClear} // ✖ close (clear)
              className="w-7 h-7 grid place-items-center rounded-full hover:bg-white/10 text-base"
              aria-label={t('socket.ui.publicLiveChat.main.toggle_close')}
              title="×"
            >
              <span aria-hidden>×</span> {/* ✖ glyph */}
            </button>
          </div>
        </div>

        {/* 🪟 Messages viewport */}
        <div className="h-[420px] min-h-[420px] max-h-[420px] overflow-y-auto px-3 py-3 space-y-3">
          {empty ? (
            <div className="text-center text-sm text-slate-500 py-12">
              {/* 🌱 Empty state */}
              {t('socket.ui.publicLiveChat.main.empty_state')}
            </div>
          ) : (
            messagesToShow.map((messageItem) => (
              <MessageBubble
                key={messageItem.public_message_id}
                text={messageItem.message}
                timestamp={messageItem.createdAt}
              />
            ))
          )}
        </div>

        {/* ⌨️ Composer */}
        <div className="border-t border-slate-200 p-3 rounded-b-2xl bg-slate-50">
          {/* 🧠 Who is typing */}
          {typingName && (
            <div className="text-[11px] text-slate-500 mb-1">{typingName} is typing…</div>
          )}

          <div className="flex items-end gap-2">
            <textarea
              className="flex-1 resize-none rounded-xl px-3 py-2 text-sm bg-white hover:bg-white focus:bg-white border border-slate-200 outline-none focus:ring-2 focus:ring-slate-400/40 relative z-[1] shadow-inner min-h-[2.25rem] transition-none"
              rows={1}
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value); // 📝 Update draft
                chat.sendTyping(true); // ✍️ notify typing
              }}
              onFocus={() => chat.sendTyping(true)} //     {/* 🔔 typing start */}
              onBlur={() => chat.sendTyping(false)} //     {/* 📴 typing stop */}
              onKeyDown={onKeyDown}
              placeholder={t('socket.ui.publicLiveChat.main.input_placeholder')}
            />
            <button
              onClick={handleSend}
              className="shrink-0 rounded-xl px-3 h-9 text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 shadow"
            >
              {t('socket.ui.publicLiveChat.main.send_button')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== UI Partials ===================== */

function MessageBubble({ text, timestamp }) {
  // 🕒 Light timestamp (optional)
  const time = useMemo(() => {
    try {
      const d = new Date(timestamp);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }, [timestamp]);

  return (
    <div className="max-w-[85%] rounded-2xl px-3 py-2 bg-slate-900 text-white shadow-sm">
      {/* 💬 Text */}
      <div className="text-sm leading-relaxed whitespace-pre-wrap">{text}</div>
      {/* 🕒 Subtle time */}
      {time && <div className="mt-1 text-[10px] opacity-70">{time}</div>}
    </div>
  );
}
