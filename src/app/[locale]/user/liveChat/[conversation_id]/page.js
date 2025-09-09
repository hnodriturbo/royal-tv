// File: app/[locale]/user/liveChat/[conversation_id]/page.js
'use client';

/**
 * 🗂 User Conversation Details
 * - Fix: no hooks inside callbacks; capture locale at top level and reuse
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
  const locale = useLocale(); // ✅ top-level
  const { conversation_id } = useParams();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('user');
  const { data: session, status } = useSession();
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { openModal, hideModal } = useModal();

  const [conversationDetails, setConversationDetails] = useState(null);
  const [initialMessages, setInitialMessages] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [userConversations, setUserConversations] = useState([]);
  const [currentSubject, setCurrentSubject] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const editTextAreaRef = useRef(null);

  const { requestRefresh } = useRefreshMessages(conversation_id, 'live');

  useEffect(() => {
    if (shouldRefresh) {
      requestRefresh?.();
      setShouldRefresh(false);
    }
  }, [shouldRefresh, requestRefresh]);

  const fetchConversationData = async () => {
    try {
      if (!conversation_id) return;
      showLoader({ text: t('app.user.liveChat.conversation.loading') });

      const { data: conversationData } = await axiosInstance.get(
        `/api/user/liveChat/${conversation_id}`
      );
      setConversationDetails(conversationData);
      setInitialMessages(conversationData.messages);
      setUserDetails(conversationData.owner);
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

  useEffect(() => {
    if (status === 'authenticated' && isAllowed) {
      fetchConversationData();
    }
  }, [status, isAllowed]); // do not include t

  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) router.replace(redirect);
  }, [status, isAllowed, redirect, router]);

  if (!isAllowed) return null;

  const handleEditMessageModal = (message) =>
    openModal('editMessage', {
      title: t('app.user.liveChat.conversation.edit_title'),
      description: t('app.user.liveChat.conversation.edit_desc'),
      confirmButtonText: t('app.user.liveChat.conversation.edit_confirm'),
      cancelButtonText: t('app.user.liveChat.conversation.cancel'),
      onConfirm: async () => {
        hideModal();
        setShouldRefresh(true);
      },
      body: (
        <textarea
          ref={editTextAreaRef}
          className="w-full p-2 border rounded"
          defaultValue={message?.text || ''}
        />
      )
    });

  const handleDeleteMessageModal = (message_id) =>
    openModal('deleteMessage', {
      title: t('app.user.liveChat.conversation.delete_title'),
      description: t('app.user.liveChat.conversation.delete_desc'),
      confirmButtonText: t('app.user.liveChat.conversation.delete_confirm'),
      cancelButtonText: t('app.user.liveChat.conversation.cancel'),
      confirmButtonType: 'Danger',
      onConfirm: async () => {
        try {
          await axiosInstance.delete(
            `/api/user/liveChat/${conversation_id}/messages/${message_id}`
          );
          displayMessage(t('app.user.liveChat.conversation.message_deleted'), 'success');
          setShouldRefresh(true);
        } catch {
          displayMessage(t('app.user.liveChat.conversation.message_delete_failed'), 'error');
        } finally {
          hideModal();
        }
      }
    });

  return (
    <div className="flex flex-col items-center w-full">
      <div className="container-style w-full">
        {/* Conversations sidebar */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-[280px_auto] gap-6">
          <div className="lg:block hidden">
            <div className="sticky top-4">
              <div className="text-xl font-bold mb-2">
                {t('app.user.liveChat.conversation.list_title')}
              </div>
              <div
                className="flex flex-col gap-2"
                style={{ maxHeight: '420px', overflowY: 'auto', width: '100%' }}
              >
                {userConversations
                  .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                  .map((c) => {
                    const isUnread = c.unreadCount > 0;
                    return (
                      <Link
                        key={c.conversation_id}
                        href={`/user/liveChat/${c.conversation_id}`}
                        className="px-2 py-3 rounded-lg text-xs font-bold w-full transition-colors border"
                        title={
                          isUnread
                            ? t('app.user.liveChat.conversation.tooltip_unread')
                            : t('app.user.liveChat.conversation.tooltip_all_read')
                        }
                      >
                        <span className="inline-flex items-center gap-2">
                          <span>{c.subject || t('app.user.liveChat.conversation.no_subject')}</span>
                          {isUnread && (
                            <span className="inline-block ml-2 px-2 py-0.5 rounded-full bg-blue-900 text-white text-[14px] font-bold shadow">
                              {c.unreadCount === 1
                                ? t('app.user.liveChat.conversation.unread_badge_one')
                                : t('app.user.liveChat.conversation.unread_badge_other', {
                                    count: c.unreadCount
                                  })}
                            </span>
                          )}
                        </span>
                      </Link>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Live Chat Room */}
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
        </div>

        {/* Danger Zone */}
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
                    chatType="live"
                    onActionSuccess={() => {
                      displayMessage(
                        t('app.user.liveChat.conversation.conversation_deleted'),
                        'success'
                      );
                      setTimeout(() => {
                        router.push(`/${locale}/user/liveChat/main`); // ✅ locale captured
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
