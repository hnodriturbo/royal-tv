Below are revised versions of each component you shared. All are kept as client components, avoid `useSearchParams`, and are locale‑aware where navigation is involved. I’ve focused on:

* Locale-prefixed routes with `useLocale()` where applicable.
* Fixing a click‑handler bug in `RefreshNotifications`.
* Normalizing imports & formatting.
* Minor a11y touchups and defensive coding.
* Zero changes to server behavior.

> Drop these in the same file paths, replacing your current files.

---

## `/components/reusableUI/FreeTrialPanel.js`

```tsx
/**
 * ===========================================
 * FreeTrialPanel.js
 * 🆓 User Free Trial Status/Request Panel
 * -------------------------------------------
 * - Shows user's current free trial status
 * - Allows requesting a trial (one per user)
 * - Uses real-time socket-powered updates
 * - Localized with i18n client (`useTranslations`)
 * - Locale-aware links
 * ===========================================
 */

'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';

import FreeTrialButton from '@/components/reusableUI/FreeTrialButton';
import useFreeTrialStatus from '@/hooks/socket/useFreeTrialStatus';

export default function FreeTrialPanel({ user_id, className }) {
  const t = useTranslations();
  const locale = useLocale();

  // 🏷️ Hook for status, error, and refresher
  const { freeTrialStatus, error, refreshStatus } = useFreeTrialStatus(user_id);

  return (
    <div className={clsx('w-full max-w-2xl mx-auto flex flex-col items-center my-2', className)}>
      {/* 📝 ACTIVE status → deep link to credentials */}
      {freeTrialStatus === 'active' && (
        <Link href={`/${locale}/user/freeTrials`} className="w-full flex" aria-label={t('socket.ui.freeTrialPanel.click_to_view_credentials')}>
          <div className="text-2xl bg-green-300 text-green-600 w-full p-4 rounded-2xl mb-2 flex flex-col items-center shadow">
            <div className="font-bold text-2xl">
              ✅ {t('socket.ui.freeTrialPanel.your_free_trial_is')}{' '}
              <span className="underline">{t('socket.ui.freeTrialPanel.active_caps')}</span>!
            </div>
            <div className="mt-2">
              <span className="text-yellow-500 underline whitespace-nowrap">
                {t('socket.ui.freeTrialPanel.click_to_view_credentials')}
              </span>
            </div>
          </div>
        </Link>
      )}

      {/* ❌ EXPIRED or DISABLED */}
      {(freeTrialStatus === 'expired' || freeTrialStatus === 'disabled') && (
        <div className="bg-red-200 text-red-900 w-full p-4 rounded-2xl mb-2 flex flex-col items-center shadow" role="status" aria-live="polite">
          <div className="font-bold text-lg">
            🚫 {t('socket.ui.freeTrialPanel.your_free_trial_has')}{' '}
            <span className="underline">{t('socket.ui.freeTrialPanel.expired_caps')}</span>{' '}
            {t('socket.ui.freeTrialPanel.or_is_unavailable')}
          </div>
        </div>
      )}

      {/* 🎟️ Request Button if no active/pending trial */}
      {!freeTrialStatus && (
        <FreeTrialButton user_id={user_id} refreshStatus={refreshStatus} />
      )}

      {/* ⚠️ Error Display */}
      {error && (
        <div className="mt-2 text-red-600 flex gap-2 items-center" role="alert">
          <span aria-hidden>❗</span> {String(error)}
        </div>
      )}
    </div>
  );
}
```

---

## `/components/reusableUI/IsAdminOnline.js`

