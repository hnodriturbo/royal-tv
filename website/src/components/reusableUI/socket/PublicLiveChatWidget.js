'use client';
/**
 * /src/components/reusableUI/socket/PublicLiveChatWidget.js
 * =========================================================
 * 💬 Floating public live chat widget (guest + logged-in users)
 *
 * Behavior:
 * - Uses Socket.IO public_* events + public_identity_id cookie from server 🧠
 * - Server remembers the last room in a cookie; leaving the room clears it 🍪
 * - Widget itself remembers open/closed UI state in a simple cookie 🪟
 * - Minimize ➜ keep room + cookie; Hard close ➜ leave room + clear cookie
 * - Users/guests can send, edit, delete their own messages ✏️🗑️
 * - Read state is handled via socket events (mark_read + unread counters) ✅
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import dayjs from 'dayjs';
import clsx from 'clsx';

import useAppHandlers from '@/hooks/useAppHandlers'; // 🔔 toasts (success/error)
import useSocketHub from '@/hooks/socket/useSocketHub'; // 🔌 core socket API + helpers
import usePublicMessageEvents from '@/hooks/socket/usePublicMessageEvents'; // ✉️ public messages
import usePublicLiveChatModals from '@/hooks/socket/usePublicLiveChatModals'; // 🧩 shared public-chat modals
import usePublicTypingIndicator from '@/hooks/socket/usePublicTypingIndicator'; // ⌨️ typing indicator
import usePublicRefreshMessages from '@/hooks/socket/usePublicRefreshMessages'; // 🔄 manual refresh
import PublicTypingIndicator from '@/components/reusableUI/socket/PublicTypingIndicator'; // 👀 typing UI (public)
import useIsAdminOnline from '@/hooks/socket/useIsAdminOnline'; // 🟢 admin presence status
import { SafeString } from '@/lib/ui/SafeString'; // 🛡️ guard against bad strings
/* import useModal from '@/hooks/useModal'; // 🪟 global modal wrapper */

// 🍪 Cookie names
// - PUBLIC_CHAT_OPEN_COOKIE: widget open/closed state (UI only)
// - PUBLIC_LAST_ROOM_COOKIE: last public room id (server-managed identity)
const PUBLIC_CHAT_OPEN_COOKIE = 'public_chat_open';
const PUBLIC_LAST_ROOM_COOKIE = 'public_last_conversation_id';

