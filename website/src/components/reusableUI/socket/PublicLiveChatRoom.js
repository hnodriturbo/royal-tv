/**
 * PublicLiveChatRoom.js – Royal TV
 * Live, real-time PUBLIC chat room (lobby-style, many users)!
 * - Mirrors LiveChatRoom.js structure exactly
 * - Uses simplified public chat hooks
 */
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import clsx from 'clsx';
import dayjs from 'dayjs';
import useAppHandlers from '@/hooks/useAppHandlers';
import usePublicMessageEvents from '@/hooks/socket/usePublicMessageEvents';
import usePublicRoomUsers from '@/hooks/socket/usePublicRoomUsers';
import useSocketHub from '@/hooks/socket/useSocketHub';
import usePublicTypingIndicator from '@/hooks/socket/usePublicTypingIndicator';
import usePublicUnreadMessages from '@/hooks/socket/usePublicUnreadMessages';
import usePublicRefreshMessages from '@/hooks/socket/usePublicRefreshMessages';

import TypingIndicator from '@/components/reusableUI/socket/TypingIndicator';
import { useTranslations } from 'next-intl';
import { SafeString } from '@/lib/ui/SafeString';

export default function PublicLiveChatRoom({
  public_conversation_id,
  initialMessages = [],
  className = '',
  session,
  onEditMessageModal,
  onDeleteMessageModal,
  subject = '',
  user
}) {
  const t = useTranslations();
  const currentUserRole = session?.user?.role;
  const { displayMessage } = useAppHandlers();

  // 💬 room state
  const [messages, setMessages] = useState(initialMessages || []);
  const [draftMessage, setDraftMessage] = useState('');

  // 👥 presence & unread
  const { usersInRoom } = usePublicRoomUsers(public_conversation_id);
  const { unreadCount, markAllRead } = usePublicUnreadMessages({ public_conversation_id });

  // 🔌 join/leave
  const { joinPublicRoom, leavePublicRoom } = useSocketHub();

  // ✉️ message events
  const {
    sendMessage,
    editMessage,
    deleteMessage,
    onReceiveMessage,
    onMessageEdited,
    onMessageDeleted
  } = usePublicMessageEvents(public_conversation_id);

  // ⌨️ typing
  const {
    isTyping,
    typingUser,
    isTypingLocal,
    handleInputChange,
    handleInputFocus,
    handleInputBlur
  } = usePublicTypingIndicator(public_conversation_id);

  // 🔄 refresh messages
  const { refreshPublicMessages, onPublicMessagesRefreshed } = usePublicRefreshMessages();

  // 🔗 refs
  const chatBoxRef = useRef(null);
  const inputRef = useRef(null);

  // 🏠 join/leave lifecycle
  useEffect(() => {
    joinPublicRoom(public_conversation_id);
    return () => leavePublicRoom(public_conversation_id);
  }, [public_conversation_id, joinPublicRoom, leavePublicRoom]);

  // 🎯 focus input on room change
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [public_conversation_id]);

  // 📡 live message listeners
  useEffect(() => {
    const stopReceive = onReceiveMessage((data) => {
      const msg = data.message || data;
      setMessages((prev) => {
        if (prev.some((m) => m.public_message_id === msg.public_message_id)) return prev; // 🛡️ no dupes
        return [...prev, msg];
      });
    });

    const stopEdit = onMessageEdited((data) => {
      const editedMsg = data.message || data;
      setMessages((prev) =>
        prev.map((m) =>
          m.public_message_id === editedMsg.public_message_id ? { ...m, ...editedMsg } : m
        )
      );
    });

    const stopDelete = onMessageDeleted((data) => {
      const deletedId = data.public_message_id || data;
      setMessages((prev) => prev.filter((m) => m.public_message_id !== deletedId));
    });

    return () => {
      stopReceive();
      stopEdit();
      stopDelete();
    };
  }, [onReceiveMessage, onMessageEdited, onMessageDeleted]);

  // 🔄 refresh messages listener
  useEffect(() => {
    const stop = onPublicMessagesRefreshed((data) => {
      if (data.public_conversation_id === public_conversation_id) {
        setMessages(data.messages || []);
        displayMessage(t('socket.ui.chat.refreshed'), 'success');
      }
    });
    return () => stop();
  }, [public_conversation_id, onPublicMessagesRefreshed, displayMessage, t]);

  // 🛎️ mark read on room switch
  useEffect(() => {
    markAllRead();
  }, [public_conversation_id, markAllRead]);

  // ⬇️ auto-scroll
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  const isOwnMessage = (msg) => {
    // Check if message belongs to current user
    if (currentUserRole === 'admin' && msg.sender_is_admin) return true;
    if (currentUserRole !== 'admin' && !msg.sender_is_admin && msg.sender_user_id === user?.user_id)
      return true;
    return false;
  };

  const handleInput = (e) => {
    setDraftMessage(handleInputChange(e));
  };

  const handleSend = useCallback(() => {
    if (!draftMessage.trim()) return;
    sendMessage(draftMessage);
    setDraftMessage('');
    handleInputBlur();
  }, [draftMessage, sendMessage, handleInputBlur]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRefresh = () => {
    refreshPublicMessages(public_conversation_id);
  };

  const subjectText = SafeString(subject, '') || t('socket.ui.publicLiveChatRoom.default_subject');

  return (
    <div className="text-pretty text-sm">
      <div className={clsx('container-style mx-auto flex flex-col gap-2 min-h-[400px]', className)}>
        {/* 🏷️ header */}
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold">
            {t('socket.ui.chat.subject_label')}
            <br /> <span className="text-wonderful-5 underline">{subjectText}</span>
          </h2>
          <span>
            {t('socket.ui.chat.online_count_label', { count: usersInRoom.length })}
            <br />
            <span className="whitespace-nowrap">
              🔔 {t('socket.ui.chat.unread_count_label', { count: unreadCount })}
            </span>
          </span>
        </div>

        {/* 💬 messages */}
        <div
          className="flex-1 overflow-y-auto flex flex-col-reverse space-y-2 gap-2 max-h-[500px]"
          ref={chatBoxRef}
          aria-live="polite"
        >
          {messages
            .slice()
            .reverse()
            .map((message, idx) => (
              <div
                key={message.public_message_id || `idx-${idx}`}
                className={clsx(
                  'w-2/3 min-w-[150px] max-w-[75%] p-2 rounded-lg',
                  isOwnMessage(message)
                    ? 'items-end justify-end self-end bg-blue-600 text-end'
                    : 'items-start justify-start self-start bg-gray-600 text-start'
                )}
              >
                <p className="break-words whitespace-pre-wrap">
                  {SafeString(message.message, 'PublicLiveChatRoom.message')}
                </p>
                <div className="flex justify-between items-center mt-2">
                  {isOwnMessage(message) && (
                    <div className="flex gap-2">
                      {/* ✏️ Edit */}
                      <button
                        type="button"
                        onClick={() =>
                          onEditMessageModal?.(
                            message.public_message_id,
                            SafeString(message.message, ''),
                            editMessage
                          )
                        }
                        title={SafeString(t('socket.ui.common.edit'), '')}
                        aria-label={SafeString(t('socket.ui.common.edit'), '')}
                      >
                        <span aria-hidden>✏️</span>
                      </button>
                      {/* 🗑️ Delete */}
                      <button
                        type="button"
                        onClick={() =>
                          onDeleteMessageModal?.(
                            SafeString(message.public_message_id, ''),
                            deleteMessage
                          )
                        }
                        title={SafeString(t('socket.ui.common.delete'), '')}
                        aria-label={SafeString(t('socket.ui.common.delete'), '')}
                      >
                        <span aria-hidden>🗑️</span>
                      </button>
                    </div>
                  )}
                  <span className="text-gray-300">
                    {dayjs(message.createdAt).format('HH:mm')}
                    {message.status === 'edited' && (
                      <span className="italic ml-1">{t('socket.ui.chat.edited')}</span>
                    )}
                  </span>
                </div>
              </div>
            ))}
        </div>

        {/* 👀 typing */}
        <div className="h-6 flex justify-center items-center">
          <TypingIndicator
            isTyping={isTyping}
            isTypingLocal={isTypingLocal}
            typingUser={typingUser}
            showLocalForDebug={false}
          />
        </div>

        {/* ✍️ input */}
        <div className="flex gap-1 p-2 border-t border-gray-600">
          <input
            ref={inputRef}
            value={draftMessage}
            onChange={handleInput}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            className="flex-1 p-2 border rounded text-lg text-black focus:outline-none"
            placeholder={t('socket.ui.chat.input_placeholder')}
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-[#28a745] text-white rounded shadow disabled:opacity-50"
            disabled={!draftMessage.trim()}
          >
            {t('socket.ui.chat.send')}
          </button>
        </div>

        {/* 🔄 refresh */}
        <div className="flex justify-center mt-4">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700"
          >
            {t('socket.ui.chat.refresh_button')}
          </button>
        </div>
      </div>
    </div>
  );
}
