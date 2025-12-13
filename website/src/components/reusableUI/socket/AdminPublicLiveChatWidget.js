'use client';
/**
 * AdminPublicLiveChatWidget.js
 * ============================
 * 💬 Purple-themed admin widget for public live chat
 * - Shows incoming public conversations (auto-joined on the server)
 * - Lets admin open multiple chat windows at once
 * - Reuses shared public chat hooks/modals for message CRUD + typing + refresh
 * - Guests/users always start the conversation; admin can jump into any room
 *
 * NOTE: Server already auto-joins admins to all unread public rooms (see server/index.js),
 * but we still call joinPublicRoom when opening a window to be safe.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import dayjs from 'dayjs';
import { useTranslations } from 'next-intl';

import useSocketHub from '@/hooks/socket/useSocketHub';
import usePublicMessageEvents from '@/hooks/socket/usePublicMessageEvents';
import usePublicRefreshMessages from '@/hooks/socket/usePublicRefreshMessages';
import usePublicTypingIndicator from '@/hooks/socket/usePublicTypingIndicator';
import usePublicLiveChatModals from '@/hooks/socket/usePublicLiveChatModals';
import usePublicRoomUsers from '@/hooks/socket/usePublicRoomUsers';
import useAppHandlers from '@/hooks/useAppHandlers';
import PublicTypingIndicator from '@/components/reusableUI/socket/PublicTypingIndicator';
import { SafeString } from '@/lib/ui/SafeString';

// 🍪 Cookie name for admin widget open/closed state (UI only)
const ADMIN_PUBLIC_CHAT_OPEN_COOKIE = 'admin_public_chat_open';

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

// 🧹 Normalize raw payload from socket into a consistent conversation shape
function normalizeConversation(payload) {
  if (!payload) return null;

  const id = payload.public_conversation_id || payload.id;

  return {
    id,
    subject: payload.subject || payload.topic || 'Public chat',
    owner_role: payload.owner_role || payload.role || 'guest',
    owner_name: payload.owner_name || payload.owner || payload.name || 'Guest',
    createdAt:
      payload.createdAt || payload.created_at || payload.started_at || new Date().toISOString(),
    is_closed: Boolean(payload.is_closed),
    userHasLeft: Boolean(payload.userHasLeft || payload.user_has_left)
  };
}

// Individual chat window (one per conversation)
function AdminChatWindow({ conversation, onCloseWindow, onArchiveConversation }) {
  const t = useTranslations(); // 🌍 translations (socket.ui.*)
  const { displayMessage } = useAppHandlers(); // 🔔 toast helper

  // 💬 Message list (simple array, kept in order)
  const [messages, setMessages] = useState([]);

  // ✍️ Local draft for new message
  const [draft, setDraft] = useState('');

  // 🚦 Sending flag to avoid double sends
  const [isSending, setIsSending] = useState(false);

  // 🔽 Minimized state for this window
  const [isMinimized, setIsMinimized] = useState(false);

  // 📜 Scroll container ref for auto-scroll
  const chatBoxRef = useRef(null);

  const {
    joinPublicRoom,
    leavePublicRoom,
    markPublicMessagesRead,
    onPublicMessageError,
    onPublicRoomError
  } = useSocketHub();

  const {
    sendMessage,
    editMessage,
    deleteMessage,
    onReceiveMessage,
    onMessageEdited,
    onMessageDeleted
  } = usePublicMessageEvents(conversation.id);

  const { requestRefresh, onRefreshed } = usePublicRefreshMessages(conversation.id);
  const { openEditModal, openDeleteModal, openCloseChatModal } = usePublicLiveChatModals({
    editMessage,
    deleteMessage
  });
  const {
    isTyping,
    typingUser,
    isTypingLocal,
    handleInputChange,
    handleInputFocus,
    handleInputBlur
  } = usePublicTypingIndicator(conversation.id);
  const { usersInRoom } = usePublicRoomUsers(conversation.id);

  const conversationIsClosed = Boolean(conversation.is_closed);
  const userHasLeftConversation = Boolean(conversation.userHasLeft);

  // Join room on mount, leave on unmount
  useEffect(() => {
    joinPublicRoom(conversation.id);
    // Initial refresh and mark read
    requestRefresh();
    markPublicMessagesRead(conversation.id);
    return () => {
      leavePublicRoom(conversation.id);
    };
  }, [conversation.id, joinPublicRoom, leavePublicRoom, requestRefresh, markPublicMessagesRead]);

  // Listen for live message events
  useEffect(() => {
    const offReceive = onReceiveMessage((payload) => {
      const incoming = payload?.message || payload;
      if (!incoming?.public_message_id) return;
      setMessages((prev) => {
        const exists = prev.some((m) => m.public_message_id === incoming.public_message_id);
        return exists ? prev : [...prev, incoming];
      });
      markPublicMessagesRead(conversation.id);
    });

    const offEdit = onMessageEdited((payload) => {
      const edited = payload?.message || payload;
      if (!edited?.public_message_id) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.public_message_id === edited.public_message_id ? { ...m, ...edited } : m
        )
      );
    });

    const offDelete = onMessageDeleted((payload) => {
      const deletedId =
        typeof payload === 'string' ? payload : payload?.public_message_id || payload?.id;
      if (!deletedId) return;
      setMessages((prev) => prev.filter((m) => m.public_message_id !== deletedId));
    });

    const offError =
      onPublicMessageError?.((err) => console.warn('[AdminChatWindow] message error', err)) || null;
    const offRoomErr =
      onPublicRoomError?.((err) => console.warn('[AdminChatWindow] room error', err)) || null;

    return () => {
      offReceive && offReceive();
      offEdit && offEdit();
      offDelete && offDelete();
      offError && offError();
      offRoomErr && offRoomErr();
    };
  }, [
    conversation.id,
    onReceiveMessage,
    onMessageEdited,
    onMessageDeleted,
    onPublicMessageError,
    onPublicRoomError,
    markPublicMessagesRead
  ]);

  // Handle refreshed messages
  useEffect(() => {
    const off = onRefreshed((payload) => {
      const refreshed = Array.isArray(payload?.messages)
        ? payload.messages
        : Array.isArray(payload)
          ? payload
          : [];
      setMessages(refreshed);
      markPublicMessagesRead(conversation.id);
    });
    return () => off && off();
  }, [onRefreshed, conversation.id, markPublicMessagesRead]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (!chatBoxRef.current) return;
    chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
  }, [messages]);

  const handleSend = useCallback(() => {
    const trimmed = draft.trim();
    if (!trimmed || conversationIsClosed) return;

    setIsSending(true);
    try {
      sendMessage(trimmed);
      setDraft('');
      handleInputBlur();
    } catch (error) {
      console.error('[AdminChatWindow] send error', error);
      displayMessage(
        t('socket.ui.publicLiveChat.generic_error', {
          defaultValue: 'There was a problem with the public chat.'
        }),
        'error'
      );
    } finally {
      setIsSending(false);
    }
  }, [conversationIsClosed, draft, sendMessage, handleInputBlur, displayMessage, t]);

  const handleArchive = useCallback(() => {
    openCloseChatModal({
      onConfirmClose: () => {
        try {
          leavePublicRoom(conversation.id);
        } catch (error) {
          console.error('[AdminChatWindow] leave error', error);
        }
        onArchiveConversation?.(conversation.id);
        onCloseWindow?.(conversation.id);
      }
    });
  }, [conversation.id, leavePublicRoom, onArchiveConversation, onCloseWindow, openCloseChatModal]);

  const accentClasses = useMemo(
    () => ({
      header: 'from-purple-900 via-purple-700 to-purple-600',
      bubbleMine: 'bg-purple-700 text-white rounded-br-sm shadow-md',
      bubbleOther: 'bg-slate-800 text-slate-50 rounded-bl-sm shadow-sm',
      button:
        'bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md'
    }),
    []
  );

  const containerClasses = clsx(
    'w-[360px] flex flex-col rounded-2xl shadow-2xl border border-black/30 bg-slate-950/95 text-white backdrop-blur-sm overflow-hidden transition-[max-height] duration-200 ease-in-out',
    isMinimized ? 'h-auto max-h-[120px]' : 'min-h-[380px] max-h-[600px]'
  );

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div
        className={clsx(
          'grid grid-cols-3 items-center px-3 py-2 border-b border-purple-500/60 bg-gradient-to-r',
          accentClasses.header
        )}
      >
        <div className="flex flex-col items-start justify-center">
          <span className="text-sm font-semibold tracking-wide">🛡️ Admin Chat</span>
          <span className="text-[11px] opacity-80 truncate">
            {conversation.subject} · {conversation.owner_role}
          </span>
        </div>
        <div className="flex flex-col items-center justify-center text-[11px]">
          <span className="font-semibold text-emerald-200">
            {t('socket.ui.publicLiveChat.admin_online', { defaultValue: 'You are online' })}
          </span>
          <span className="text-slate-200">
            {usersInRoom.length} {t('socket.ui.publicLiveChat.users', { defaultValue: 'users' })}
          </span>
        </div>
        <div className="flex items-center justify-end gap-1">
          {/*           
          <button
            type="button"
            onClick={() => requestRefresh()}
            className="w-7 h-7 grid place-items-center rounded-full hover:bg-black/20 transition-colors"
            title={t('socket.ui.publicLiveChat.refresh', { defaultValue: 'Refresh' })}
          >
            ↻
          </button>
 */}
          <button
            type="button"
            onClick={() => setIsMinimized((prev) => !prev)}
            className="w-7 h-7 grid place-items-center rounded-full hover:bg-black/20 transition-colors"
            title={t('socket.ui.publicLiveChat.minimize', { defaultValue: 'Minimize chat' })}
          >
            _
          </button>
          <button
            type="button"
            onClick={handleArchive}
            className="w-7 h-7 grid place-items-center rounded-full hover:bg-black/20 transition-colors"
            title={t('socket.ui.publicLiveChat.close', { defaultValue: 'Close chat' })}
          >
            ×
          </button>
        </div>
      </div>

      {userHasLeftConversation && !conversationIsClosed && (
        <div className="px-3 py-2 text-xs text-amber-200 bg-amber-500/10 border-b border-amber-400/40">
          {t('socket.ui.publicLiveChat.user_left_notice', {
            defaultValue: 'The visitor closed this chat.'
          })}
        </div>
      )}

      {conversationIsClosed && (
        <div className="px-3 py-2 text-xs text-rose-200 bg-rose-500/10 border-b border-rose-400/40">
          {t('socket.ui.publicLiveChat.closed_notice', {
            defaultValue: 'This conversation is closed.'
          })}
        </div>
      )}

      {/* Messages */}
      {!isMinimized && (
        <div
          ref={chatBoxRef}
          className="flex-1 overflow-y-auto px-3 py-3 space-y-2 bg-slate-900"
          aria-live="polite"
        >
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-xs text-slate-300 text-center">
              {t('socket.ui.publicLiveChat.empty', {
                defaultValue: 'No messages yet. Waiting for the user to start the chat.'
              })}
            </div>
          ) : (
            messages.map((message) => {
              const createdAt =
                message.createdAt || message.created_at || message.timestamp || null;
              const timeLabel = createdAt ? dayjs(createdAt).format('HH:mm') : '';
              const isAdmin = !!message.sender_is_admin;

              return (
                <div
                  key={message.public_message_id}
                  className={clsx('w-full flex', isAdmin ? 'justify-end' : 'justify-start')}
                >
                  <div className="flex flex-col items-end gap-1 max-w-[80%]">
                    <div
                      className={clsx(
                        'w-full px-3 py-2 rounded-2xl text-xs whitespace-pre-wrap break-words',
                        isAdmin ? accentClasses.bubbleMine : accentClasses.bubbleOther
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

                    {/* Actions for admin messages */}
                    {isAdmin && (
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
                            {t('socket.ui.publicLiveChat.delete_short', { defaultValue: 'Delete' })}
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
      )}

      {/* Typing indicator */}
      {!isMinimized && (
        <div className="h-5 flex items-center justify-center bg-slate-950 px-2 text-[11px] text-slate-300">
          <PublicTypingIndicator public_conversation_id={conversation.id} />
        </div>
      )}

      {/* Input */}
      {!isMinimized && (
        <div className="border-t border-slate-700 bg-slate-950 px-3 py-2 flex flex-col gap-2">
          <div className="flex gap-2 items-end">
            <textarea
              rows={1}
              value={draft}
              onChange={(e) => {
                const v = handleInputChange(e);
                setDraft(v);
              }}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              className="flex-1 resize-none rounded-lg px-2 py-2 text-sm text-black placeholder:text-slate-500 border border-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder={t('socket.ui.publicLiveChat.input_placeholder', {
                defaultValue: 'Write a reply…'
              })}
              disabled={conversationIsClosed}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!draft.trim() || isSending || conversationIsClosed}
              className={clsx('px-3 py-2 text-xs font-semibold rounded-lg', accentClasses.button)}
            >
              {t('socket.ui.publicLiveChat.send', { defaultValue: 'Send' })}
            </button>
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-300">
            <span>
              {t('socket.ui.publicLiveChat.admin_footer', {
                defaultValue: 'Admin view · multiple rooms supported.'
              })}
            </span>
            <button
              type="button"
              onClick={() => requestRefresh()}
              className="text-purple-300 hover:text-purple-100 underline-offset-2 hover:underline"
            >
              {t('socket.ui.publicLiveChat.refresh', { defaultValue: 'Refresh' })}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPublicLiveChatWidget() {
  const t = useTranslations();
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [openWindows, setOpenWindows] = useState([]);
  const [isViewingClosed, setIsViewingClosed] = useState(false);

  const {
    onNewConversation,
    onPublicRoomCreated,
    onPublicRoomClosed,
    onPublicRoomClosedInRoom,
    onPublicRoomUserLeft,
    joinPublicRoom,
    closePublicConversation,
    onPublicMessageCreated
  } = useSocketHub();

  const openConversations = useMemo(
    () => conversations.filter((conversation) => !conversation.is_closed),
    [conversations]
  );
  const closedConversations = useMemo(
    () => conversations.filter((conversation) => conversation.is_closed),
    [conversations]
  );
  const conversationsToDisplay = isViewingClosed ? closedConversations : openConversations;

  // Hydrate admin widget open state from cookie on mount
  useEffect(() => {
    const openFromCookie = getCookie(ADMIN_PUBLIC_CHAT_OPEN_COOKIE) === '1';
    setIsWidgetOpen(openFromCookie);
  }, []);

  // Persist admin widget open state in cookie
  useEffect(() => {
    setCookie(ADMIN_PUBLIC_CHAT_OPEN_COOKIE, isWidgetOpen ? '1' : '0');
  }, [isWidgetOpen]);

  // Listen for new conversations (server emits to admins)
  useEffect(() => {
    const offNew = onNewConversation((payload) => {
      if (!payload?.public_conversation_id) return;
      const normalized = normalizeConversation(payload);
      if (!normalized) return;

      setConversations((prev) => {
        const exists = prev.some((conversation) => conversation.id === normalized.id);
        if (exists) {
          return prev.map((conversation) =>
            conversation.id === normalized.id
              ? {
                  ...conversation,
                  ...normalized,
                  userHasLeft: normalized.userHasLeft ? true : conversation.userHasLeft
                }
              : conversation
          );
        }
        return [normalized, ...prev];
      });
    });

    const offCreated = onPublicRoomCreated?.((payload) => {
      if (!payload?.public_conversation_id) return;
      const normalized = normalizeConversation(payload);
      if (!normalized) return;

      setConversations((prev) => {
        const exists = prev.some((conversation) => conversation.id === normalized.id);
        if (exists) {
          return prev.map((conversation) =>
            conversation.id === normalized.id
              ? {
                  ...conversation,
                  ...normalized,
                  userHasLeft: normalized.userHasLeft ? true : conversation.userHasLeft
                }
              : conversation
          );
        }
        return [normalized, ...prev];
      });
    });

    const offClosed = onPublicRoomClosed?.((payload) => {
      const { public_conversation_id, is_closed, closedAt } = payload || {};
      if (!public_conversation_id) return;
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === public_conversation_id
            ? {
                ...conversation,
                is_closed: typeof is_closed === 'boolean' ? is_closed : true,
                closedAt: closedAt || new Date().toISOString(),
                userHasLeft: conversation.userHasLeft
              }
            : conversation
        )
      );
      setOpenWindows((prev) => prev.filter((id) => id !== public_conversation_id));
    });

    const offClosedInRoom = onPublicRoomClosedInRoom?.((payload) => {
      const { public_conversation_id, is_closed, closedAt } = payload || {};
      if (!public_conversation_id) return;
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === public_conversation_id
            ? {
                ...conversation,
                is_closed: typeof is_closed === 'boolean' ? is_closed : true,
                closedAt: closedAt || new Date().toISOString()
              }
            : conversation
        )
      );
      setOpenWindows((prev) => prev.filter((id) => id !== public_conversation_id));
    });

    const offUserLeft = onPublicRoomUserLeft?.((payload) => {
      if (!payload?.public_conversation_id) return;
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === payload.public_conversation_id
            ? { ...conversation, userHasLeft: true }
            : conversation
        )
      );
      setOpenWindows((prev) => prev.filter((id) => id !== payload.public_conversation_id));
    });

    return () => {
      offNew && offNew();
      offCreated && offCreated();
      offClosed && offClosed();
      offClosedInRoom && offClosedInRoom();
      offUserLeft && offUserLeft();
    };
  }, [
    onNewConversation,
    onPublicRoomCreated,
    onPublicRoomClosed,
    onPublicRoomClosedInRoom,
    onPublicRoomUserLeft
  ]);

  useEffect(() => {
    if (!onPublicMessageCreated) return;

    const offMessage = onPublicMessageCreated((payload) => {
      const conversationId = payload?.public_conversation_id;
      if (!conversationId || payload?.sender_is_admin) return;

      let shouldOpenWindow = true;

      setConversations((prev) => {
        const index = prev.findIndex((conversation) => conversation.id === conversationId);

        if (index === -1) {
          const normalized = normalizeConversation({
            public_conversation_id: conversationId,
            subject: payload.subject || payload.room_subject || 'Public chat',
            owner_name: payload.sender_name || payload.owner_name || 'Guest',
            owner_role: payload.sender_role || 'guest',
            created_at: payload.createdAt || payload.created_at || new Date().toISOString(),
            is_closed: false,
            userHasLeft: false
          });
          return [normalized, ...prev];
        }

        const existing = prev[index];
        if (existing.is_closed) {
          shouldOpenWindow = false;
        }

        if (!existing.userHasLeft) {
          shouldOpenWindow = shouldOpenWindow && true;
        }

        const updated = { ...existing, userHasLeft: false };

        if (existing.userHasLeft === updated.userHasLeft) {
          return prev;
        }

        const next = [...prev];
        next[index] = updated;
        return next;
      });

      if (shouldOpenWindow) {
        setOpenWindows((prev) => {
          if (prev.includes(conversationId)) return prev;
          return [...prev, conversationId];
        });
      }
    });

    return () => {
      offMessage && offMessage();
    };
  }, [onPublicMessageCreated]);

  // Open a conversation window
  const openWindow = useCallback(
    (conversationId) => {
      if (!conversationId) return;
      setOpenWindows((prev) => {
        if (prev.includes(conversationId)) return prev;
        return [...prev, conversationId];
      });
      joinPublicRoom(conversationId); // safe guard
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                userHasLeft: false
              }
            : c
        )
      );
    },
    [joinPublicRoom]
  );

  const closeWindow = useCallback((conversationId) => {
    setOpenWindows((prev) => prev.filter((id) => id !== conversationId));
  }, []);

  const archiveConversation = useCallback(
    (conversationId) => {
      if (!conversationId) return;
      closePublicConversation(conversationId);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === conversationId
            ? {
                ...c,
                is_closed: true
              }
            : c
        )
      );
      setOpenWindows((prev) => prev.filter((id) => id !== conversationId));
    },
    [closePublicConversation]
  );

  const removeConversationFromList = useCallback((conversationId) => {
    if (!conversationId) return;
    setConversations((prev) => prev.filter((c) => c.id !== conversationId));
    setOpenWindows((prev) => prev.filter((id) => id !== conversationId));
  }, []);

  // Render list of windows from IDs
  const windowsToRender = openWindows
    .map((id) => conversations.find((c) => c.id === id))
    .filter(Boolean);

  return (
    <div className="fixed bottom-4 left-4 z-[9999] flex items-end gap-4">
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsWidgetOpen((prev) => !prev)}
          className="flex items-center gap-2 px-4 py-3 rounded-full shadow-xl bg-gradient-to-r from-purple-900 via-purple-700 to-purple-600 border-b border-purple-500/60 text-white hover:from-purple-600 hover:to-purple-400 transition-all"
        >
          <span className="text-sm font-semibold">
            🛡️ {t('socket.ui.publicLiveChat.admin_button', { defaultValue: 'Admin Live Chat' })}
          </span>
          {openConversations.length > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.4rem] h-5 text-xs rounded-full bg-emerald-600 px-2">
              {openConversations.length}
            </span>
          )}
        </button>

        {isWidgetOpen && (
          <div className="absolute bottom-full left-0 mb-3 w-[380px] max-h-[520px] rounded-2xl shadow-2xl border border-black/30 bg-slate-950/95 text-white backdrop-blur-sm overflow-hidden flex flex-col z-[10000]">
            <div className="px-4 py-3 border-b border-purple-500/60 bg-gradient-to-r from-purple-900 via-purple-700 to-purple-600 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Public Live Chat (Admin)</div>
                <div className="text-[11px] opacity-80">
                  {t('socket.ui.publicLiveChat.admin_subtitle', {
                    defaultValue: 'Open multiple rooms at once'
                  })}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsViewingClosed((prev) => !prev)}
                className={clsx(
                  'px-3 py-1 text-[11px] font-semibold rounded-full transition-colors border border-white/20 shadow-sm',
                  isViewingClosed ? 'bg-slate-900 text-slate-100' : 'bg-emerald-600 text-white'
                )}
              >
                {isViewingClosed
                  ? t('socket.ui.publicLiveChat.show_open', { defaultValue: 'Show open chats' })
                  : t('socket.ui.publicLiveChat.show_closed', {
                      defaultValue: 'Show closed chats'
                    })}
              </button>
              <button
                type="button"
                onClick={() => setIsWidgetOpen(false)}
                className="w-7 h-7 grid place-items-center rounded-full hover:bg-black/20 transition-colors"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800">
              {conversationsToDisplay.length === 0 ? (
                <div className="p-4 text-sm text-slate-300">
                  {isViewingClosed
                    ? t('socket.ui.publicLiveChat.closed_empty', {
                        defaultValue: 'No closed conversations yet.'
                      })
                    : t('socket.ui.publicLiveChat.admin_empty', {
                        defaultValue: 'No public conversations yet. Users will appear here.'
                      })}
                </div>
              ) : (
                conversationsToDisplay.map((conversation) => {
                  const isClosed = Boolean(conversation.is_closed);
                  const userHasLeft = Boolean(conversation.userHasLeft);
                  const openDisabled = isViewingClosed || userHasLeft;

                  return (
                    <div
                      key={conversation.id}
                      className="p-3 hover:bg-slate-900/70 flex items-center justify-between gap-3"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-semibold text-purple-100">
                          {conversation.owner_name}
                        </div>
                        <div className="text-[11px] text-slate-300">
                          {conversation.subject} · {dayjs(conversation.createdAt).format('HH:mm')}
                        </div>
                        <div className="flex items-center gap-2 text-[10px]">
                          {userHasLeft && (
                            <span className="text-amber-300">
                              {t('socket.ui.publicLiveChat.visitor_left', {
                                defaultValue: 'Visitor left'
                              })}
                            </span>
                          )}
                          {isClosed && (
                            <span className="text-rose-300">
                              {t('socket.ui.publicLiveChat.closed_short', {
                                defaultValue: 'Closed'
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => !openDisabled && openWindow(conversation.id)}
                          disabled={openDisabled}
                          title={
                            openDisabled
                              ? t('socket.ui.publicLiveChat.user_left_notice', {
                                  defaultValue: 'The visitor closed this chat.'
                                })
                              : undefined
                          }
                          className={clsx(
                            'px-3 py-2 text-xs font-semibold rounded-lg transition-colors',
                            openDisabled
                              ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                              : 'bg-purple-600 hover:bg-purple-500'
                          )}
                        >
                          {t('socket.ui.publicLiveChat.open', { defaultValue: 'Open' })}
                        </button>
                        {!isClosed && !isViewingClosed ? (
                          <button
                            type="button"
                            onClick={() => archiveConversation(conversation.id)}
                            className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors"
                          >
                            {t('socket.ui.publicLiveChat.close_short', { defaultValue: 'Close' })}
                          </button>
                        ) : !isClosed && isViewingClosed ? null : (
                          <button
                            type="button"
                            onClick={() => removeConversationFromList(conversation.id)}
                            className="px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
                          >
                            {t('socket.ui.publicLiveChat.delete_conversation', {
                              defaultValue: 'Delete'
                            })}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-row gap-3 items-end">
        {windowsToRender.map((conversation) => (
          <AdminChatWindow
            key={conversation.id}
            conversation={conversation}
            onCloseWindow={closeWindow}
            onArchiveConversation={archiveConversation}
          />
        ))}
      </div>
    </div>
  );
}
