/**
 * ================================
 * 💬 LiveChatRoom.js – Royal TV
 * ================================
 * Live, real-time chat room for 1:1 support!
 * - Fully bubble-free, "live" chat only.
 * - Shows real-time messages, users, unread counts, typing, notifications, etc.
 * - Royal TV real-time emoji commenting everywhere! 🦁✨
 */

import logger from '@/lib/logger';
import { useState, useEffect, useRef, useCallback } from 'react';
import clsx from 'clsx'; // 🎨 Utility for clean conditional classes
import dayjs from 'dayjs'; // 🕒 Dates formatting
import useRoomUsers from '@/hooks/socket/useRoomUsers'; // 👥 Real-time users in room
import useMessageEvents from '@/hooks/socket/useMessageEvents'; // 💬 Message actions/events
import useUnreadMessages from '@/hooks/socket/useUnreadMessages'; // 🔔 Unread badge/count
import useRefreshMessages from '@/hooks/socket/useRefreshMessages'; // 🔄 Manual refresh
import useTypingIndicator from '@/hooks/socket/useTypingIndicator'; // 👀 Typing status
import useAppHandlers from '@/hooks/useAppHandlers'; // 🛎️ App-wide UI (messages, loaders)
import RefreshMessages from '@/components/reusableUI/socket/RefreshMessages'; // 🔄 Button to refresh messages
import TypingIndicator from '@/components/reusableUI/socket/TypingIndicator'; // 👀 Typing animation/label
import { useCreateNotifications } from '@/hooks/socket/useCreateNotifications'; // 🔔 For message delivery
import useSocketHub from '@/hooks/socket/useSocketHub'; // 🔌 Core socket actions

