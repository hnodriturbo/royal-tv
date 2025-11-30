/**
 * ============== PublicLiveChatWidget (REFACTORED) ==============
 * 💬 Floating chat widget with clean UX and proper admin detection
 * ---------------------------------------------------------------
 * ARCHITECTURE:
 *   • Uses dedicated hooks from usePublicLiveChat
 *   • Auto-syncs cookies for room persistence
 *   • Real-time presence detection for admin online status
 */
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import usePublicLiveChat, { getCookie } from '@/hooks/socket/usePublicLiveChat';
import useIsAdminOnline from '@/hooks/socket/useIsAdminOnline';

// 🔐 FEATURE FLAG: Show chat only when admin is online (set to false for debugging)
const REQUIRE_ADMIN_ONLINE = false;

export default function PublicLiveChatWidget() {
  const t = useTranslations();

  // 🧭 Use all-in-one hook
  const chat = usePublicLiveChat();

  // 🔀 Widget visibility
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messageList, setMessageList] = useState([]);

  // 📝 Input state
  const [draft, setDraft] = useState('');
  const [pendingMessage, setPendingMessage] = useState(null); // Queue first message until room ready

  // 💾 Cache for minimized state
  const cachedMessagesRef = useRef([]);
  const scrollRef = useRef(null);
  const bootstrappedRef = useRef(false);

  // 🔔 Unread tracking
  const [unreadCount, setUnreadCount] = useState(0);

  // 👥 Admin online detection (global, not room-specific)
  const { isAdminOnline } = useIsAdminOnline();

  // ⌨️ Typing tracking
  const [typingUser, setTypingUser] = useState(null);

  /* ========================================
   * 🍪 COOKIE HELPERS
   * ======================================*/
  const setChatStateCookie = useCallback((roomId, isOpen) => {
    try {
      const date = new Date();
      date.setTime(date.getTime() + 14 * 864e5); // 14 days
      document.cookie = `public_last_conversation_id=${roomId}; expires=${date.toUTCString()}; path=/; samesite=lax`;
      document.cookie = `public_chat_open=${isOpen}; expires=${date.toUTCString()}; path=/; samesite=lax`;
      console.log('🍪 Chat state saved:', { roomId, isOpen });
    } catch (error) {
      console.warn('⚠️ cookie set failed', error);
    }
  }, []);

  const clearChatStateCookie = useCallback(() => {
    try {
      const expired = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = `public_last_conversation_id=; ${expired}; path=/; samesite=lax`;
      document.cookie = `public_chat_open=; ${expired}; path=/; samesite=lax`;
      console.log('🧽 Chat state cleared');
    } catch (error) {
      console.warn('⚠️ cookie clear failed', error);
    }
  }, []);

  /* ========================================
   * 🍪 COOKIE SYNC (listen for server cookie events)
   * ======================================*/
  useEffect(() => {
    if (!chat?.onSetLastRoomCookie || !chat?.onClearLastRoomCookie) return;

    const offSet = chat.onSetLastRoomCookie(({ public_conversation_id }) => {
      setChatStateCookie(public_conversation_id, isOpen);
    });

    const offClear = chat.onClearLastRoomCookie(() => {
      clearChatStateCookie();
    });

    return () => {
      offSet?.();
      offClear?.();
    };
  }, [chat, isOpen, setChatStateCookie, clearChatStateCookie]);

  /* ========================================
   * 🚀 MOUNT BOOTSTRAP (restore widget state from cookies)
   * ======================================*/
  useEffect(() => {
    if (bootstrappedRef.current || !chat) return;
    bootstrappedRef.current = true;

    // 🍪 Check if chat was previously open
    const lastRoomId = getCookie('public_last_conversation_id');
    const wasOpen = getCookie('public_chat_open') === 'true';

    if (lastRoomId && wasOpen) {
      console.log('🔁 Restoring chat session:', { lastRoomId, wasOpen });
      setActiveRoomId(lastRoomId);
      setIsOpen(true);
      chat.joinPublicRoom(lastRoomId);
      chat.refreshPublicMessages(lastRoomId, 50);
    }

    return () => {
      if (activeRoomId) {
        chat.leavePublicRoom(activeRoomId);
      }
    };
  }, [chat]);

  /* ========================================
   * 🆕 CREATE ROOM IMMEDIATELY WHEN WIDGET OPENS (not on first message)
   * ======================================*/
  useEffect(() => {
    // Only create room if:
    // 1. Widget is open
    // 2. No active room exists yet
    // 3. Bootstrap is complete (prevents double creation)
    // 4. Not already creating (prevents race condition)
    if (isOpen && !activeRoomId && bootstrappedRef.current && !pendingMessage) {
      console.log('🆕 Widget opened - creating room immediately');
      chat.createPublicRoom({ subject: 'Public Live Chat' });
    }
  }, [isOpen, activeRoomId, chat, pendingMessage]);

  /* ========================================
   * 🏠 ROOM READY (after create) - Send pending message once ready
   * ======================================*/
  useEffect(() => {
    if (!isOpen || activeRoomId || !chat?.setupRoomReadyListener) return;

    return chat.setupRoomReadyListener({
      onRoomReady: (roomId) => {
        console.log('🟢 Room ready:', roomId);
        setActiveRoomId(roomId);
        chat.refreshPublicMessages(roomId, 50);

        // 📤 Send pending message if exists
        if (pendingMessage) {
          console.log('📤 Sending pending message:', pendingMessage);
          chat.sendPublicMessage(roomId, pendingMessage);
          setPendingMessage(null);
        }
      }
    });
  }, [chat, isOpen, activeRoomId, pendingMessage]);

  /* ========================================
   * 📨 MESSAGE LISTENERS - Only when open AND in active room
   * ======================================*/
  useEffect(() => {
    if (!isOpen || !activeRoomId || !chat?.setupMessageListeners) return;

    return chat.setupMessageListeners({
      activeRoomId,
      onMessageCreated: (message) => {
        setMessageList((prev) => [...prev, message]);
      },
      onMessageEdited: (message) => {
        setMessageList((prev) =>
          prev.map((m) => (m.public_message_id === message.public_message_id ? message : m))
        );
      },
      onMessageDeleted: (messageId) => {
        setMessageList((prev) => prev.filter((m) => m.public_message_id !== messageId));
      },
      onMessagesRefreshed: (list) => {
        setMessageList(Array.isArray(list) ? list : []);
      }
    });
  }, [chat, activeRoomId, isOpen]);

  /* ========================================
   * ⌨️ TYPING LISTENER - Only when open AND in active room
   * ======================================*/
  useEffect(() => {
    if (!isOpen || !activeRoomId || !chat?.setupTypingListener) return;

    return chat.setupTypingListener({
      activeRoomId,
      onTypingUpdate: (user) => {
        setTypingUser(user);
      }
    });
  }, [chat, activeRoomId, isOpen]);

  /* ========================================
   * 🔔 UNREAD LISTENER - Only when minimized with active room
   * ======================================*/
  useEffect(() => {
    if (!activeRoomId || !isMinimized || !chat?.setupUnreadListener) return;

    return chat.setupUnreadListener({
      activeRoomId,
      onUnreadUpdate: (count) => {
        setUnreadCount(count);
      }
    });
  }, [chat, activeRoomId, isOpen]);

  /* ========================================
   * 📦 CACHE MESSAGES ON CHANGE
   * ======================================*/
  useEffect(() => {
    if (messageList.length > 0) {
      cachedMessagesRef.current = messageList;
    }
  }, [messageList]);

  /* ========================================
   * 📜 AUTO-SCROLL
   * ======================================*/
  useEffect(() => {
    if (scrollRef.current && messageList.length > 0) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messageList]);

  /* ========================================
   * 📤 SEND MESSAGE (with pending queue for first message)
   * ======================================*/
  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text) return;

    if (activeRoomId) {
      // Room exists - send immediately
      chat.sendPublicMessage(activeRoomId, text);
      chat.sendPublicTyping(activeRoomId, false);
      setDraft('');
    } else {
      // No room yet - this shouldn't happen since room is created on open
      // But as a safety fallback, queue the message
      console.warn('⚠️ No room exists - queuing message and creating room');
      setPendingMessage(text);
      chat.createPublicRoom({ subject: 'Public Live Chat' });
      setDraft('');
    }
  }, [draft, activeRoomId, chat]);

  /* ========================================
   * ⌨️ TYPING HANDLERS
   * ======================================*/
  const handleInputChange = useCallback(
    (e) => {
      setDraft(e.target.value);
      if (activeRoomId && e.target.value.trim()) {
        chat.sendPublicTyping(activeRoomId, true);
      }
    },
    [activeRoomId, chat]
  );

  const handleInputBlur = useCallback(() => {
    if (activeRoomId) {
      chat.sendPublicTyping(activeRoomId, false);
    }
  }, [activeRoomId, chat]);

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
    setIsMinimized(true);
    setIsOpen(false);
  }, []);

  const handleClose = useCallback(() => {
    if (activeRoomId) {
      chat.leavePublicRoom(activeRoomId);
      // Save room ID but mark as closed
      setChatStateCookie(activeRoomId, false);
    }
    setActiveRoomId(null);
    setMessageList([]);
    cachedMessagesRef.current = [];
    setDraft('');
    setIsOpen(false);
    setIsMinimized(false);
  }, [activeRoomId, chat, setChatStateCookie]);

  const handleReopen = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);

    if (activeRoomId) {
      // Room exists - rejoin and mark as read
      chat.joinPublicRoom(activeRoomId);
      chat.markPublicMessagesRead(activeRoomId);
      setChatStateCookie(activeRoomId, true);
    } else {
      // No room - create immediately (not waiting for first message)
      console.log('🆕 Reopening without room - creating immediately');
      chat.createPublicRoom({ subject: 'Public Live Chat' });
    }
  }, [activeRoomId, chat, setChatStateCookie]);

  /* ========================================
   * 📦 DECIDE WHICH MESSAGES TO SHOW
   * ======================================*/
  const messagesToShow =
    messageList.length > 0 ? messageList : isMinimized ? cachedMessagesRef.current : [];
  const isEmpty = messagesToShow.length === 0;

  /* ========================================
   * 🎨 RENDER
   * ======================================*/

  // 🔐 Hide widget if admin-only mode is enabled and no admin is online
  if (REQUIRE_ADMIN_ONLINE && !isAdminOnline) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-[1000] w-[22rem]">
      {/* 🔒 Closed state (compact reopen button) */}
      {!isOpen && (
        <button
          onClick={handleReopen}
          className="flex items-center gap-2 px-4 py-3 rounded-full shadow-xl bg-gradient-to-r from-slate-900 to-slate-700 text-white hover:from-slate-800 hover:to-slate-600 transition-all"
          aria-label={t('socket.ui.publicLiveChat.main.toggle_open')}
        >
          <span className="font-medium text-sm">
            💬 {t('socket.ui.publicLiveChat.main.main_title')}
          </span>
          {unreadCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 rounded-full text-xs bg-red-500 px-2">
              {unreadCount}
            </span>
          )}
        </button>
      )}

      {/* 🟢 Open state (full widget with smooth grow-from-bottom animation) */}
      <AnimatePresence>
        {isOpen && !isMinimized && (
          <motion.div
            key="public-chat-widget"
            initial={{ opacity: 0, scaleY: 0.5, y: 40 }}
            animate={{ opacity: 1, scaleY: 1, y: 0 }}
            exit={{ opacity: 0, scaleY: 0.5, y: 40 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ transformOrigin: 'bottom left' }}
            className="mt-3 rounded-2xl shadow-2xl border border-black/10 bg-white/95 backdrop-blur-sm overflow-hidden"
          >
            {/* ========== HEADER (3-Column Layout) ========== */}
            <div className="grid grid-cols-3 items-center gap-2 px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-700 text-white">
              {/* LEFT: Title + Unread Badge */}
              <div className="flex items-center gap-2 justify-start">
                <span className="font-semibold text-sm">
                  {t('socket.ui.publicLiveChat.main.main_title')}
                </span>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 rounded-full text-[10px] bg-red-500 px-2 font-medium">
                    {unreadCount}
                  </span>
                )}
              </div>

              {/* CENTER: Admin Status */}
              <div className="flex items-center justify-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isAdminOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                  }`}
                />
                <span
                  className={`text-[11px] font-medium ${
                    isAdminOnline ? 'text-emerald-300' : 'text-red-300'
                  }`}
                >
                  {isAdminOnline
                    ? t('socket.ui.publicLiveChat.main.admin_online')
                    : t('socket.ui.publicLiveChat.main.admin_offline') || 'Admin Offline'}
                </span>
              </div>

              {/* RIGHT: Window Controls */}
              <div className="flex items-center gap-1 justify-end">
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
            <div
              ref={scrollRef}
              className="h-[420px] overflow-y-auto px-4 py-4 space-y-3 bg-slate-100"
            >
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
                    isOwnMessage={false}
                  />
                ))
              )}
            </div>

            {/* ========== FOOTER / INPUT ========== */}
            <div className="border-t border-slate-200 px-4 py-3 bg-white">
              {/* Typing Indicator */}
              {typingUser?.name && (
                <div className="text-xs text-slate-500 mb-2">
                  <span className="italic">{typingUser.name} is typing...</span>
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
          </motion.div>
        )}
      </AnimatePresence>
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
            ? 'bg-gradient-to-br from-slate-700 to-slate-900 text-white rounded-br-sm shadow-md'
            : 'bg-gradient-to-br from-blue-50 to-purple-50 text-black border border-slate-300 rounded-bl-sm shadow-sm'
        }`}
        style={{ textShadow: 'none' }}
      >
        <p className="text-sm leading-relaxed break-words" style={{ textShadow: 'none' }}>
          {text}
        </p>
        {formattedTime && (
          <p
            className={`text-[10px] mt-1 ${isOwnMessage ? 'text-slate-300' : 'text-slate-500'}`}
            style={{ textShadow: 'none' }}
          >
            {formattedTime}
          </p>
        )}
      </div>
    </div>
  );
}
