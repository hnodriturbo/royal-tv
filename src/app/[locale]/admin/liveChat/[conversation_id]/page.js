/**
 * ================== AdminLiveChatConversationPage.js ==================
 * 🧭 Admin Live Chat: Single Conversation
 * - Loads a conversation + messages
 * - Provides edit/delete modals
 * - Uses <Link> for navigation to other conversations
 * - Translations under app.admin.liveChat.conversation.*
 * =======================================================================
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { Link, useRouter } from '@/i18n';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl'; // 🌐 i18n (full-path keys only)
import { useParams } from 'next/navigation';

import useAuthGuard from '@/hooks/useAuthGuard';
import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import ConversationActionButton from '@/components/reusableUI/ConversationActionButton';
import LiveChatRoom from '@/components/reusableUI/socket/LiveChatRoom';
import IsAdminOnline from '@/components/reusableUI/socket/IsAdminOnline';
import useModal from '@/hooks/useModal';
import useRefreshMessages from '@/hooks/socket/useRefreshMessages';

export default function AdminLiveChatConversationPage() {
  const t = useTranslations(); // 🌐 translator

  const { conversation_id } = useParams();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const { data: session, status } = useSession();

  const { openModal, hideModal } = useModal();
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

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
      showLoader({ text: t('app.admin.liveChat.page.loading') });

      const { data: convoData } = await axiosInstance.get(`/api/admin/liveChat/${conversation_id}`);
      setConversationDetails(convoData);
      setInitialMessages(convoData.messages);

      let user;
      if (convoData.owner.role === 'user') {
        user = convoData.owner;
      } else {
        const userMessage = convoData.messages.find(
          (msg) => msg.sender_is_admin === false && msg.sender
        );
        user = userMessage ? userMessage.sender : null;
      }
      setUserDetails(user || convoData.owner);
      setCurrentSubject(convoData.subject);

      const { data: userConvos } = await axiosInstance.get(
        `/api/admin/liveChat/user/${(user || convoData.owner).user_id}`,
        { params: { page: 1, limit: 100 } }
      );
      setUserConversations(userConvos.conversations || []);
      setIsReady(true);
    } catch {
      displayMessage(t('app.admin.liveChat.page.load_failed'), 'error');
      setIsReady(false);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    fetchConversationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation_id, status]);

  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  const handleEditMessageModal = (messageId, oldMessage, onEditMessage) => {
    openModal('editMessage', {
      title: t('app.admin.liveChat.page.edit_title'),
      confirmButtonText: t('app.admin.liveChat.page.edit_confirm'),
      cancelButtonText: t('app.admin.liveChat.page.cancel'),
      customContent: () => (
        <textarea
          defaultValue={oldMessage}
          ref={editTextAreaRef}
          className="border p-2 w-full h-24 text-black rounded-lg"
        />
      ),
      onConfirm: () => {
        try {
          const updated = editTextAreaRef.current?.value?.trim();
          if (updated && updated !== oldMessage) {
            onEditMessage(messageId, updated);
            displayMessage(t('app.admin.liveChat.page.msg_updated'), 'success');
            hideModal();
            setShouldRefresh(true);
          }
        } catch {
          displayMessage(t('app.admin.liveChat.page.msg_edit_error'), 'error');
        }
      },
      onCancel: hideModal
    });
  };

  const handleDeleteMessageModal = (messageId, onDeleteMessage) => {
    openModal('deleteMessage', {
      title: t('app.admin.liveChat.page.delete_title'),
      description: t('app.admin.liveChat.page.delete_description'),
      confirmButtonType: 'Danger',
      confirmButtonText: t('app.admin.liveChat.page.delete_confirm'),
      cancelButtonText: t('app.admin.liveChat.page.cancel'),
      onConfirm: () => {
        try {
          onDeleteMessage(messageId);
          displayMessage(t('app.admin.liveChat.page.msg_deleted'), 'success');
          hideModal();
          setShouldRefresh(true);
        } catch {
          displayMessage(t('app.admin.liveChat.page.msg_delete_error'), 'error');
        }
      },
      onCancel: hideModal
    });
  };

  if (!conversation_id) return null;

  return (
    <div className="flex flex-col items-center w-full mt-4">
      <div className="container-style lg:w-10/12 w-full mt-4 p-2">
        {conversationDetails && (
          <div className="flex items-center justify-center w-full">
            <div className="flex flex-col lg:flex-row gap-2 items-center lg:items-stretch w-10/12 mb-2">
              <div className="container-style lg:min-w-[220px] lg:max-w-lg w-full p-2 text-center border mx-auto">
                <h2 className="text-base font-bold mb-1">
                  {t('app.admin.liveChat.page.user_info')}
                </h2>
                <p className="text-xs">
                  <strong>{t('app.admin.liveChat.page.name')}:</strong>{' '}
                  {conversationDetails.owner?.name || 'N/A'}
                </p>
                <p className="text-xs">
                  <strong>{t('app.admin.liveChat.page.email')}:</strong>{' '}
                  {conversationDetails.owner?.email || 'N/A'}
                </p>
                <p className="text-xs">
                  <strong>{t('app.admin.liveChat.page.username')}:</strong>{' '}
                  {conversationDetails.owner?.username || 'N/A'}
                </p>
              </div>
              <div className="container-style min-w-[220px] lg:max-w-lg w-full p-2 text-center border mx-auto">
                <IsAdminOnline />
              </div>
            </div>
          </div>
        )}

        {userConversations.length > 1 && (
          <div className="flex items-center justify-center mt-2 mb-4">
            <div className="container-style w-11/12 lg:w-10/12 p-2">
              <h3 className="text-lg font-bold mb-1 text-center">
                {t('app.admin.liveChat.page.other_conversations')}
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

                    const badge =
                      c.unreadCount === 1
                        ? t('app.admin.liveChat.page.unread_badge_one')
                        : t('app.admin.liveChat.page.unread_badge_other', { count: c.unreadCount });

                    return (
                      <Link
                        key={c.conversation_id}
                        href={`/admin/liveChat/${c.conversation_id}`}
                        className={`px-2 py-3 rounded-lg text-xs font-bold w-full transition-colors border
                          ${isCurrent ? 'border-2 border-green-300' : 'border border-transparent'}
                          ${isUnread ? 'bg-purple-700 text-white hover:bg-purple-500' : 'bg-gray-500 hover:bg-slate-300 text-white'}
                        `}
                        title={
                          isUnread
                            ? t('app.admin.liveChat.page.unread_tooltip')
                            : t('app.admin.liveChat.page.all_read_tooltip')
                        }
                      >
                        {c.subject || t('app.admin.liveChat.page.no_subject')}
                        {isUnread && (
                          <span className="inline-block ml-2 px-2 py-0.5 rounded-full bg-blue-900 text-white text-[14px] font-bold shadow">
                            {badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {isReady && conversationDetails && (
          <div className="flex flex-col flex-grow w-full">
            <LiveChatRoom
              session={session}
              conversation_id={conversation_id}
              initialMessages={initialMessages}
              onEditMessageModal={handleEditMessageModal}
              onDeleteMessageModal={handleDeleteMessageModal}
              subject={currentSubject}
              user={conversationDetails.owner}
            />
          </div>
        )}

        <div className="flex flex-col justify-center items-center w-full">
          <div className="w-8/12 max-w-lg">
            <div className="w-full p-2 mt-4 border border-red-500 rounded-lg text-center bg-red-400">
              <h2 className="text-base font-bold mb-2 text-red-900">
                {t('app.admin.liveChat.page.danger_zone')}
              </h2>
              <p className="mb-2 text-xs text-red-100">
                {t('app.admin.liveChat.page.danger_warning')}
              </p>
              <div className="flex items-center justify-center w-full">
                {userDetails?.user_id && (
                  <ConversationActionButton
                    action="delete"
                    user_id={userDetails.user_id}
                    conversation_id={conversation_id}
                    onActionSuccess={() => {
                      displayMessage(t('app.admin.liveChat.page.delete_success'), 'success');
                      setTimeout(() => {
                        router.push(`/admin/liveChat/user/${userDetails.user_id}`);
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