export default function LiveChatRoom({
  conversation_id, // 🆔 Room ID for this chat
  initialMessages = [], // 📨 Messages at mount
  className = '', // 🎨 Extra styling
  session, // 👤 User session for role
  onEditMessageModal, // ✏️ Modal handler (optional)
  onDeleteMessageModal, // 🗑️ Modal handler (optional)
  subject = '', // 🏷️ Conversation title/subject
  user // 👤 The user we're chatting with (for notifications)
}) {
  // 🏷️ Who am I? Needed for admin vs user message styling
  const currentUserRole = session?.user?.role;
  const { displayMessage } = useAppHandlers();

  // 💬 State for all messages in the room
  const [messages, setMessages] = useState(initialMessages);
  // 📝 Draft message (input box)
  const [draftMessage, setDraftMessage] = useState('');

  // 👥 Get real-time user list for this room
  const { usersInRoom } = useRoomUsers(conversation_id);

  // 🔔 Socket-driven notification helpers (admin/user delivery)
  const {
    createLiveChatMessageNotificationForAdminOnly,
    createLiveChatMessageNotificationForUserOnly
  } = useCreateNotifications();

  // 🔌 Room join/leave actions (keep room presence accurate!)
  const { joinRoom, leaveRoom } = useSocketHub();

  // 💬 Send/edit/delete + message listeners for this chat
  const {
    sendMessage,
    editMessage,
    deleteMessage,
    onReceiveMessage,
    onMessageEdited,
    onMessageDeleted
  } = useMessageEvents(conversation_id);

  // 👀 Typing status (local and remote)
  const {
    isTyping,
    typingUser,
    isTypingLocal,
    handleInputChange,
    handleInputFocus,
    handleInputBlur
  } = useTypingIndicator(conversation_id);

  // 🔔 Get unread count and mark-all-read action
  const { unreadCount, markAllRead } = useUnreadMessages({ conversation_id });

  // 🔗 Refs for scroll and focus control
  const chatBoxRef = useRef(null);
  const inputRef = useRef(null);

  // ===================== 👥 Room Presence (Join/Leave) =====================
  useEffect(() => {
    // 🏠 Join the conversation room on mount!
    joinRoom(conversation_id);
    return () => {
      // 🚪 Leave the room on unmount (cleanup for real-time accuracy)
      leaveRoom(conversation_id);
    };
  }, [conversation_id, joinRoom, leaveRoom]);

  // ===================== 🖱️ Focus on input when switching conversations =====================
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }, [conversation_id]);

  // ===================== 💬 Real-Time Message Handling =====================
  useEffect(() => {
    // 👂 Listen for new messages delivered via socket
    const stopReceive = onReceiveMessage((msg) => {
      setMessages((prevMessages) => {
        // 🛡️ Prevent duplicates (multi-tab, multi-receive safety)
        if (prevMessages.some((message) => message.message_id === msg.message_id))
          return prevMessages;
        return [...prevMessages, msg];
      });

      // 🟢 Always send notification on message delivery!
      if (msg.sender_is_admin) {
        // 👤 Notify user if admin sent (user must be loaded)
        if (!user || !user.user_id) {
          logger.warn('[LiveChatRoom] Notification: user not ready, skipping...');
          return;
        }
        createLiveChatMessageNotificationForUserOnly(
          user,
          { ...msg, subject },
          { conversation_id: msg.conversation_id }
        );
      } else {
        // 👑 Notify admin if user sent
        createLiveChatMessageNotificationForAdminOnly(
          user, // 👤 The actual user object!
          { ...msg, subject }, // 💬 Message fields
          { conversation_id: msg.conversation_id } // 💬 Conversation fields
        );
      }
    });

    // 👂 Listen for message edits
    const stopEdit = onMessageEdited((editedMsg) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.message_id === editedMsg.message_id ? { ...msg, ...editedMsg } : msg
        )
      );
    });

    // 👂 Listen for deletes (remove from state instantly)
    const stopDelete = onMessageDeleted((deletedMsg) => {
      setMessages((prevMessages) =>
        prevMessages.filter((msg) => msg.message_id !== deletedMsg.message_id)
      );
    });

    // 🧹 Clean up all listeners on unmount
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

  // ===================== 📝 Input Handlers =====================
  // User types in the input box (handles typing events)
  const handleInput = (e) => {
    setDraftMessage(handleInputChange(e)); // 👀 Typing tracking and text
  };

  // 🚀 Send message (when pressing Enter or clicking button)
  const handleSend = useCallback(() => {
    if (!draftMessage.trim()) return; // ⛔ Don't send empty messages!
    sendMessage(draftMessage);
    setDraftMessage(''); // 🧽 Clear input
    handleInputBlur(); // 👀 Stop typing signal
  }, [draftMessage, sendMessage, handleInputBlur]);

  // ⌨️ Handle Enter key for "send" (but allow Shift+Enter for newlines)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ===================== 🆔 Helper: Is This My Message? =====================
  // Used to style message bubbles and show edit/delete only for your own messages!
  const isOwnMessage = (msg) =>
    (currentUserRole === 'admin' && msg.sender_is_admin) ||
    (currentUserRole !== 'admin' && !msg.sender_is_admin);

  // ===================== ✏️ Modal Triggers =====================
  const handleEditModal = (msgId, msgContent) => {
    if (onEditMessageModal) {
      onEditMessageModal(msgId, msgContent, editMessage);
    }
  };
  const handleDeleteModal = (msgId) => {
    if (onDeleteMessageModal) {
      onDeleteMessageModal(msgId, deleteMessage);
    }
  };

  // ===================== 🔔 Mark all as read when convo changes =====================
  useEffect(() => {
    markAllRead();
  }, [conversation_id, markAllRead]);

  // ===================== 🔽 Scroll to bottom on new messages =====================
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [messages]);

  // ===================== 🖼️ UI RENDER =====================
  return (
    <div className="text-pretty text-sm">
      <div className={clsx('container-style mx-auto flex flex-col gap-2 min-h-[400px]', className)}>
        {/* 🏷️ Header – Subject + unread/user count */}
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold">
            Conversation Subject:<br></br>{' '}
            <span className="text-wonderful-5 underline"> {subject}</span>
          </h2>
          <span>
            {usersInRoom.length} online <br></br>{' '}
            <span className="whitespace-nowrap">🔔 {unreadCount} unread</span>
          </span>
        </div>

        {/* 💬 Message bubbles (auto-scroll, reverse order) */}
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
                    ? 'items-end justify-end self-end bg-blue-600 text-end' // 🟦 My messages: right, blue
                    : 'items-start justify-start self-start bg-gray-600 text-start' // 🟩 Others: left, gray
                )}
              >
                <p className="break-words whitespace-pre-wrap">{message.message}</p>
                <div className="flex justify-between items-center mt-2">
                  {/* ✏️ Edit/Delete only for own messages */}
                  {isOwnMessage(message) && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditModal(message.message_id, message.message)}
                        title="Edit"
                        style={{ cursor: 'pointer' }}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteModal(message.message_id)}
                        title="Delete"
                        style={{ cursor: 'pointer' }}
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                  <span className="text-gray-300">
                    {dayjs(message.createdAt).format('HH:mm')}
                    {message.status === 'edited' && <span className="italic ml-1">(edited)</span>}
                  </span>
                </div>
              </div>
            ))}
        </div>

        {/* 👀 Typing Indicator (fixed height so layout never shifts) */}
        <div className="h-6 flex justify-center items-center">
          <TypingIndicator
            isTyping={isTyping}
            isTypingLocal={isTypingLocal}
            typingUser={typingUser}
            showLocalForDebug={true}
          />
        </div>

        {/* ✍️ Input box – Compose and send messages */}
        <div className="flex gap-1 p-2 border-t border-gray-600">
          <input
            ref={inputRef}
            value={draftMessage}
            onChange={handleInput}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            className="flex-1 p-2 border rounded text-lg text-black focus:outline-none"
            placeholder="Type a message…"
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-[#28a745] text-white rounded shadow disabled:opacity-50"
            disabled={!draftMessage.trim()}
          >
            Send
          </button>
        </div>

        {/* 🔄 Refresh messages button */}
        <div className="flex justify-center mt-4">
          <RefreshMessages
            conversation_id={conversation_id}
            onRefreshed={(msgs) => {
              setMessages(msgs);
              displayMessage('Messages refreshed!', 'success');
            }}
          />
        </div>
      </div>
    </div>
  );
}
