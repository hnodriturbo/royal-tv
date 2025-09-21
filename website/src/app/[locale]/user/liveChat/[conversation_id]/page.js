'use client';
/**
 * ========================= /app/[locale]/user/liveChat/[conversation_id]/page.js =========================
 * 🗂️ User Conversation Details (Client)
 * --------------------------------------------------------------------------------------------------------
 * • New layout to mirror Admin page structure
 *   1) Presence header (IsAdminOnline) with same styling as admin
 *   2) Conversation list (below presence)
 *   3) Live chat room
 *   4) Danger zone
 * • Locale-aware navigation via `useLocale()` — all internal links use /{locale}/... prefixes
 * • Keeps your custom classes and socket refresh flow intact
 * ========================================================================================================
 */

import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations, useLocale } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';

import useAuthGuard from '@/hooks/useAuthGuard';
import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useRefreshMessages from '@/hooks/socket/useRefreshMessages';
import useModal from '@/hooks/useModal';

import ConversationActionButton from '@/components/reusableUI/ConversationActionButton';
import LiveChatRoom from '@/components/reusableUI/socket/LiveChatRoom';
import IsAdminOnline from '@/components/reusableUI/socket/IsAdminOnline';

export default function UserConversationDetailsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const { conversation_id } = useParams();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('user');
  const { data: session, status } = useSession();
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { openModal, hideModal } = useModal();

  const [conversationDetails, setConversationDetails] = useState(null);
  const [initialMessages, setInitialMessages] = useState([]);
  const [userConversations, setUserConversations] = useState([]);
  const [currentSubject, setCurrentSubject] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const editTextAreaRef = useRef(null);

  const { requestRefresh } = useRefreshMessages(conversation_id, 'live');

  // 🔁 socket refresh trigger
  useEffect(() => {
    if (shouldRefresh) {
      requestRefresh?.();
      setShouldRefresh(false);
    }
  }, [shouldRefresh, requestRefresh]);

  // 📥 load conversation + list
  const fetchConversationData = async () => {
    try {
      if (!conversation_id) return;
      showLoader({ text: t('app.user.liveChat.conversation.loading') });

      const { data: conversationData } = await axiosInstance.get(
        `/api/user/liveChat/${conversation_id}`
      );
      setConversationDetails(conversationData);
      setInitialMessages(conversationData.messages);
      setCurrentSubject(conversationData.subject);

      const { data: list } = await axiosInstance.get(`/api/user/liveChat/main`);
      setUserConversations(Array.isArray(list?.conversations) ? list.conversations : []);
      setIsReady(true);
    } catch {
      displayMessage(t('app.user.liveChat.conversation.failed_to_load'), 'error');
    } finally {
      hideLoader();
    }
  };

  // 🚦 mount guard
  useEffect(() => {
    if (status === 'authenticated' && isAllowed) {
      fetchConversationData();
    }
  }, [status, isAllowed]);

  // 🚫 redirect if forbidden
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) router.replace(redirect);
  }, [status, isAllowed, redirect, router]);

  if (!isAllowed) return null;

  // ✏️ edit modal (socket-based)
  const handleEditMessageModal = (messageId, oldMessage, onEditMessage) =>
    openModal('editMessage', {
      title: t('app.user.liveChat.conversation.edit_title'),
      description: t('app.user.liveChat.conversation.edit_desc'),
      confirmButtonText: t('app.user.liveChat.conversation.edit_confirm'),
      cancelButtonText: t('app.user.liveChat.conversation.cancel'),
      onConfirm: async () => {
        try {
          const updated = editTextAreaRef.current?.value?.trim();
          if (updated && updated !== oldMessage) {
            onEditMessage?.(messageId, updated); // 🔌 socket emit (edit_message)
            displayMessage(t('app.user.liveChat.conversation.message_updated'), 'success');
            setShouldRefresh(true);
          }
        } catch {
          displayMessage(t('app.user.liveChat.conversation.message_edit_failed'), 'error');
        } finally {
          hideModal();
        }
      },
      body: (
        <textarea
          ref={editTextAreaRef}
          className="w-full p-2 border rounded"
          defaultValue={oldMessage || ''}
        />
      )
    });

  // 🗑️ delete modal (socket-based)
  const handleDeleteMessageModal = (messageId, onDeleteMessage) =>
    openModal('deleteMessage', {
      title: t('app.user.liveChat.conversation.delete_title'),
      description: t('app.user.liveChat.conversation.delete_desc'),
      confirmButtonText: t('app.user.liveChat.conversation.delete_confirm'),
      cancelButtonText: t('app.user.liveChat.conversation.cancel'),
      confirmButtonType: 'Danger',
      onConfirm: async () => {
        try {
          onDeleteMessage?.(messageId); // 🔌 socket emit (delete_message)
          displayMessage(t('app.user.liveChat.conversation.message_deleted'), 'success');
          setShouldRefresh(true); // optional; helps sync lists/badges outside the room
        } catch {
          displayMessage(t('app.user.liveChat.conversation.message_delete_failed'), 'error');
        } finally {
          hideModal();
        }
      }
    });

  // 🔎 helpers
  const renderUnreadBadge = (count) => (
    <span className="inline-block ml-2 px-2 py-0.5 rounded-full bg-blue-900 text-white text-[14px] font-bold shadow">
      {count === 1
        ? t('app.user.liveChat.conversation.unread_badge_one')
        : t('app.user.liveChat.conversation.unread_badge_other', { count })}
    </span>
  );

  return (
    <div className="flex flex-col items-center w-full mt-4">
      <div className="container-style lg:w-10/12 w-full mt-4 p-2">
        {/* 1) Presence header — same styling block used on Admin page */}
        <div className="flex items-center justify-center w-full">
          <div className="container-style min-w-[220px] lg:max-w-lg w-10/12 p-2 text-center border mx-auto">
            <IsAdminOnline />
          </div>
        </div>

        {/* 2) Conversation list (below presence) */}
        {userConversations.length > 0 && (
          <div className="flex items-center justify-center mt-2 mb-4">
            <div className="container-style w-11/12 lg:w-10/12 p-2">
              <h3 className="text-2xl font-bold mb-1 text-center text-outline-dark-2 text-purple-400 text-underline">
                {t('app.user.liveChat.conversation.list_title')}
              </h3>
              <div className="flex items-center justify-center">
                <hr className="border border-white w-8/12 my-2" />
              </div>

              <div
                className="flex flex-col gap-1 p-1 w-full max-h-48 overflow-y-auto transition-all"
                style={{ minWidth: 0, width: '100%' }}
              >
                {userConversations
                  .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                  .map((c) => {
                    const isCurrent = c.conversation_id === conversation_id;
                    const isUnread = c.unreadCount > 0;
                    const tooltip = isUnread
                      ? t('app.user.liveChat.conversation.tooltip_unread')
                      : t('app.user.liveChat.conversation.tooltip_all_read');

                    return (
                      <Link
                        key={c.conversation_id}
                        href={`/${locale}/user/liveChat/${c.conversation_id}`}
                        className={`px-2 py-3 rounded-lg text-xs font-bold w-full transition-colors border
                          ${isCurrent ? 'border-2 border-green-300' : 'border border-transparent'}
                          ${isUnread ? 'bg-purple-700 text-white hover:bg-purple-500' : 'bg-gray-500 hover:bg-slate-300 text-white'}
                        `}
                        title={tooltip}
                      >
                        {c.subject || t('app.user.liveChat.conversation.no_subject')}
                        {isUnread && renderUnreadBadge(c.unreadCount)}
                      </Link>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* 3) Live Chat Room */}
        {isReady && conversationDetails && (
          <div className="flex flex-col flex-grow w-full">
            <LiveChatRoom
              session={session}
              conversation_id={conversation_id}
              initialMessages={initialMessages}
              chatType="live"
              onEditMessageModal={handleEditMessageModal}
              onDeleteMessageModal={handleDeleteMessageModal}
              subject={currentSubject}
              user={conversationDetails.owner}
            />
          </div>
        )}

        {/* 4) Danger Zone */}
        <div className="flex flex-col justify-center items-center w-full">
          <div className="w-8/12 max-w-lg">
            <div className="w-full p-2 mt-4 border border-red-500 rounded-lg text-center bg-red-400">
              <h2 className="text-base font-bold mb-2 text-red-900">
                {t('app.user.liveChat.conversation.danger_zone')}
              </h2>
              <p className="mb-2 text-xs text-red-100">
                {t('app.user.liveChat.conversation.danger_message')}
              </p>
              <div className="flex items-center justify-center w-full">
                {conversationDetails?.owner?.user_id && (
                  <ConversationActionButton
                    action="delete"
                    user_id={conversationDetails.owner.user_id}
                    conversation_id={conversation_id}
                    onActionSuccess={() => {
                      displayMessage(
                        t('app.user.liveChat.conversation.conversation_deleted'),
                        'success'
                      );
                      setTimeout(() => {
                        router.push(`/${locale}/user/liveChat/main`);
                      }, 1200);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