```tsx
/**
 * 🟢 IsAdminOnline.js
 * Shows compact admin online indicator & admin list for the user conversation page.
 * - Localized with i18n client (`useTranslations`)
 * - Locale-aware when opening a conversation via nested button
 */
'use client';

import { useTranslations, useLocale } from 'next-intl';

import ConversationActionButton from '@/components/reusableUI/ConversationActionButton';
import useIsAdminOnline from '@/hooks/socket/useIsAdminOnline';

const IsAdminOnline = ({ user_id }) => {
  const t = useTranslations();
  const locale = useLocale();

  const { isAdminOnline, adminInfo, singleAdmin } = useIsAdminOnline();

  const statusLabel = isAdminOnline ? (
    <span className="text-green-700 font-semibold">✅ {t('socket.ui.isAdminOnline.online')}</span>
  ) : (
    <span className="text-red-600 font-semibold">❌ {t('socket.ui.isAdminOnline.offline')}</span>
  );

  let adminLine = null;
  if (!isAdminOnline) {
    adminLine = <span className="text-lg">{t('socket.ui.isAdminOnline.no_admin_online')}</span>;
  } else if (singleAdmin) {
    adminLine = (
      <>
        <span className="text-lg">
          {t('socket.ui.isAdminOnline.online_admin')}&nbsp;
          <span className="text-green-700 ml-2">
            {singleAdmin.name || t('socket.ui.isAdminOnline.admin_support')}
          </span>
        </span>
        <ConversationActionButton buttonClass="btn-primary" action="create" user_id={user_id} locale={locale} />
      </>
    );
  } else if (Array.isArray(adminInfo) && adminInfo.length > 1) {
    adminLine = (
      <>
        <span className="text-lg text-green-700 flex flex-wrap gap-1">
          {t('socket.ui.isAdminOnline.online_admins')}&nbsp;
          {adminInfo.map((admin, idx) => (
            <span key={admin.user_id}>
              {admin.name || t('socket.ui.isAdminOnline.admin_support')}
              {idx < adminInfo.length - 1 ? ',' : ''}
            </span>
          ))}
        </span>
        <ConversationActionButton action="create" user_id={user_id} locale={locale} />
      </>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-bold text-lg underline">{t('socket.ui.isAdminOnline.admin_info')}</span>
      <span className="text-lg flex items-center gap-2">
        {t('socket.ui.isAdminOnline.is_admin_online_label')} {statusLabel}
      </span>
      {adminLine}
    </div>
  );
};

export default IsAdminOnline;
```

---

## `/components/reusableUI/socket/LiveChatRoom.js`

```tsx
/**
 * LiveChatRoom.js – Royal TV
 * Live, real-time chat room for 1:1 support!
 * - Localized UI strings
 * - Cleaned imports, no unused hooks
 */
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import clsx from 'clsx';
import dayjs from 'dayjs';

import logger from '@/lib/core/logger';
import useAppHandlers from '@/hooks/useAppHandlers';
import useMessageEvents from '@/hooks/socket/useMessageEvents';
import useRoomUsers from '@/hooks/socket/useRoomUsers';
import useSocketHub from '@/hooks/socket/useSocketHub';
import useTypingIndicator from '@/hooks/socket/useTypingIndicator';
import useUnreadMessages from '@/hooks/socket/useUnreadMessages';
import { useCreateNotifications } from '@/hooks/socket/useCreateNotifications';

import RefreshMessages from '@/components/reusableUI/socket/RefreshMessages';
import TypingIndicator from '@/components/reusableUI/socket/TypingIndicator';
import { useTranslations } from 'next-intl';
import { SafeString } from '@/lib/ui/SafeString';

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
  const t = useTranslations();
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

  // 🏠 join/leave lifecycle
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

  const isOwnMessage = (msg) =>
    (currentUserRole === 'admin' && msg.sender_is_admin) ||
    (currentUserRole !== 'admin' && !msg.sender_is_admin);

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
          aria-live="polite"
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
                <p className="break-words whitespace-pre-wrap">
                  {SafeString(message.message, 'LiveChatRoom.message')}
                </p>
                <div className="flex justify-between items-center mt-2">
                  {isOwnMessage(message) && (
                    <div className="flex gap-2">
                      {/* ✏️ Edit */}
                      <button
                        type="button"
                        onClick={() =>
                          onEditMessageModal?.(
                            message.message_id,
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
                          onDeleteMessageModal?.(SafeString(message.message_id, ''), deleteMessage)
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
```

---

## `/components/reusableUI/LogPageView.js`