// 🔎 Read cookie on client
function getCookie(cookieName) {
  // 🛡️ Guard against SSR
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${cookieName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// ✏️ Write cookie on client
function setCookie(cookieName, cookieValue, maxAgeDays = 30) {
  if (typeof document === 'undefined') return;
  const maxAgeSeconds = maxAgeDays * 24 * 60 * 60;
  document.cookie = `${cookieName}=${encodeURIComponent(
    cookieValue
  )};path=/;max-age=${maxAgeSeconds};SameSite=Lax`;
}

export default function PublicLiveChatWidget() {
  const t = useTranslations(); // 🌍 translations (socket.ui.*)
  const { displayMessage } = useAppHandlers(); // 🔔 toast helper
  /* const { openModal, hideModal } = useModal(); // 🪟 modal helper */

  // 🪟 Widget open/closed (minimize only; room stays joined when open toggles)
  //    SSR-safe: start closed on server, then hydrate from cookie on client
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  // 🟢 Admin online status (real-time)
  const { isAdminOnline, singleAdmin } = useIsAdminOnline(); // 👤 singleAdmin is usually you

  // 🧵 Active public conversation id (room)
  const [publicConversationId, setPublicConversationId] = useState(() => {
    // 🌐 Try to restore from last-room cookie on client
    return getCookie(PUBLIC_LAST_ROOM_COOKIE);
  });

  // 💬 Message list (simple array, kept in order)
  const [messages, setMessages] = useState([]);

  // ✍️ Local draft for new message
  const [draftMessage, setDraftMessage] = useState('');

  // 🔔 Unread badge when widget is closed and admin replies
  const [unreadBadgeCount, setUnreadBadgeCount] = useState(0);

  // 🚦 Avoid double-init for conversation creation/restore
  const isInitializingRef = useRef(false);
  const hasRequestedRoomRef = useRef(false);

  // 🔁 Track if we've already done an initial message refresh for this room
  const hasInitialRefreshRef = useRef(false);

  // 📜 Scroll container ref for auto-scroll
  const chatBoxRef = useRef(null);

  // 🔌 Socket helpers from shared hub
  const {
    joinPublicRoom,
    leavePublicRoom,
    createPublicRoom,
    markPublicMessagesRead,
    onPublicRoomReady, // 🧵 per-room mark_read helper (admin+user) + ready event
    onPublicMessageError,
    enablePublicCookieSync,
    getLastPublicRoomFromCookie
  } = useSocketHub();

  // ✉️ Message events for this public conversation (send/edit/delete + listeners)
  const {
    sendMessage,
    editMessage,
    deleteMessage,
    onReceiveMessage,
    onMessageEdited,
    onMessageDeleted
  } = usePublicMessageEvents(publicConversationId);

  const { openEditModal, openDeleteModal, openCloseChatModal } = usePublicLiveChatModals({
    editMessage, // ✏️ reuses same socket edit
    deleteMessage // 🗑️ reuses same socket delete
  });

  // ⌨️ Typing indicator for this conversation
  const { handleInputChange, handleInputFocus, handleInputBlur } =
    usePublicTypingIndicator(publicConversationId);

  // 🔄 Manual refresh for this conversation
  const { requestRefresh, onRefreshed } = usePublicRefreshMessages(publicConversationId);

  // 🧵 Keep local state in sync with server-confirmed room id
  useEffect(() => {
    const stop = onPublicRoomReady?.(({ public_conversation_id }) => {
      if (!public_conversation_id) return;
      setPublicConversationId((current) => current || public_conversation_id);
      // New room became ready -> allow a fresh initial refresh
      hasInitialRefreshRef.current = false;
    });

    return () => {
      stop && stop();
    };
  }, [onPublicRoomReady]);

  // 🍪 Enable server-driven last-room cookie sync on mount
  useEffect(() => {
    const disableSync = enablePublicCookieSync?.();
    return () => {
      disableSync && disableSync();
    };
  }, [enablePublicCookieSync]);

  // 🧷 After mount, sync widget open state from cookie to avoid SSR mismatch
  useEffect(() => {
    const openFromCookie = getCookie(PUBLIC_CHAT_OPEN_COOKIE) === '1';
    setIsWidgetOpen(openFromCookie);
    // When widget is hydrating, we haven't refreshed messages yet
    hasInitialRefreshRef.current = false;
  }, []);

  // 🧠 Initialize or restore the public conversation
  const ensureConversation = useCallback(async () => {
    // 🛑 Busy initializing
    if (isInitializingRef.current || hasRequestedRoomRef.current) return;
    isInitializingRef.current = true;
    hasRequestedRoomRef.current = true;

    try {
      // 🧪 1) Try to re-join last room based on state or cookie-driven id
      const existingId = publicConversationId || getLastPublicRoomFromCookie?.();
      if (existingId) {
        setPublicConversationId((current) => current || existingId);
        joinPublicRoom(existingId);
        return;
      }

      // 🆕 2) No room yet -> create a new public room.
      // NOTE: createPublicRoom only emits; the authoritative
      // id comes back via `public_room:ready`, which our
      // message hooks already listen to by room id. Here we
      // just create and let the server remember it in cookies.
      createPublicRoom({ subject: 'Public Live Chat' });
    } catch (error) {
      console.error('[PublicLiveChatWidget] ❌ Error in ensureConversation:', error);
      displayMessage(
        t('socket.ui.publicLiveChat.error_open', {
          defaultValue: 'Could not open public chat, please try again.'
        }),
        'error'
      );
    } finally {
      isInitializingRef.current = false;
    }
  }, [publicConversationId, joinPublicRoom, createPublicRoom, displayMessage, t]);

  // ❗ Surface public message socket errors in the widget UI
  useEffect(() => {
    if (!onPublicMessageError) return;
    const stopError = onPublicMessageError((payload) => {
      console.error('[PublicLiveChatWidget] message error', payload);
      const message =
        payload?.message ||
        t('socket.ui.publicLiveChat.generic_error', {
          defaultValue: 'There was a problem with the public chat.'
        });
      displayMessage(message, 'error');
    });
    return () => {
      stopError && stopError();
    };
  }, [onPublicMessageError, displayMessage, t]);

  // 🧷 Keep widget open state in cookie
  useEffect(() => {
    setCookie(PUBLIC_CHAT_OPEN_COOKIE, isWidgetOpen ? '1' : '0');
  }, [isWidgetOpen]);

  // 🚪 When widget opens with an active conversation, make sure we have messages
  useEffect(() => {
    if (!isWidgetOpen || !publicConversationId) return;
    if (hasInitialRefreshRef.current) return;

    hasInitialRefreshRef.current = true;
    // Ask server for the latest messages for this room (after join/restore)
    requestRefresh();
  }, [isWidgetOpen, publicConversationId, requestRefresh]);

  // 🚪 When widget opens, make sure conversation exists
  useEffect(() => {
    if (!isWidgetOpen) return;
    ensureConversation();
  }, [isWidgetOpen, ensureConversation]);

  // 📡 Listen for message events (create / edit / delete)
  useEffect(() => {
    if (!publicConversationId) return;

    // 📨 New message from server
    const stopReceive = onReceiveMessage((payload) => {
      const receivedMessage = payload?.message || payload; // 🧱 Support { message } or bare message

      if (!receivedMessage?.public_message_id) return;

      setMessages((previousMessages) => {
        // 🛡️ Avoid duplicates
        if (
          previousMessages.some(
            (existingMessage) =>
              existingMessage.public_message_id === receivedMessage.public_message_id
          )
        ) {
          return previousMessages;
        }
        return [...previousMessages, receivedMessage];
      });

      // 🔔 Bump badge if widget is closed and message is from admin
      if (!isWidgetOpen && receivedMessage.sender_is_admin) {
        setUnreadBadgeCount((previousCount) => previousCount + 1);
      }
    });

    // ✏️ Edited message
    const stopEdit = onMessageEdited((payload) => {
      const editedMessage = payload?.message || payload;
      if (!editedMessage?.public_message_id) return;

      setMessages((previousMessages) =>
        previousMessages.map((existingMessage) =>
          existingMessage.public_message_id === editedMessage.public_message_id
            ? { ...existingMessage, ...editedMessage }
            : existingMessage
        )
      );
    });

    // 🗑️ Deleted message
    const stopDelete = onMessageDeleted((payload) => {
      const deletedId =
        typeof payload === 'string' ? payload : payload?.public_message_id || payload?.id || null;

      if (!deletedId) return;

      setMessages((previousMessages) =>
        previousMessages.filter(
          (existingMessage) => existingMessage.public_message_id !== deletedId
        )
      );
    });

    // 🧹 Cleanup listeners on unmount / room change
    return () => {
      stopReceive && stopReceive();
      stopEdit && stopEdit();
      stopDelete && stopDelete();
    };
  }, [publicConversationId, onReceiveMessage, onMessageEdited, onMessageDeleted, isWidgetOpen]);

  // 🔄 Hook up refresh => replace messages when server responds
  useEffect(() => {
    if (!publicConversationId) return;

    const stopRefreshed = onRefreshed((payload) => {
      const refreshedMessages = Array.isArray(payload?.messages)
        ? payload.messages
        : Array.isArray(payload)
          ? payload
          : [];

      setMessages(refreshedMessages);
      /*       displayMessage(
        t('socket.ui.publicLiveChat.refreshed', { defaultValue: 'Messages refreshed.' }),
        'success'
      ); */
    });

    return () => {
      stopRefreshed && stopRefreshed();
    };
  }, [publicConversationId, onRefreshed /*  displayMessage, t */]);

  // ⬇️ Auto-scroll when messages change
  useEffect(() => {
    if (!chatBoxRef.current) return;
    chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [messages]);

  // 🛎️ Mark messages as read whenever widget is opened with an active conversation
  useEffect(() => {
    if (!isWidgetOpen || !publicConversationId || !markPublicMessagesRead) return;

    // ✅ Ask server to mark messages as read based on role (admin vs user/guest)
    markPublicMessagesRead(publicConversationId);
    setUnreadBadgeCount(0);
  }, [isWidgetOpen, publicConversationId, markPublicMessagesRead]);

  // 📨 Send handler
  const handleSend = useCallback(() => {
    const trimmed = draftMessage.trim();
    if (!trimmed || !publicConversationId) return;

    // ✉️ Send via socket helper
    sendMessage(trimmed);

    // 🧽 Clear draft and typing
    setDraftMessage('');
    handleInputBlur();
  }, [draftMessage, publicConversationId, sendMessage, handleInputBlur]);

  // ⌨️ Input change handler (wired into typing indicator hook)
  const handleInput = (event) => {
    // ✍️ Let typing hook manage isTyping/user notification
    const updatedValue = handleInputChange(event);
    setDraftMessage(updatedValue);
  };

  // ↩️ Enter-to-send (Shift+Enter creates newline)
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  // 🧼 Close (minimize) without leaving room
  const handleToggleWidget = () => {
    setIsWidgetOpen((previousState) => !previousState);
  };

  // 💣 Hard close: confirm, then leave room + clear state (server clears cookie)
  const handleHardClose = () => {
    if (!publicConversationId) {
      // 🧹 Nothing to clean, just close widget UI
      setIsWidgetOpen(false);
      setUnreadBadgeCount(0);
      return;
    }
    openCloseChatModal({
      onConfirmClose: () => {
        try {
          // 🚪 Leave socket room so server forgets last room cookie
          leavePublicRoom(publicConversationId);
        } catch (error) {
          console.error('[PublicLiveChatWidget] ❌ Error leaving room:', error);
        }

        // 🧵 Drop conversation + messages from client state
        setPublicConversationId(null);
        setMessages([]);
        setDraftMessage('');
        setUnreadBadgeCount(0);
        setIsWidgetOpen(false);

        // 🔁 Allow a fresh room initialization on next open
        isInitializingRef.current = false;
        hasRequestedRoomRef.current = false;
        hasInitialRefreshRef.current = false;

        // 🍪 Force closed in widget cookie
        setCookie(PUBLIC_CHAT_OPEN_COOKIE, '0');
      }
    });
  };

  // 🧮 Helper: own message (user/guest) vs admin (for styling + actions)
  const isOwnMessage = (message) => !message.sender_is_admin;

  // 🧱 Widget layout (floating bottom-left)
  return (
    <div className="fixed bottom-4 left-4 z-[9999] flex flex-col items-start gap-3">
      {/* 🔘 Main toggle button (always visible) */}
      <button
        type="button"
        onClick={handleToggleWidget}
        className="flex items-center gap-2 px-4 py-3 rounded-full shadow-xl bg-gradient-to-r from-sky-900 via-sky-700 to-sky-600 border-b border-sky-500/60 text-white hover:from-sky-600 hover:to-sky-400 transition-all"
      >
        <span className="text-sm font-semibold">
          💬{' '}
          {t('socket.ui.publicLiveChat.button_label', {
            defaultValue: 'Chat with us'
          })}
        </span>
        {unreadBadgeCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-[1.4rem] h-5 text-xs rounded-full bg-red-600 px-2">
            {unreadBadgeCount}
          </span>
        )}
      </button>

      {/* 🪟 Chat window (only when open) */}
      {isWidgetOpen && (
        <div className="absolute bottom-[3.5rem] left-0 w-[340px] min-h-[360px] max-h-[560px] flex flex-col rounded-2xl shadow-2xl border border-black/30 bg-slate-950/95 text-white backdrop-blur-sm overflow-hidden">
          {/* 🏷️ header */}
          <div className="grid grid-cols-3 items-center px-3 py-2 bg-gradient-to-r from-sky-900 via-sky-700 to-sky-600 border-b border-sky-500/60">
            {/* Left: title */}
            <div className="flex flex-col items-start justify-center">
              <span className="text-sm font-semibold tracking-wide">
                {t('socket.ui.publicLiveChat.title', {
                  defaultValue: 'Public Chat'
                })}
              </span>
            </div>
            {/* Center: admin status */}
            <div className="flex items-center justify-center">
              <span
                className={clsx(
                  'text-xs font-semibold',
                  isAdminOnline ? 'text-emerald-300' : 'text-red-300'
                )}
              >
                {isAdminOnline
                  ? t('socket.ui.publicLiveChat.admin_online', {
                      defaultValue: 'Admin online'
                    })
                  : t('socket.ui.publicLiveChat.admin_offline', {
                      defaultValue: 'Admin offline'
                    })}
              </span>
            </div>
            {/* Right: controls */}
            <div className="flex items-center justify-end gap-1">
              {/* ➖ minimize (keep room joined) */}
              <button
                type="button"
                onClick={handleToggleWidget}
                className="w-7 h-7 grid place-items-center rounded-full hover:bg-black/20 transition-colors"
                title={t('socket.ui.publicLiveChat.minimize', { defaultValue: 'Minimize' })}
              >
                <span className="text-lg leading-none">−</span>
              </button>
              {/* ❌ hard close (leave room) */}
              <button
                type="button"
                onClick={handleHardClose}
                className="w-7 h-7 grid place-items-center rounded-full hover:bg-black/20 transition-colors"
                title={t('socket.ui.publicLiveChat.close', { defaultValue: 'End chat' })}
              >
                <span className="text-lg leading-none">×</span>
              </button>
            </div>
          </div>

          {/* 💬 Messages */}
          <div
            ref={chatBoxRef}
            className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-slate-900"
            aria-live="polite"
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-xs text-slate-300 text-center">
                {t('socket.ui.publicLiveChat.empty', {
                  defaultValue: 'No messages yet. Say hi to start the conversation! 😊'
                })}
              </div>
            ) : (
              messages.map((message) => {
                const createdAt =
                  message.createdAt || message.created_at || message.timestamp || null;
                const timeLabel = createdAt ? dayjs(createdAt).format('HH:mm') : '';

                return (
                  <div
                    key={message.public_message_id}
                    className={clsx(
                      'w-full flex',
                      isOwnMessage(message) ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div className="flex flex-col items-end gap-1 max-w-[80%]">
                      {/* 💬 Bubble */}
                      <div
                        className={clsx(
                          'w-full px-3 py-2 rounded-2xl text-xs whitespace-pre-wrap break-words',
                          isOwnMessage(message)
                            ? 'bg-sky-700 text-white rounded-br-sm shadow-md'
                            : 'bg-slate-800 text-slate-50 rounded-bl-sm shadow-sm'
                        )}
                      >
                        <p>{SafeString(message.message, '')}</p>
                        <div className="mt-1 text-[10px] text-slate-200 flex justify-between gap-2">
                          {timeLabel && <span>{timeLabel}</span>}
                          {message.status === 'edited' && (
                            <span className="italic opacity-80">
                              {t('socket.ui.publicLiveChat.edited', { defaultValue: 'edited' })}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* ✏️🗑️ Actions (only for own messages) */}
                      {isOwnMessage(message) && (
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <button
                            type="button"
                            onClick={() => openEditModal(message)}
                            className="inline-flex items-center gap-1 hover:text-emerald-300 transition-colors"
                            title={t('socket.ui.publicLiveChat.edit_tooltip', {
                              defaultValue: 'Edit message'
                            })}
                          >
                            <span>✏️</span>
                            <span>
                              {t('socket.ui.publicLiveChat.edit_short', { defaultValue: 'Edit' })}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => openDeleteModal(message)}
                            className="inline-flex items-center gap-1 hover:text-red-400 transition-colors"
                            title={t('socket.ui.publicLiveChat.delete_tooltip', {
                              defaultValue: 'Delete message'
                            })}
                          >
                            <span>🗑️</span>
                            <span>
                              {t('socket.ui.publicLiveChat.delete_short', {
                                defaultValue: 'Delete'
                              })}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* 👀 Typing indicator */}
          <div className="h-5 flex items-center justify-center bg-slate-950 px-2">
            <PublicTypingIndicator public_conversation_id={publicConversationId} />
          </div>

          {/* ✍️ Input + send + refresh */}
          <div className="border-t border-slate-700 bg-slate-950 px-3 py-2 flex flex-col gap-2">
            <div className="flex gap-2 items-end">
              <textarea
                rows={1}
                value={draftMessage}
                onChange={handleInput}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onKeyDown={handleKeyDown}
                className="flex-1 resize-none rounded-lg px-2 py-2 text-sm text-black placeholder:text-slate-500 border border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder={t('socket.ui.publicLiveChat.input_placeholder', {
                  defaultValue: 'Type your message…'
                })}
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!draftMessage.trim() || !publicConversationId}
                className="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                {t('socket.ui.publicLiveChat.send', { defaultValue: 'Send' })}
              </button>
            </div>

            <div className="flex justify-between items-center text-[11px] text-slate-300">
              <span>
                {t('socket.ui.publicLiveChat.footer_hint', {
                  defaultValue: 'Replies may take a moment if we are busy.'
                })}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (!publicConversationId) return;
                  requestRefresh();
                }}
                className="text-emerald-300 hover:text-emerald-100 underline-offset-2 hover:underline"
              >
                {t('socket.ui.publicLiveChat.refresh', { defaultValue: 'Refresh' })}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
