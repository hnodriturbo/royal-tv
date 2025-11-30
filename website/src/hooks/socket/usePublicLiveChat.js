/**
 * ============== usePublicLiveChat (AGGREGATOR + LISTENERS) ==============
 * 🎯 Aggregates all dedicated public chat hooks into one clean API
 * 🎧 Provides callback-based listener setup functions (NOT raw useEffects)
 * -----------------------------------------------------------
 * ARCHITECTURE:
 *   • Imports ONLY from dedicated hooks (NOT useSocketHub directly)
 *   • Each dedicated hook imports from useSocketHub
 *   • Exports listener setup functions that return cleanup functions
 *   • Component calls these in its own useEffects
 *
 * USAGE IN COMPONENT:
 *   const { setupRoomReadyListener, setupMessageListeners, ... } = usePublicLiveChat();
 *   useEffect(() => setupRoomReadyListener(callbacks), [deps]);
 */
'use client';

import { useCallback } from 'react';
import usePublicMessageEvents from '@/hooks/socket/usePublicMessageEvents';
import usePublicTypingIndicator from '@/hooks/socket/usePublicTypingIndicator';
import usePublicUnreadMessages from '@/hooks/socket/usePublicUnreadMessages';
import usePublicRoomUsers from '@/hooks/socket/usePublicRoomUsers';

/* ============================================================
 * 🏠 ROOM MANAGEMENT FUNCTIONS
 * ==========================================================*/
export function useRoomManagement() {
  const roomFunctions = usePublicRoomUsers();
  return roomFunctions;
}

/* ============================================================
 * 💬 MESSAGE FUNCTIONS
 * ==========================================================*/
export function useMessages() {
  const messageFunctions = usePublicMessageEvents();
  return messageFunctions;
}

/* ============================================================
 * ⌨️ TYPING INDICATOR FUNCTIONS
 * ==========================================================*/
export function useTyping() {
  const typingFunctions = usePublicTypingIndicator();
  return typingFunctions;
}

/* ============================================================
 * 🔔 UNREAD MESSAGE FUNCTIONS
 * ==========================================================*/
export function useUnread() {
  const unreadFunctions = usePublicUnreadMessages();
  return unreadFunctions;
}

/* ============================================================
 * 👥 PRESENCE FUNCTIONS (alias for room users)
 * ==========================================================*/
export function usePresence() {
  return useRoomManagement(); // Same as room management
}

/* ============================================================
 * 🍪 COOKIE HELPER (client-side)
 * ==========================================================*/
export function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

/* ============================================================
 * 🎁 ALL-IN-ONE HOOK (for convenience - combines all hooks)
 * ==========================================================*/