```tsx
/**
 * LogPageView.js — Socket page view logs
 * - Translated via useTranslations()
 * - Only logs when pathname actually changes
 */
'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import useSocketHub from '@/hooks/socket/useSocketHub';

export default function LogPageView() {
  const t = useTranslations();
  const { logPageVisit, socketConnected } = useSocketHub();
  const pathname = usePathname();
  const previousPathRef = useRef<string | undefined>();

  useEffect(() => {
    if (!logPageVisit || !socketConnected) return;

    if (previousPathRef.current !== pathname) {
      const decoded = decodeURIComponent(pathname || '/');
      const cleaned = decoded.replace(/\/$/, '');
      const segments = cleaned.split('/');
      const last = segments[segments.length - 1] || 'home';

      const description = t('socket.ui.logPageView.description', { page: last });

      logPageVisit({
        page: decoded,
        event: 'page_visit',
        description
      });

      previousPathRef.current = pathname;
    }
  }, [pathname, logPageVisit, socketConnected, t]);

  return null;
}
```

---

## `/components/reusableUI/NotificationCenter.js`

```tsx
/**
 * NotificationCenter.js
 * SOCKET-DRIVEN NOTIFICATION CENTER – preview/drawer, paginated expand.
 * - Locale-aware navigation for "See All" and per-notification links
 * - Smooth progressive reveal
 */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';

import RefreshNotifications from '@/components/reusableUI/socket/RefreshNotifications';
import useModal from '@/hooks/useModal';
import useNotifications from '@/hooks/socket/useNotifications';
import { SafeString } from '@/lib/ui/SafeString';

const PREVIEW_COUNT = 3;
const FIRST_DRAWER_COUNT = 7;
const DRAWER_PAGE_SIZE = 10;

const notificationCardClasses = (notif) =>
  `w-4/5 mx-auto mb-2 rounded-xl shadow transition-all
   flex flex-col justify-center
   ${!notif.is_read ? 'border-l-4 border-blue-500 bg-gradient-to-r from-blue-950/50 via-gray-900 to-gray-900' : 'bg-gray-900/70'}`;

export default function NotificationCenter({ userRole = 'user' }) {
  const t = useTranslations();
  const locale = useLocale();
  const { data: session } = useSession();
  const user_id = session?.user?.user_id;
  const router = useRouter();
  const { openModal, hideModal } = useModal();

  const visibleCountRef = useRef(0);

  const {
    notifications,
    unreadCount,
    markAsRead,
    getPreview,
    getDrawerSlice,
    resortNotifications,
    refreshNotifications,
    removeNotification,
    clearAllNotifications
  } = useNotifications(user_id);

  const handleDeleteNotificationModal = (notification_id) => {
    openModal('deleteNotification', {
      title: t('socket.ui.notifications.modals.delete.title'),
      description: t('socket.ui.notifications.modals.delete.description'),
      confirmButtonType: 'Danger',
      confirmButtonText: t('socket.ui.notifications.modals.delete.confirm'),
      cancelButtonText: t('socket.ui.notifications.modals.common.cancel'),
      onConfirm: () => {
        removeNotification(notification_id);
        hideModal();
      },
      onCancel: hideModal
    });
  };

  const handleClearAllNotificationsModal = () => {
    openModal('clearAllNotifications', {
      title: t('socket.ui.notifications.modals.clear_all.title'),
      description: t('socket.ui.notifications.modals.clear_all.description'),
      confirmButtonType: 'Danger',
      confirmButtonText: t('socket.ui.notifications.modals.clear_all.confirm'),
      cancelButtonText: t('socket.ui.notifications.modals.common.cancel'),
      onConfirm: () => {
        clearAllNotifications();
        hideModal();
      },
      onCancel: hideModal
    });
  };

  // 🔢 UI state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerPage, setDrawerPage] = useState(1);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [visibleDrawerCount, setVisibleDrawerCount] = useState(0);
  const prevDrawerPageRef = useRef(1);

  const topPreview = getPreview(PREVIEW_COUNT);

  let drawerSlice = [] as any[];
  if (drawerOpen) {
    let startIdx = PREVIEW_COUNT;
    let endIdx = PREVIEW_COUNT;
    if (drawerPage === 1) {
      endIdx += FIRST_DRAWER_COUNT;
    } else if (drawerPage > 1) {
      endIdx += FIRST_DRAWER_COUNT + (drawerPage - 1) * DRAWER_PAGE_SIZE;
    }
    drawerSlice = getDrawerSlice(startIdx, endIdx);
  }

  useEffect(() => {
    visibleCountRef.current = visibleDrawerCount;
  }, [visibleDrawerCount]);

  useEffect(() => {
    if (drawerOpen && drawerPage !== prevDrawerPageRef.current) {
      let start = visibleCountRef.current;
      let end = drawerSlice.length;
      let diff = end - start;
      if (diff <= 0) return;

      const totalDuration = 1500;
      const perNotification = totalDuration / diff;

      let i = start;
      const interval = setInterval(() => {
        setVisibleDrawerCount((count) => {
          if (count < end) return count + 1;
          clearInterval(interval);
          return count;
        });
        i++;
        if (i >= end) clearInterval(interval);
      }, perNotification);

      prevDrawerPageRef.current = drawerPage;
      return () => clearInterval(interval);
    } else if (!drawerOpen) {
      setVisibleDrawerCount(0);
      prevDrawerPageRef.current = 1;
    }
  }, [drawerOpen, drawerPage, drawerSlice.length]);

  useEffect(() => {
    if (drawerOpen && drawerPage === 1) {
      setVisibleDrawerCount(drawerSlice.length);
      prevDrawerPageRef.current = 1;
    }
  }, [drawerOpen, drawerPage, drawerSlice.length]);

  const totalNotifications = notifications.length;
  const shownCount = drawerOpen
    ? Math.min(
        PREVIEW_COUNT + (drawerPage === 1 ? drawerSlice.length : FIRST_DRAWER_COUNT + (drawerPage - 1) * DRAWER_PAGE_SIZE),
        totalNotifications
      )
    : Math.min(PREVIEW_COUNT, totalNotifications);

  const moreToShow = drawerOpen ? shownCount < totalNotifications : totalNotifications > PREVIEW_COUNT;
  const canSeeMore = !drawerOpen && totalNotifications > PREVIEW_COUNT;

  const shouldShowButton = (notif) => {
    if (userRole === 'admin') return Boolean(notif.link);
    return Boolean(notif.link) && notif.type !== 'newUserRegistration';
  };

  const toggleExpanded = (id, notif) => {
    if (!notif.is_read && !expandedIds[id]) {
      markAsRead(id);
      setExpandedIds((prev) => ({ ...prev, [id]: true }));
      return;
    }
    if (notif.is_read && expandedIds[id]) {
      setExpandedIds((prev) => ({ ...prev, [id]: false }));
      setTimeout(() => {
        resortNotifications();
      }, 700);
      return;
    }
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="container-style flex flex-col items-center justify-center w-full max-w-2xl mx-auto p-4 lg:p-8">
      {/* 📰 header */}
      <div className="flex justify-between items-center w-full mb-6 max-w-xl">
        <h2 className="text-2xl sm:text-3xl font-bold flex items-center">
          🔔 {t('socket.ui.notifications.title')}
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-sm ml-2">
              {unreadCount}
            </span>
          )}
        </h2>
        <RefreshNotifications user_id={user_id} />
      </div>
      <hr className="border border-gray-600 w-11/12 max-w-xl mb-6" />

      {/* 👀 preview */}
      <div className="flex flex-col items-center gap-3 mb-4 w-full">
        {topPreview.length === 0 ? (
          <div className="text-center text-gray-400 py-8">{t('socket.ui.notifications.empty')}</div>
        ) : (
          topPreview.map((notif) => (
            <div key={notif.notification_id} className={notificationCardClasses(notif)}>
              <button
                type="button"
                onClick={() => toggleExpanded(notif.notification_id, notif)}
                className="w-full text-left flex justify-between items-center px-5 py-3"
                aria-expanded={!!expandedIds[notif.notification_id]}
              >
                <div className={`flex items-center gap-2 ${!notif.is_read ? 'font-bold' : ''}`}>
                  {!notif.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                  <span className="text-md">{SafeString(notif.title, 'NotificationCenter.title') ?? ''}</span>
                </div>
                <span className="ml-2 text-lg">{expandedIds[notif.notification_id] ? '−' : '+'}</span>
              </button>
              <div className={`overflow-hidden transition-all duration-700 ${expandedIds[notif.notification_id] ? 'max-h-96' : 'max-h-0'}`}>
                <div className={expandedIds[notif.notification_id] ? 'px-5 pb-2 pt-1 border-t border-gray-700 max-h-56 overflow-y-auto custom-scrollbar' : 'px-5 pb-2 pt-1 border-t border-gray-700'}>
                  <div className="text-gray-300 mb-3 mt-2">
                    <p className="whitespace-pre-wrap">{SafeString(notif.body, 'NotificationCenter.body')}</p>
                  </div>
                  {shouldShowButton(notif) && typeof notif.link === 'string' && (
                    <div className="flex justify-between items-center mt-3">
                      {/* 🗑️ Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteNotificationModal(notif.notification_id)}
                        title={SafeString(t('socket.ui.notifications.actions.delete') ?? '')}
                      >
                        🗑️ {SafeString(t('socket.ui.notifications.actions.delete') ?? '')}
                      </button>
                      {/* 🔗 Open link (locale-aware) */}
                      <button
                        type="button"
                        onClick={() => router.push(`/${locale}${SafeString(notif.link, '/')}`)}
                      >
                        {SafeString(t('socket.ui.notifications.actions.open') ?? '')}
                      </button>
                    </div>
                  )}
                  <div className="mt-2 pt-3 border-t border-gray-800 text-xs text-gray-500">
                    <div>{new Date(notif.createdAt).toLocaleString()}</div>
                    {notif.type && (
                      <div>
                        <span>
                          {SafeString(t('socket.ui.notifications.type_label'))}
                          {': '}
                          {SafeString(notif.type)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ⬇️ bottom controls (when drawer closed) */}
      {!drawerOpen && (
        <div className="flex flex-row w-full max-w-xl justify-between items-center my-4 gap-2">
          {canSeeMore && (
            <button type="button" onClick={() => setDrawerPage((prev) => prev + 1)}>
              👇 {SafeString(t('socket.ui.notifications.see_more') ?? '')}
            </button>
          )}
          {!drawerOpen && totalNotifications > 0 && (
            <div className="w-full flex-1 justify-end mb-2 pr-2 text-sm">
              {t('socket.ui.notifications.total', { count: totalNotifications })}
            </div>
          )}
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={() => router.push(`/${locale}/${String(userRole ?? 'user')}/notifications`)}
            >
              🗂️ {String(t('socket.ui.notifications.see_all') ?? '')}
            </button>
          )}
        </div>
      )}

      {/* 🗂️ drawer */}
      {drawerOpen && (
        <div className="w-full transition-all duration-700">
          <div className="flex flex-col items-center gap-3 mb-4">
            {drawerSlice.length === 0 ? (
              <div className="text-center text-gray-400 py-4">{t('socket.ui.notifications.empty_more')}</div>
            ) : (
              drawerSlice.slice(0, visibleDrawerCount).map((notif) => (
                <div key={notif.notification_id} className={notificationCardClasses(notif)}>
                  <button
                    type="button"
                    onClick={() => toggleExpanded(notif.notification_id, notif)}
                    className="w-full text-left flex justify-between items-center px-5 py-3"
                    aria-expanded={!!expandedIds[notif.notification_id]}
                  >
                    <div className={`flex items-center gap-2 ${!notif.is_read ? 'font-bold' : ''}`}>
                      {!notif.is_read && <span className="w-2 h-2 bg-blue-500 rounded-full" />}
                      <span className="text-md">{String(SafeString(notif.title, 'NotificationCenter.title') ?? '')}</span>
                    </div>
                    <span className="ml-2 text-lg">{expandedIds[notif.notification_id] ? '−' : '+'}</span>
                  </button>
                  <div className={`overflow-hidden transition-all duration-700 ${expandedIds[notif.notification_id] ? 'max-h-96' : 'max-h-0'}`}>
                    <div className={expandedIds[notif.notification_id] ? 'px-5 pb-2 pt-1 border-t border-gray-700 max-h-56 overflow-y-auto custom-scrollbar' : 'px-5 pb-2 pt-1 border-t border-gray-700'}>
                      <div className="text-gray-300 mb-3 mt-2">
                        <p className="whitespace-pre-wrap">{SafeString(notif.body, 'NotificationCenter.body')}</p>
                      </div>
                      {shouldShowButton(notif) && (
                        <div className="flex justify-between items-center mt-3">
                          <button
                            type="button"
                            onClick={() => handleDeleteNotificationModal(notif.notification_id)}
                            title={String(t('socket.ui.notifications.actions.delete') ?? '')}
                          >
                            🗑️ {String(t('socket.ui.notifications.actions.delete') ?? '')}
                          </button>
                          <button type="button" onClick={() => router.push(`/${locale}${String(notif.link ?? '/')}`)}>
                            {String(t('socket.ui.notifications.actions.open') ?? '')}
                          </button>
                        </div>
                      )}
                      <div className="mt-2 pt-3 border-t border-gray-800 text-xs text-gray-500">
                        <div>{new Date(notif.createdAt).toLocaleString()}</div>
                        {notif.type && (
                          <div>
                            {SafeString(t('socket.ui.notifications.type_label'))}:{' '}
                            {SafeString(notif.type)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex flex-row w-full max-w-xl items-center my-4 gap-2">
            <div className="flex-1 flex justify-start">
              {moreToShow ? (
                <button className="btn-primary" onClick={() => setDrawerPage((prev) => prev + 1)}>
                  👇 {SafeString(t('socket.ui.notifications.see_more'), '')}
                </button>
              ) : null}
            </div>
            <div className="flex-1 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  setDrawerPage(1);
                }}
              >
                ⬆️ {SafeString(t('socket.ui.notifications.see_less') ?? '')}
              </button>
            </div>
            {notifications.length > 0 && (
              <div className="flex-1 flex justify-end">
                <Link href={`/${locale}/${userRole}/notifications`} className="btn-outline-primary text-center block">
                  🗂️ {t('socket.ui.notifications.see_all')}
                </Link>
              </div>
            )}
          </div>

          <div className="w-full max-w-xl flex justify-center text-sm mt-1 mb-4">
            {drawerOpen && (
              <>{t('socket.ui.notifications.showing_range', { start: 1, end: shownCount, total: totalNotifications })}</>
            )}
          </div>
        </div>
      )}

      {/* 🚨 danger zone */}
      {notifications.length > 0 && (
        <div className="w-full max-w-sm mx-auto border border-red-700 rounded-2xl bg-red-950/60 flex flex-col items-center p-6 shadow-lg">
          <h3 className="text-lg font-bold text-red-400 mb-2 flex items-center">
            <span className="mr-2">⚠️</span>
            {t('socket.ui.notifications.danger_zone')}
          </h3>

          <button
            type="button"
            onClick={handleClearAllNotificationsModal}
            className="px-5 py-2 rounded-lg bg-red-700 hover:bg-red-900 border border-red-500 text-white font-bold shadow transition"
            title={SafeString(t('socket.ui.notifications.actions.clear_all') ?? '')}
          >
            🧨 {SafeString(t('socket.ui.notifications.actions.clear_all') ?? '')}
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## `/components/reusableUI/OnlineUsers.js`

```tsx
/**
 * OnlineUsers Component 📡
 * - Badge with currently online users (roles + names)
 * - Hides itself on the dedicated live‑chat room page
 * - Locale-aware chat route detection
 */
