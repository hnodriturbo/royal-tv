/**
 * ============== PublicLiveChatWidget (REFACTORED) ==============
 * 💬 Floating chat widget with clean UX and proper admin detection
 * ---------------------------------------------------------------
 * FEATURES:
 *   ✅ Auto-reopen last room on mount
 *   ✅ Real admin online detection (not hardcoded)
 *   ✅ Minimize (keep cache) vs Close (clear all)
 *   ✅ Typing indicators with debounce
 *   ✅ Unread badge
 *   ✅ Smooth animations & rounded bubbles
 */
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import usePublicLiveChat from '@/hooks/socket/usePublicLiveChat';
import useSocketHub from '@/hooks/socket/useSocketHub'; // ✅ ADD THIS

export default function PublicLiveChatWidget() {
  const t = useTranslations();
  const chat = usePublicLiveChat();
  const { onSetLastRoomCookie, onClearLastRoomCookie } = useSocketHub(); // ✅ GET COOKIE LISTENERS

  // 🔀 Widget visibility
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  // 📝 Input state
  const [draft, setDraft] = useState('');

  // 💾 Cache for minimized state
  const cachedMessagesRef = useRef([]);
  const scrollRef = useRef(null);

  // 🔔 Unread count
  const unread = chat?.unread?.total ?? 0;

  // ⌨️ Typing indicator
  const typingUser = chat?.typing?.typingUser;
  const typingName = typingUser?.name;

  // 👥 Detect admin online (REAL detection, not hardcoded)
  const usersInRoom = chat?.roomUsers?.usersInRoom || [];
  const adminOnline = usersInRoom.some((user) => user?.role === 'admin');

  // 📜 Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current && chat?.messages?.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chat?.messages]);

  // 💾 Update cache when messages change
  useEffect(() => {
    if (chat?.messages?.length > 0) {
      cachedMessagesRef.current = chat.messages;
    }
  }, [chat?.messages]);

  // ✅ Widget handles its own cookie sync
  useEffect(() => {
    // 🛡️ Guard: Make sure functions exist
    if (!onSetLastRoomCookie || !onClearLastRoomCookie) return;

    const unsubSet = onSetLastRoomCookie(({ cookieName, public_conversation_id, maxAgeDays }) => {
      const expires = new Date();
      expires.setDate(expires.getDate() + (maxAgeDays || 14));
      document.cookie = `${cookieName}=${public_conversation_id}; path=/; expires=${expires.toUTCString()}; SameSite=Lax`;
      console.log(`🍪 [Widget] Set cookie: ${cookieName}=${public_conversation_id}`);
    });

    const unsubClear = onClearLastRoomCookie(({ cookieName }) => {
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      console.log(`🍪 [Widget] Cleared cookie: ${cookieName}`);
    });

    return () => {
      unsubSet?.();
      unsubClear?.();
    };
  }, [onSetLastRoomCookie, onClearLastRoomCookie]);

  /* ========================================
   * 📤 SEND MESSAGE
   * ======================================*/
  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text) return;

    chat?.send(text);
    setDraft('');
    chat?.setTyping(false);
  }, [draft, chat]);

  /* ========================================
   * ⌨️ TYPING HANDLERS
   * ======================================*/
  const handleInputChange = useCallback(
    (e) => {
      setDraft(e.target.value);
      chat?.setTyping(true);
    },
    [chat]
  );

  const handleInputBlur = useCallback(() => {
    chat?.setTyping(false);
  }, [chat]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  /* ========================================
   * 🗂️ MINIMIZE / CLOSE
   * ======================================*/
  const handleMinimize = useCallback(() => {
    // Keep messages in cache, hide widget
    setIsMinimized(true);
    setIsOpen(false);
  }, []);

  const handleClose = useCallback(() => {
    // Clear everything
    chat?.closeRoom();
    cachedMessagesRef.current = [];
    setDraft('');
    setIsOpen(false);
    setIsMinimized(false);
  }, [chat]);

  const handleReopen = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);

    // Mark as read when reopening
    if (chat?.activeRoomId) {
      chat?.markRead();
    }
  }, [chat]);

  /* ========================================
   * 📦 DECIDE WHICH MESSAGES TO SHOW
   * ======================================*/
  const messagesToShow =
    chat?.messages?.length > 0 ? chat.messages : isMinimized ? cachedMessagesRef.current : [];

  const isEmpty = messagesToShow.length === 0;

  /* ========================================
   * 🎨 RENDER
   * ======================================*/

  // 🔒 Closed state (compact reopen button)
  if (!isOpen) {
    return (
      <div className="fixed bottom-4 left-4 z-[1000]">
        <button
          onClick={handleReopen}
          className="flex items-center gap-2 px-4 py-3 rounded-full shadow-xl bg-gradient-to-r from-slate-900 to-slate-700 text-white hover:from-slate-800 hover:to-slate-600 transition-all"
          aria-label={t('socket.ui.publicLiveChat.main.toggle_open')}
        >
          <span className="font-medium text-sm">
            💬 {t('socket.ui.publicLiveChat.main.main_title')}
          </span>
          {unread > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 rounded-full text-xs bg-red-500 px-2">
              {unread}
            </span>
          )}
        </button>
      </div>
    );
  }

  // 🟢 Open state (full widget)
  return (
    <div className="fixed bottom-4 left-4 z-[1000] w-[22rem]">
      <div className="rounded-2xl shadow-2xl border border-black/10 bg-white/95 backdrop-blur-sm overflow-hidden">
        {/* ========== HEADER ========== */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-700 text-white">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              {t('socket.ui.publicLiveChat.main.main_title')}
            </span>

            {/* Unread Badge */}
            {unread > 0 && (
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 rounded-full text-[10px] bg-red-500 px-2 font-medium">
                {unread}
              </span>
            )}

            {/* Admin Online Indicator */}
            {adminOnline && (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {t('socket.ui.publicLiveChat.main.admin_online')}
              </span>
            )}
          </div>

          {/* Window Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleMinimize}
              className="w-7 h-7 grid place-items-center rounded-full hover:bg-white/10 transition-colors"
              title={t('socket.ui.publicLiveChat.main.minimize')}
            >
              <span className="text-lg leading-none">−</span>
            </button>
            <button
              onClick={handleClose}
              className="w-7 h-7 grid place-items-center rounded-full hover:bg-white/10 transition-colors"
              title={t('socket.ui.publicLiveChat.main.close')}
            >
              <span className="text-lg leading-none">×</span>
            </button>
          </div>
        </div>

        {/* ========== MESSAGES ========== */}
        <div ref={scrollRef} className="h-[420px] overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
          {isEmpty ? (
            <div className="flex items-center justify-center h-full text-sm text-slate-500">
              {t('socket.ui.publicLiveChat.main.empty_state')}
            </div>
          ) : (
            messagesToShow.map((msg) => (
              <MessageBubble
                key={msg.public_message_id}
                text={msg.message}
                timestamp={msg.createdAt}
                isOwnMessage={false} // You can add logic to detect own messages
              />
            ))
          )}
        </div>

        {/* ========== FOOTER / INPUT ========== */}
        <div className="border-t border-slate-200 px-4 py-3 bg-white">
          {/* Typing Indicator */}
          {typingName && (
            <div className="text-xs text-slate-500 mb-2">
              <span className="italic">{typingName} is typing...</span>
            </div>
          )}

          {/* Input Row */}
          <div className="flex items-end gap-2">
            <textarea
              className="flex-1 resize-none rounded-xl px-3 py-2 text-sm border border-slate-300 focus:border-slate-500 focus:ring-2 focus:ring-slate-500/20 outline-none transition-all"
              rows={1}
              value={draft}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              placeholder={t('socket.ui.publicLiveChat.main.input_placeholder')}
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim()}
              className="shrink-0 rounded-xl px-4 py-2 text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {t('socket.ui.publicLiveChat.main.send_button')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================================
 * 💬 MESSAGE BUBBLE COMPONENT
 * ======================================*/
function MessageBubble({ text, timestamp, isOwnMessage = false }) {
  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] px-3 py-2 rounded-2xl ${
          isOwnMessage
            ? 'bg-slate-900 text-white rounded-br-sm'
            : 'bg-white border border-slate-200 rounded-bl-sm'
        }`}
      >
        <p className="text-sm leading-relaxed break-words">{text}</p>
        {formattedTime && (
          <p className={`text-[10px] mt-1 ${isOwnMessage ? 'text-slate-300' : 'text-slate-400'}`}>
            {formattedTime}
          </p>
        )}
      </div>
    </div>
  );
}