export default function usePublicLiveChat() {
  // 🧩 Import all dedicated hooks
  const room = useRoomManagement();
  const messages = useMessages();
  const typing = useTyping();
  const unread = useUnread();
  const presence = usePresence();

  /* ========================================
   * 🏠 SETUP ROOM READY LISTENER
   * ======================================*/
  const setupRoomReadyListener = useCallback(
    ({ onRoomReady }) => {
      if (!room?.onPublicRoomReady) return () => {};

      const off = room.onPublicRoomReady(({ public_conversation_id }) => {
        console.log('🟢 Room ready:', public_conversation_id);
        onRoomReady?.(public_conversation_id);
      });

      return () => off?.();
    },
    [room]
  );

  /* ========================================
   * 📨 SETUP MESSAGE LISTENERS
   * ======================================*/
  const setupMessageListeners = useCallback(
    ({
      activeRoomId,
      onMessageCreated,
      onMessageEdited,
      onMessageDeleted,
      onMessagesRefreshed
    }) => {
      if (
        !messages?.onPublicMessageCreated ||
        !messages?.onPublicMessageEdited ||
        !messages?.onPublicMessageDeleted ||
        !messages?.onPublicMessagesRefreshed
      )
        return () => {};

      // 📥 New message
      const offCreated = messages.onPublicMessageCreated(({ public_conversation_id, message }) => {
        if (public_conversation_id !== activeRoomId) return;
        onMessageCreated?.(message);
      });

      // ✏️ Edited message
      const offEdited = messages.onPublicMessageEdited(({ message }) => {
        onMessageEdited?.(message);
      });

      // 🗑️ Deleted message
      const offDeleted = messages.onPublicMessageDeleted(({ public_message_id }) => {
        onMessageDeleted?.(public_message_id);
      });

      // 🔄 Refreshed list
      const offRefreshed = messages.onPublicMessagesRefreshed(
        ({ public_conversation_id, messages: list }) => {
          if (public_conversation_id !== activeRoomId) return;
          onMessagesRefreshed?.(list);
        }
      );

      return () => {
        offCreated?.();
        offEdited?.();
        offDeleted?.();
        offRefreshed?.();
      };
    },
    [messages]
  );

  /* ========================================
   * 👥 SETUP PRESENCE LISTENER
   * ======================================*/
  const setupPresenceListener = useCallback(
    ({ activeRoomId, onPresenceUpdate }) => {
      if (!presence?.onPublicPresenceUpdate) return () => {};

      const off = presence.onPublicPresenceUpdate(({ room_id, public_conversation_id, users }) => {
        const targetRoom = public_conversation_id || room_id;
        if (targetRoom !== activeRoomId) return;
        console.log('👥 Presence update for room:', targetRoom, users);
        onPresenceUpdate?.(users);
      });

      return () => off?.();
    },
    [presence]
  );

  /* ========================================
   * ⌨️ SETUP TYPING LISTENER
   * ======================================*/
  const setupTypingListener = useCallback(
    ({ activeRoomId, onTypingUpdate }) => {
      if (!typing?.onPublicUserTyping) return () => {};

      const off = typing.onPublicUserTyping(({ public_conversation_id, user, isTyping }) => {
        if (public_conversation_id !== activeRoomId) return;
        onTypingUpdate?.(isTyping ? user : null);
      });

      return () => off?.();
    },
    [typing]
  );

  /* ========================================
   * 🔔 SETUP UNREAD LISTENER
   * ======================================*/
  const setupUnreadListener = useCallback(
    ({ activeRoomId, onUnreadUpdate }) => {
      if (!unread?.onPublicUnreadUpdated) return () => {};

      const off = unread.onPublicUnreadUpdated((payload) => {
        if (payload.scope === 'user' && payload.public_conversation_id === activeRoomId) {
          onUnreadUpdate?.(Number(payload.total) || 0);
        }
      });

      return () => off?.();
    },
    [unread]
  );

  /* ========================================
   * 🆕 NEW CONVERSATION LISTENER (ADMIN ONLY)
   * ======================================*/
  const onNewConversation = useCallback((handler) => {
    if (typeof window === 'undefined' || !window.__socketHub) return () => {};
    const hub = window.__socketHub();
    return hub.onNewConversation?.(handler) || (() => {});
  }, []);

  /* ========================================
   * 🔔 ADMIN GLOBAL UNREAD LISTENER
   * ======================================*/
  const onPublicUnreadAdmin = useCallback(
    (handler) => {
      return unread?.onPublicUnreadAdmin?.(handler) || (() => {});
    },
    [unread]
  );

  /* ========================================
   * 🧹 MARK ALL READ (ADMIN ONLY)
   * ======================================*/
  const markAllPublicMessagesRead = useCallback(() => {
    if (typeof window === 'undefined' || !window.__socketHub) return;
    const hub = window.__socketHub();
    return hub.markAllPublicMessagesRead?.();
  }, []);

  // 📦 Return combined API
  return {
    // 🏠 Room functions
    ...room,

    // 💬 Message functions
    ...messages,

    // ⌨️ Typing functions
    ...typing,

    // 🔔 Unread functions
    ...unread,

    // 👥 Presence functions
    ...presence,

    // 🎧 Listener setup functions
    setupRoomReadyListener,
    setupMessageListeners,
    setupPresenceListener,
    setupTypingListener,
    setupUnreadListener,

    // 👑 Admin-specific functions
    onNewConversation,
    onPublicUnreadAdmin,
    markAllPublicMessagesRead
  };
}
