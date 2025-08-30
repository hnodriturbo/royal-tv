/**
 * ================================
 * 💬 LiveChatRoom.js – Royal TV
 * ================================
 * Live, real-time chat room for 1:1 support!
 * - Localized UI strings via useTranslations()
 * - No `t` inside effect deps to avoid loops
 */
'use client';

import logger from '@/lib/core/logger';
import { useState, useEffect, useRef, useCallback } from 'react';
import clsx from 'clsx';
import dayjs from 'dayjs';
import useRoomUsers from '@/hooks/socket/useRoomUsers';
import useMessageEvents from '@/hooks/socket/useMessageEvents';
import useUnreadMessages from '@/hooks/socket/useUnreadMessages';
import useRefreshMessages from '@/hooks/socket/useRefreshMessages';
import useTypingIndicator from '@/hooks/socket/useTypingIndicator';
import useAppHandlers from '@/hooks/useAppHandlers';
import RefreshMessages from '@/components/reusableUI/socket/RefreshMessages';
import TypingIndicator from '@/components/reusableUI/socket/TypingIndicator';
import { useCreateNotifications } from '@/hooks/socket/useCreateNotifications';
import useSocketHub from '@/hooks/socket/useSocketHub';
import { useTranslations } from 'next-intl'; // 🌍 translator

export default function LiveChatRoom({
  conversation_id,
  initialMessages = [],
  className = '',
  session,
  onEditMessageModal,
  onDeleteMessageModal,
  subject = '',
  user
}) {
  const t = useTranslations(); // 🌱 root-level translator

  // 🧭 who am I (for bubble styles)
  const currentUserRole = session?.user?.role;
  const { displayMessage } = useAppHandlers();

  // 💬 room state
  const [messages, setMessages] = useState(initialMessages);
  const [draftMessage, setDraftMessage] = useState('');

  // 👥 presence & unread
  const { usersInRoom } = useRoomUsers(conversation_id);
  const { unreadCount, markAllRead } = useUnreadMessages({ conversation_id });

  // 🔔 notifications
  const {
    createLiveChatMessageNotificationForAdminOnly,
    createLiveChatMessageNotificationForUserOnly
  } = useCreateNotifications();

  // 🔌 join/leave
  const { joinRoom, leaveRoom } = useSocketHub();

  // ✉️ message events
  const {
    sendMessage,
    editMessage,
    deleteMessage,
    onReceiveMessage,
    onMessageEdited,
    onMessageDeleted
  } = useMessageEvents(conversation_id);

  // ⌨️ typing
  const {
    isTyping,
    typingUser,
    isTypingLocal,
    handleInputChange,
    handleInputFocus,
    handleInputBlur
  } = useTypingIndicator(conversation_id);

  // 🔗 refs
  const chatBoxRef = useRef(null);
  const inputRef = useRef(null);

  // 🏠 join/leave
  useEffect(() => {
    joinRoom(conversation_id);
    return () => leaveRoom(conversation_id);
  }, [conversation_id, joinRoom, leaveRoom]);

  // 🎯 focus input on room change
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [conversation_id]);

  // 📡 live message listeners
  useEffect(() => {
    const stopReceive = onReceiveMessage((msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.message_id === msg.message_id)) return prev; // 🛡️ no dupes
        return [...prev, msg];
      });

      // 🔔 notify other party
      if (msg.sender_is_admin) {
        if (!user?.user_id) {
          logger.warn('[LiveChatRoom] Notification: user not ready, skipping...');
          return;
        }
        createLiveChatMessageNotificationForUserOnly(
          user,
          { ...msg, subject },
          { conversation_id: msg.conversation_id }
        );
      } else {
        createLiveChatMessageNotificationForAdminOnly(
          user,
          { ...msg, subject },
          { conversation_id: msg.conversation_id }
        );
      }
    });

    const stopEdit = onMessageEdited((editedMsg) => {
      setMessages((prev) =>
        prev.map((m) => (m.message_id === editedMsg.message_id ? { ...m, ...editedMsg } : m))
      );
    });

    const stopDelete = onMessageDeleted((deletedMsg) => {
      setMessages((prev) => prev.filter((m) => m.message_id !== deletedMsg.message_id));
    });

    return () => {
      stopReceive();
      stopEdit();
      stopDelete();
    };
  }, [
    onReceiveMessage,
    onMessageEdited,
    onMessageDeleted,
    createLiveChatMessageNotificationForAdminOnly,
    createLiveChatMessageNotificationForUserOnly,
    user,
    subject
  ]);

  // 🛎️ mark read on room switch
  useEffect(() => {
    markAllRead();
  }, [conversation_id, markAllRead]);

  // ⬇️ auto-scroll
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  // 🧭 my/other message
  const isOwnMessage = (msg) =>
    (currentUserRole === 'admin' && msg.sender_is_admin) ||
    (currentUserRole !== 'admin' && !msg.sender_is_admin);

  // 🖊️ input handlers
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

  // 🧑‍💻 UI
  return (
    <div className="text-pretty text-sm">
      <div className={clsx('container-style mx-auto flex flex-col gap-2 min-h-[400px]', className)}>
        {/* 🏷️ header */}
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold">
            {t('socket.ui.chat.subject_label')}
            <br /> <span className="text-wonderful-5 underline">{subject}</span>
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
        >
          {messages
            .slice()
            .reverse()
            .map((message, idx) => (
              <div
                key={message.message_id || `idx-${idx}`}
                className={clsx(
                  'w-2/3 min-w-[150px] max-w-[75%] p-2 rounded-lg',
                  isOwnMessage(message)
                    ? 'items-end justify-end self-end bg-blue-600 text-end'
                    : 'items-start justify-start self-start bg-gray-600 text-start'
                )}
              >
                <p className="break-words whitespace-pre-wrap">{message.message}</p>
                <div className="flex justify-between items-center mt-2">
                  {/* ✏️ edit/delete for own messages */}
                  {isOwnMessage(message) && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          onEditMessageModal?.(message.message_id, message.message, editMessage)
                        }
                        title={t('socket.ui.common.edit')}
                        style={{ cursor: 'pointer' }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onDeleteMessageModal?.(message.message_id, deleteMessage)}
                        title={t('socket.ui.common.delete')}
                        style={{ cursor: 'pointer' }}
                      >
                        🗑️
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
            showLocalForDebug={true}
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
          <RefreshMessages
            conversation_id={conversation_id}
            onRefreshed={(msgs) => {
              setMessages(msgs);
              displayMessage(t('socket.ui.chat.refreshed'), 'success');
            }}
          />
        </div>
      </div>
    </div>
  );
}
