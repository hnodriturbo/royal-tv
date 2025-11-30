/**
 * ============== AdminPublicChatWidget (MULTI-ROOM) ==============
 * 👑 Admin widget that handles multiple simultaneous public chat conversations
 * ---------------------------------------------------------------
 * FEATURES:
 *   • Multiple chat windows (up to 5+ simultaneously)
 *   • Horizontal stacking (each window appears next to previous one)
 *   • Per-room unread counts
 *   • Global unread indicator on main widget
 *   • Auto-notification when new conversations arrive
 *   • Each window is independently minimizable/closeable
 */
'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import usePublicLiveChat from '@/hooks/socket/usePublicLiveChat';

// 📐 Layout constants
const WIDGET_WIDTH = 320; // Width of each chat window
const WIDGET_SPACING = 16; // Gap between windows
const MAIN_BUTTON_WIDTH = 200; // Main widget button width

export default function AdminPublicChatWidget() {
  const t = useTranslations();
  const chat = usePublicLiveChat();

  // 🗂️ Active conversations (array of room objects)
  const [conversations, setConversations] = useState([]);
  // { roomId, subject, messages: [], draft: '', isMinimized: false, unreadCount: 0, ownerName: '' }

  // 🔔 Global unread count (across all rooms)
  const [totalUnread, setTotalUnread] = useState(0);

  // 🔀 Main widget visibility
  const [isMainWidgetOpen, setIsMainWidgetOpen] = useState(false);

  // 📝 Track which conversations have been bootstrapped
  const bootstrappedRooms = useRef(new Set());

  /* ========================================
   * 🔔 LISTEN FOR NEW CONVERSATION NOTIFICATIONS
   * ======================================*/
  useEffect(() => {
    if (!chat?.onNewConversation) return;

    const cleanup = chat.onNewConversation(
      ({ public_conversation_id, subject, owner_name, createdAt, messages }) => {
        console.log('[Admin] 🆕 New conversation detected:', {
          public_conversation_id,
          subject,
          owner_name,
          messageCount: messages?.length || 0
        });

        // Check if conversation already exists
        setConversations((prev) => {
          const exists = prev.some((c) => c.roomId === public_conversation_id);
          if (exists) return prev;

          // Add new conversation window with pre-loaded messages
          return [
            ...prev,
            {
              roomId: public_conversation_id,
              subject: subject || 'Public Chat',
              ownerName: owner_name || 'Guest',
              messages: Array.isArray(messages) ? messages : [],
              draft: '',
              isMinimized: false,
              unreadCount: 0,
              createdAt
            }
          ];
        });

        // Auto-join the room
        chat.joinPublicRoom(public_conversation_id);

        // If no messages were pre-loaded, refresh
        if (!messages || messages.length === 0) {
          chat.refreshPublicMessages(public_conversation_id, 50);
        }
      }
    );

    return cleanup;
  }, [chat]);

  /* ========================================
   * 📨 MESSAGE LISTENERS - Set up for ALL active rooms
   * ======================================*/
  useEffect(() => {
    if (!chat?.setupMessageListeners) return;

    const cleanupFunctions = conversations.map((conv) => {
      if (bootstrappedRooms.current.has(conv.roomId)) {
        return null; // Already bootstrapped
      }

      bootstrappedRooms.current.add(conv.roomId);

      return chat.setupMessageListeners({
        activeRoomId: conv.roomId,
        onMessageCreated: (message) => {
          setConversations((prev) =>
            prev.map((c) =>
              c.roomId === conv.roomId
                ? { ...c, messages: [...c.messages, message], unreadCount: c.unreadCount + 1 }
                : c
            )
          );
        },
        onMessageEdited: (message) => {
          setConversations((prev) =>
            prev.map((c) =>
              c.roomId === conv.roomId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.public_message_id === message.public_message_id ? message : m
                    )
                  }
                : c
            )
          );
        },
        onMessageDeleted: (messageId) => {
          setConversations((prev) =>
            prev.map((c) =>
              c.roomId === conv.roomId
                ? { ...c, messages: c.messages.filter((m) => m.public_message_id !== messageId) }
                : c
            )
          );
        },
        onMessagesRefreshed: (list) => {
          setConversations((prev) =>
            prev.map((c) =>
              c.roomId === conv.roomId ? { ...c, messages: Array.isArray(list) ? list : [] } : c
            )
          );
        }
      });
    });

    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup?.());
    };
  }, [chat, conversations]);

  /* ========================================
   * 🔔 ADMIN GLOBAL UNREAD LISTENER
   * ======================================*/
  useEffect(() => {
    if (!chat?.onPublicUnreadAdmin) return;

    const cleanup = chat.onPublicUnreadAdmin(({ total }) => {
      setTotalUnread(total || 0);
    });

    return cleanup;
  }, [chat]);

  /* ========================================
   * 📤 SEND MESSAGE HANDLER
   * ======================================*/
  const handleSend = useCallback(
    (roomId) => {
      setConversations((prev) => {
        const conv = prev.find((c) => c.roomId === roomId);
        if (!conv || !conv.draft.trim()) return prev;

        chat.sendPublicMessage(roomId, conv.draft);
        chat.sendPublicTyping(roomId, false);

        return prev.map((c) => (c.roomId === roomId ? { ...c, draft: '' } : c));
      });
    },
    [chat]
  );

  /* ========================================
   * ⌨️ TYPING HANDLERS
   * ======================================*/
  const handleDraftChange = useCallback((roomId, value) => {
    setConversations((prev) => prev.map((c) => (c.roomId === roomId ? { ...c, draft: value } : c)));
  }, []);

  /* ========================================
   * 🗂️ MINIMIZE / CLOSE HANDLERS
   * ======================================*/
  const handleMinimize = useCallback((roomId) => {
    setConversations((prev) =>
      prev.map((c) => (c.roomId === roomId ? { ...c, isMinimized: true } : c))
    );
  }, []);

  const handleMaximize = useCallback(
    (roomId) => {
      setConversations((prev) =>
        prev.map((c) => (c.roomId === roomId ? { ...c, isMinimized: false, unreadCount: 0 } : c))
      );
      chat.markPublicMessagesRead(roomId);
    },
    [chat]
  );

  const handleClose = useCallback(
    (roomId) => {
      chat.leavePublicRoom(roomId);
      setConversations((prev) => prev.filter((c) => c.roomId !== roomId));
      bootstrappedRooms.current.delete(roomId);
    },
    [chat]
  );

  /* ========================================
   * 🧹 MARK ALL READ HANDLER + LISTENER
   * ======================================*/
  const handleMarkAllRead = useCallback(() => {
    if (!chat?.markAllPublicMessagesRead) return;

    chat.markAllPublicMessagesRead();

    // Optimistically reset unread count
    setTotalUnread(0);
    setConversations((prev) => prev.map((c) => ({ ...c, unreadCount: 0 })));
  }, [chat]);

  // Listen for confirmation from server
  useEffect(() => {
    if (!chat?.onAllPublicMessagesMarkedRead) return;

    const cleanup = chat.onAllPublicMessagesMarkedRead(() => {
      console.log('[Admin] ✅ All messages marked as read confirmed');
      setTotalUnread(0);
      setConversations((prev) => prev.map((c) => ({ ...c, unreadCount: 0 })));
    });

    return cleanup;
  }, [chat]);

  /* ========================================
   * 🎨 RENDER
   * ======================================*/

  // Calculate positions for each window (stack vertically from bottom-up)
  const getWindowPosition = (index) => {
    // Bottom position: main button height (60px) + spacing + (index * window height + spacing)
    const WINDOW_HEIGHT = 500; // Approximate height of chat window
    const BUTTON_HEIGHT = 60;
    return BUTTON_HEIGHT + WIDGET_SPACING + index * (WINDOW_HEIGHT + WIDGET_SPACING);
  };

  return (
    <div className="fixed bottom-4 left-4 z-[1000]">
      {/* 🎛️ MAIN WIDGET BUTTON (always visible) */}
      <button
        onClick={() => setIsMainWidgetOpen(!isMainWidgetOpen)}
        className="flex items-center gap-2 px-4 py-3 rounded-full shadow-xl bg-gradient-to-r from-purple-900 to-purple-700 text-white hover:from-purple-800 hover:to-purple-600 transition-all"
        aria-label="Admin Public Chat"
      >
        <span className="font-medium text-sm">👑 Admin Chat</span>
        {totalUnread > 0 && (
          <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 rounded-full text-xs bg-red-500 px-2">
            {totalUnread}
          </span>
        )}
      </button>

      {/* 📋 CONVERSATIONS LIST (when main widget is open) */}
      <AnimatePresence>
        {isMainWidgetOpen && (
          <motion.div
            initial={{ opacity: 0, scaleY: 0.5, y: 40 }}
            animate={{ opacity: 1, scaleY: 1, y: 0 }}
            exit={{ opacity: 0, scaleY: 0.5, y: 40 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ transformOrigin: 'bottom left' }}
            className="mt-3 w-[18rem] max-h-[400px] overflow-y-auto rounded-2xl shadow-2xl border border-black/10 bg-white/95 backdrop-blur-sm"
          >
            <div className="px-4 py-3 bg-gradient-to-r from-purple-900 to-purple-700 text-white">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">
                  Active Conversations ({conversations.length})
                </span>
                {totalUnread > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs px-2 py-1 rounded bg-white/20 hover:bg-white/30 transition-colors"
                    title="Mark all as read"
                  >
                    🧹 Clear All
                  </button>
                )}
              </div>
            </div>
            <div className="p-2 space-y-2">
              {conversations.length === 0 ? (
                <div className="text-center text-sm text-slate-500 py-8">
                  No active conversations
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.roomId}
                    onClick={() => handleMaximize(conv.roomId)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{conv.ownerName}</div>
                        <div className="text-xs text-slate-500 truncate">{conv.subject}</div>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 rounded-full text-xs bg-red-500 text-white px-2">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 💬 INDIVIDUAL CHAT WINDOWS (stacked horizontally) */}
      <AnimatePresence>
        {conversations
          .filter((conv) => !conv.isMinimized)
          .map((conv, index) => (
            <ChatWindow
              key={conv.roomId}
              conversation={conv}
              position={getWindowPosition(index)}
              onSend={() => handleSend(conv.roomId)}
              onDraftChange={(value) => handleDraftChange(conv.roomId, value)}
              onMinimize={() => handleMinimize(conv.roomId)}
              onClose={() => handleClose(conv.roomId)}
              chat={chat}
            />
          ))}
      </AnimatePresence>
    </div>
  );
}

/* ========================================
 * 💬 INDIVIDUAL CHAT WINDOW COMPONENT
 * ======================================*/
function ChatWindow({ conversation, position, onSend, onDraftChange, onMinimize, onClose, chat }) {
  const t = useTranslations();
  const scrollRef = useRef(null);
  const [typingUser, setTypingUser] = useState(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation.messages]);

  // Typing listener
  useEffect(() => {
    if (!chat?.setupTypingListener) return;

    return chat.setupTypingListener({
      activeRoomId: conversation.roomId,
      onTypingUpdate: (user) => {
        setTypingUser(user);
      }
    });
  }, [chat, conversation.roomId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed',
        bottom: `${position}px`,
        left: '4px',
        width: `${WIDGET_WIDTH}px`,
        zIndex: 999
      }}
      className="rounded-2xl shadow-2xl border border-black/10 bg-white/95 backdrop-blur-sm overflow-hidden"
    >
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-900 to-purple-700 text-white">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm truncate">{conversation.ownerName}</div>
          <div className="text-xs text-purple-200 truncate">{conversation.subject}</div>
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={onMinimize}
            className="w-7 h-7 grid place-items-center rounded-full hover:bg-white/10 transition-colors"
            title="Minimize"
          >
            <span className="text-lg leading-none">−</span>
          </button>
          <button
            onClick={onClose}
            className="w-7 h-7 grid place-items-center rounded-full hover:bg-white/10 transition-colors"
            title="Close"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>
      </div>

      {/* MESSAGES */}
      <div ref={scrollRef} className="h-[380px] overflow-y-auto px-4 py-4 space-y-3 bg-slate-100">
        {conversation.messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-slate-500">
            No messages yet
          </div>
        ) : (
          conversation.messages.map((msg) => (
            <MessageBubble
              key={msg.public_message_id}
              text={msg.message}
              timestamp={msg.createdAt}
              isOwnMessage={msg.sender_is_admin}
            />
          ))
        )}
      </div>

      {/* FOOTER */}
      <div className="border-t border-slate-200 px-4 py-3 bg-white">
        {typingUser?.name && (
          <div className="text-xs text-slate-500 mb-2">
            <span className="italic">{typingUser.name} is typing...</span>
          </div>
        )}
        <div className="flex items-end gap-2">
          <textarea
            className="flex-1 resize-none rounded-xl px-3 py-2 text-sm border border-slate-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
            rows={1}
            value={conversation.draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
          />
          <button
            onClick={onSend}
            disabled={!conversation.draft.trim()}
            className="shrink-0 rounded-xl px-4 py-2 text-sm font-medium bg-purple-900 text-white hover:bg-purple-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Send
          </button>
        </div>
      </div>
    </motion.div>
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
            ? 'bg-gradient-to-br from-purple-700 to-purple-900 text-white rounded-br-sm shadow-md'
            : 'bg-gradient-to-br from-blue-50 to-purple-50 text-black border border-slate-300 rounded-bl-sm shadow-sm'
        }`}
      >
        <p className="text-sm leading-relaxed break-words">{text}</p>
        {formattedTime && (
          <p className={`text-[10px] mt-1 ${isOwnMessage ? 'text-purple-200' : 'text-slate-500'}`}>
            {formattedTime}
          </p>
        )}
      </div>
    </div>
  );
}