'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import useSocketHub from '@/hooks/socket/useSocketHub';

const OnlineUsers = () => {
  const t = useTranslations();
  const pathname = usePathname();
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { requestOnlineUsers, onOnlineUsersUpdate } = useSocketHub();

  useEffect(() => {
    const stopListening = onOnlineUsersUpdate(setOnlineUsers);
    requestOnlineUsers();
    return () => stopListening();
  }, [requestOnlineUsers, onOnlineUsersUpdate]);

  // Locale-aware: /{locale}/admin/liveChat/{id}
  const parts = (pathname || '/').replace(/\/$/, '').split('/'); // ['', 'en', 'admin', 'liveChat', '{id}']
  const isChatRoomPage = parts.length >= 5 && parts[2] === 'admin' && parts[3] === 'liveChat';

  if (isChatRoomPage) return null;
  if (!onlineUsers.length) return null;

  return (
    <div className="container-style-sm mb-4">
      <h2 className="text-lg font-bold text-center mb-2">{t('socket.ui.online_users.title')}</h2>
      <div className="flex flex-wrap gap-2 justify-center">
        {onlineUsers.map((singleUser) => (
          <div key={singleUser.user_id} className="text-white text-sm">
            <span className="text-green-500 mr-1">●</span>
            {singleUser.name}
            <span className="ml-1 text-xs text-gray-300">
              ({t(`socket.ui.roles.${singleUser.role || 'guest'}`)})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OnlineUsers;
```

---

## `/components/reusableUI/socket/RefreshFreeTrialsButton.js`

```tsx
// RefreshFreeTrialsButton.js — translate button text
'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

import useFreeTrialStatus from '@/hooks/socket/useFreeTrialStatus';

const RefreshFreeTrialStatusButton = () => {
  const { data: session } = useSession();
  const userId = session?.user?.user_id;
  const { refreshStatus } = useFreeTrialStatus(userId);
  const [loading, setLoading] = useState(false);
  const t = useTranslations();

  const handleRefreshClick = () => {
    setLoading(true);
    refreshStatus();
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <button type="button" onClick={handleRefreshClick} aria-busy={loading}>
      {loading ? (
        <>
          <span className="animate-spin" aria-hidden>
            ⟳
          </span>{' '}
          {String(t('socket.ui.common.refreshing') ?? '')}
        </>
      ) : (
        <>⟳ {String(t('socket.ui.common.refresh') ?? '')}</>
      )}
    </button>
  );
};

export default RefreshFreeTrialStatusButton;
```

---

## `/components/reusableUI/socket/RefreshMessages.js`

```tsx
/**
 * RefreshMessages.js — Reusable "Refresh Chat Messages" button
 */
'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';

import useRefreshMessages from '@/hooks/socket/useRefreshMessages';

const RefreshMessages = ({ conversation_id, onRefreshed }) => {
  const t = useTranslations();
  const { requestRefresh, onRefreshed: onRefreshedHook } = useRefreshMessages(conversation_id);

  useEffect(() => {
    if (!onRefreshed) return;
    const stop = onRefreshedHook(onRefreshed);
    return () => stop();
  }, [onRefreshed, onRefreshedHook]);

  return (
    <button type="button" onClick={requestRefresh} aria-label={String(t('socket.ui.refresh_messages.button_text') ?? '')}>
      {String(t('socket.ui.refresh_messages.button_text') ?? '')}
    </button>
  );
};

export default RefreshMessages;
```

---

## `/components/reusableUI/socket/RefreshNotifications.js`

```tsx
/**
 * RefreshNotifications.js — loader button to refresh notifications for the current user.
 * - Fix: use the actual handler in onClick (was recursively calling the component).
 */
'use client';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

import useRefreshNotifications from '@/hooks/socket/useRefreshNotifications';

export default function RefreshNotifications({ user_id: userIdProp }) {
  const { data: session } = useSession();
  const user_id = userIdProp || session?.user?.user_id;
  const { refreshNotifications, loading } = useRefreshNotifications(user_id);
  const t = useTranslations();

  return (
    <button type="button" onClick={refreshNotifications} disabled={loading} aria-busy={loading}>
      {loading ? (
        <>
          <span className="animate-spin" aria-hidden>
            ⟳
          </span>{' '}
          {String(t('socket.ui.common.refreshing') ?? '')}
        </>
      ) : (
        <>⟳ {String(t('socket.ui.common.refresh') ?? '')}</>
      )}
    </button>
  );
}
```

---

## `/components/reusableUI/SafeButton.js`

```tsx
/**
 * SafeButton.js — defensive <button> wrapper
 */
'use client';

import React from 'react';

export default function SafeButton({
  onClick: rawOnClick,
  title: rawTitle,
  ariaLabel: rawAriaLabel,
  className,
  style,
  disabled,
  children,
  ...otherProps
}) {
  const safeOnClick = typeof rawOnClick === 'function' ? rawOnClick : () => {};
  const safeTitle = rawTitle == null ? undefined : String(rawTitle);
  const safeAriaLabel = rawAriaLabel == null ? safeTitle ?? undefined : String(rawAriaLabel);

  const renderSafeChildren = (value) => {
    if (React.isValidElement(value)) return value;
    if (['string', 'number', 'boolean'].includes(typeof value)) return String(value);
    if (Array.isArray(value))
      return value.map((child, i) => <React.Fragment key={i}>{renderSafeChildren(child)}</React.Fragment>);
    return '';
  };

  return (
    <button
      type="button"
      onClick={safeOnClick}
      className={className}
      style={style}
      title={safeTitle}
      aria-label={safeAriaLabel}
      disabled={disabled}
      {...otherProps}
    >
      {renderSafeChildren(children)}
    </button>
  );
}
```
