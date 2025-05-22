/**
 * 🔥 ChatRoom.js
 * Dumb (UI-only) component for live & bubble chat
 * Handles joining, live rendering, sending, editing, deleting messages
 * Props:
 * • conversation_id: string (required)
 * • className: string (optional – extra Tailwind classes)
 * • conversation: conversation data
 * • initialMessages: pre-loaded messages
 * • chatType: 'live' | 'bubble'
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import clsx from 'clsx';
import { useSession } from 'next-auth/react';
import { useChatRoom } from '@/hooks/socket/useChatRoom';
import useModal from '@/hooks/useModal';
import useAppHandlers from '@/hooks/useAppHandlers';

export default function ChatRoom({
  conversation_id,
  conversation = {},
  initialMessages = [],
  className = '',
  chatType = 'live'
}) {
  // 1️⃣ Get session for user id
  const { data: session } = useSession();
  const currentUserId = session?.user?.user_id;
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  // 2️⃣ Unified socket chat logic
  const {
    send,
    edit,
    remove,
    messages,
    users,
    isTyping,
    startTyping,
    joinRoom,
    leaveRoom,
    markRead
  } = useChatRoom(conversation_id, {
    chatType,
    initialMessages
  });
  // 3️⃣ Local UI state
  const [draftMessage, setDraftMessage] = useState('');
  const [editingMessageId, setEditingMessageId] = useState(null);
  const textAreaRef = useRef(null);

  // 4️⃣ Modal helpers
  const { openModal, hideModal } = useModal();

  // 5️⃣ Join room on mount
  useEffect(() => {
    joinRoom(chatType, conversation_id);
    if (chatType === 'live') markRead('conversation', conversation_id);
    return () => leaveRoom(chatType, conversation_id);
    // Only when id or type change
  }, [chatType, conversation_id, joinRoom, markRead]);

  // 6️⃣ Edit modal logic
  const handleEditModal = (msgId, msgContent) => {
    setEditingMessageId(msgId);
    let tempContent = msgContent;

    openModal('editMessage', {
      title: 'Edit Message',
      confirmButtonText: 'Save Edited Message',
      cancelButtonText: 'Cancel',
      customContent: () => (
        <textarea
          defaultValue={tempContent}
          ref={textAreaRef}
          onChange={(e) => {
            tempContent = e.target.value;
          }}
          className="border p-2 w-full h-24 text-black rounded-lg"
        />
      ),
      onSave: () => {
        try {
          const updated = textAreaRef.current?.value?.trim();
          if (updated) {
            displayMessage('Message was update!', 'success');
            edit(msgId, updated);
            hideModal();
          }
        } catch (error) {
          displayMessage('There was an error editing the message', 'error');
        }
      },
      onCancel: hideModal
    });
  };

  // 7️⃣ Delete modal logic
  const handleDeleteModal = (msgId) => {
    openModal('deleteMessage', {
      title: 'Delete message',
      description: 'Are you sure you want to delete this message?',
      confirmButtonType: 'Danger',
      confirmButtonText: 'Delete Message',
      cancelButtonText: 'Cancel',
      onDelete: () => {
        remove(msgId);
        hideModal();
      },
      onCancel: hideModal
    });
  };

  // 8️⃣ Send or edit message logic
  const handleSend = useCallback(() => {
    if (!draftMessage.trim()) return;
    send(draftMessage);
    setDraftMessage('');
  }, [draftMessage, send]);

  // 9️⃣ Handle typing indicator
  useEffect(() => {
    if (!currentUserId) return;
    if (draftMessage) {
      startTyping(true);
    } else {
      startTyping(false);
    }
    // Cleanup on unmount
    return () => startTyping(false);
  }, [draftMessage, startTyping, currentUserId]);

  // 🖼️ UI Render
  return (
    <div className="text-pretty text-sm w-full">
      <div className={clsx('container-style mx-auto flex flex-col gap-2', className)}>
        {/* 🏷️ Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold">
            Conversation: {conversation.subject || 'Untitled Chat'}
          </h2>
          <span className="text-xs text-gray-400">{users.length} online</span>
        </div>

        {/* 👀 Typing Indicator */}
        {isTyping && <div className="text-xs text-blue-400 italic">Someone is typing...</div>}

        {/* 💬 Messages */}
        <div className="flex-1 overflow-y-auto flex flex-col space-y-2 max-h-[350px]">
          {messages.map((message) => {
            const isOwnMessage =
              (session?.user?.role === 'admin' && message.sender_is_admin) ||
              (session?.user?.role !== 'admin' && !message.sender_is_admin);

            return (
              <div
                key={message.message_id}
                className={clsx(
                  'w-2/3 min-w-[150px] max-w-[75%] p-2 rounded-lg text-xs',
                  isOwnMessage
                    ? 'items-end justify-end self-end bg-blue-600 text-end'
                    : 'items-start justify-start self-start bg-gray-600 text-start'
                )}
              >
                <p className="break-words whitespace-pre-wrap">{message.message}</p>
                <div className="flex justify-between items-center mt-2 text-xs">
                  {session?.user?.role === 'admin' && message.sender_is_admin && (
                    <div className="flex gap-2">
                      <button onClick={() => handleEditModal(message.message_id, message.message)}>
                        ✏️
                      </button>
                      <button onClick={() => handleDeleteModal(message.message_id)}>🗑️</button>
                    </div>
                  )}
                  <span className="text-gray-300">
                    {new Date(message.createdAt).toLocaleTimeString()}
                    {message.status === 'edited' && <span className="italic ml-1">(edited)</span>}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* ✍️ Input box */}
        <div className="flex gap-1">
          <input
            value={draftMessage}
            onChange={(e) => setDraftMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendOrEdit()}
            className="flex-1 p-1 border rounded text-sm text-black"
            placeholder="Type a message…"
          />
          <button onClick={handleSend} className="btn-success btn-sm">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
