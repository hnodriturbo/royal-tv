/**
 * 🔥 ChatRoom.js
 * --------------
 * Dumb (UI-only) component that handles:
 * • Joining socket rooms
 * • Live message rendering
 * • Sending, editing, deleting messages with modal support
 *
 * Props:
 * • conversation_id: string (required)
 * • className: string (optional – extra Tailwind classes)
 * • conversation: conversation data
 * • initialMessages: pre-loaded messages
 */

'use client'

// 1️⃣ React / Next / helpers
import { useEffect, useState, useRef, useCallback } from 'react'
import clsx from 'clsx'

// 2️⃣ hooks
import { useSession } from 'next-auth/react'
import { useChatRoom } from '@/hooks/socket/useChatRoom'
import useModal from '@/hooks/useModal'

// 3️⃣ component
export default function ChatRoom({
  conversation_id,
  conversation = {}, // 👉 whole Prisma record
  initialMessages = [],
  className = '',
  chatType = 'live'
}) {
  /* 🔑 session data */
  const { data: session } = useSession()
  const currentUserId = session?.user?.user_id
  const messageRef = useRef()
  // 💬 Socket hooks and state
  const { join, send, edit, remove, messages, users, isTyping, startTyping } =
    useChatRoom(conversation_id, {
      chatType,
      initialMessages
    })

  // 📝 Local UI state
  const [draftMessage, setDraftMessage] = useState('')
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editingMessageContent, setEditingMessageContent] = useState('')
  const [deletingMessageId, setDeletingMessageId] = useState(null)
  // 🔲 Modal controls
  const { openModal, hideModal } = useModal()

  // 🚪 Auto-scroll ref
  /*
  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
 */
  // 🚀 Join chat room on mount
  useEffect(() => {
    join()
  }, [join])

  // ✏️ Handle sending/editing messages
  // ✏️ Handle sending/editing messages
  const handleSendOrEdit = useCallback(() => {
    if (!draftMessage.trim()) return
    if (editingMessageId) {
      edit(editingMessageId, draftMessage)
      setEditingMessageId(null)
    } else {
      send(draftMessage)
    }
    setDraftMessage('')
    startTyping(conversation_id, false) // stop typing indicator
  }, [draftMessage, editingMessageId, edit, send, startTyping, conversation_id])

  // ✏️ Open edit modal
  const handleEditModal = (msgId, msgContent) => {
    setEditingMessageId(msgId)
    setEditingMessageContent(msgContent)

    openModal('editMessage', {
      title: 'Edit Message',
      customContent: () => {
        return (
          <div className="flex flex-col gap-4 rounded-lg">
            <textarea
              ref={messageRef}
              value={editingMessageContent}
              onChange={(e) => setEditingMessageContent(e.target.value)}
              className="border p-2 w-full h-24 text-black rounded-lg"
            />
          </div>
        )
      },
      onSave: () => {
        edit(msgId, editingMessageContent) // ✅ update with new content
        setEditingMessageId(null)
        hideModal()
      },
      onCancel: () => {
        setEditingMessageId(null)
        hideModal()
      }
    })
  }

  // ✏️ Open delete modal
  const handleDeleteModal = (msgId) => {
    setDeletingMessageId(msgId)
    openModal('deleteMessage', {
      title: 'Delete message',
      description: 'Are you sure you want to delete this message?',
      confirmButtonType: 'Danger',
      confirmButtonText: 'Delete Message',
      cancelButtonText: 'Cancel',
      msgId: deletingMessageId,
      onDelete: (msgId) => {
        remove(msgId)
        hideModal()
      },
      onCancel: () => {
        hideModal()
      }
    })
  }

  // 🖼️ UI Render
  return (
    <div className="text-pretty">
      <div
        className={clsx(
          'container mx-auto border p-4 flex flex-col gap-4',
          className
        )}
      >
        {/* 🏷️ Room header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">
            Conversation: {conversation.subject || 'Untitled Chat'}
          </h2>
          <span className="text-sm text-gray-400">{users.length} online</span>
        </div>

        {/* 💬 Message display */}
        <div className="flex-1 overflow-y-auto flex flex-col space-y-3">
          {messages.map((message) => {
            const isOwnMessage = message.user_id === currentUserId
            const alignment = isOwnMessage
              ? 'self-end bg-blue-600'
              : 'self-start bg-gray-500'
            return (
              <div
                key={message.message_id}
                className={clsx(
                  'max-w-[75%] p-3 rounded-lg text-white',
                  alignment
                )}
              >
                <p className="break-words whitespace-pre-wrap">
                  {message.message}
                </p>
                <div className="flex justify-between items-center mt-2 text-xs">
                  {isOwnMessage && (
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleEditModal(message.message_id, message.message)
                        }
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteModal(message.message_id)}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                  <span className="text-gray-300">
                    {new Date(message.createdAt).toLocaleTimeString()}
                    {message.status === 'edited' && (
                      <span className="italic ml-1">(edited)</span>
                    )}
                  </span>
                </div>
              </div>
            )
          })}

          {/* 💡 Typing Indicator */}
          {startTyping && (
            <div className="self-start italic text-sm text-gray-400">
              Someone is typing...
            </div>
          )}

          {/* 🔻 Bottom ref for auto-scroll */}
          <div ref={isTyping} />
        </div>

        {/* ✍️ Input area */}
        <div className="flex gap-2">
          <input
            value={draftMessage}
            onChange={handleSendOrEdit}
            onKeyDown={(e) => e.key === 'Enter' && handleSendOrEdit()}
            className="flex-1 p-2 border rounded text-black"
            placeholder="Type a message…"
          />
          <button
            onClick={handleSendOrEdit}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
