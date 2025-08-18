/**
 *   =================== UserConversationDetailsPage.js ===================
 * 📑
 * HEADLINE: User Conversation Details (full CRUD, real-time, modal-safe)
 * - Fetches and displays conversation & messages for user.
 * - Handles modals for edit/delete at the page level for reliability.
 * - Passes all modal handlers as props to LiveChatRoom.
 * ========================================================================
 */

'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useRouter } from '@/lib/language';
import { useSession } from 'next-auth/react';

import useAuthGuard from '@/hooks/useAuthGuard';
import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import ConversationActionButton from '@/components/reusableUI/ConversationActionButton';
import LiveChatRoom from '@/components/reusableUI/socket/LiveChatRoom';
import IsAdminOnline from '@/components/reusableUI/socket/IsAdminOnline';
import useModal from '@/hooks/useModal';
import useRefreshMessages from '@/hooks/socket/useRefreshMessages';
import { useT } from '@/lib/i18n/client'; // 🌍 translator

export default function UserConversationDetailsPage() {
  // 🔤 Translator for conversation namespace
  const t = useT('app.user.liveChat.conversation');

  // 🧭 Routing/Auth/Modal contexts
  const { conversation_id } = useParams();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('user');
  const { data: session, status } = useSession();
  const { openModal, hideModal } = useModal();
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  // 💬 Local state
  const [conversationDetails, setConversationDetails] = useState(null);
  const [initialMessages, setInitialMessages] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [userConversations, setUserConversations] = useState([]);
  const [currentSubject, setCurrentSubject] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const editTextAreaRef = useRef(null);

  // 🔁 Socket refresh
  const { requestRefresh } = useRefreshMessages(conversation_id, 'live');

  // 🔄 Handle modal-triggered refreshes
  useEffect(() => {
    if (shouldRefresh) {
      requestRefresh?.();
      setShouldRefresh(false);
    }
  }, [shouldRefresh, requestRefresh]);

  // 📥 Fetch conversation
  const fetchConversationData = async () => {
    try {
      if (!conversation_id) return;
      showLoader({ text: t('loading') }); // ⏳ localized

      const { data: convoData } = await axiosInstance.get(`/api/user/liveChat/${conversation_id}`);
      setConversationDetails(convoData);
      setInitialMessages(convoData.messages);
      setUserDetails(convoData.owner);
      setCurrentSubject(convoData.subject);

      const { data: userConvos } = await axiosInstance.get(`/api/user/liveChat/main`, {
        params: { page: 1, limit: 100 }
      });
      setUserConversations(userConvos.conversations || []);
      setIsReady(true);
    } catch (error) {
      displayMessage(t('fail'), 'error');
      setIsReady(false);
    } finally {
      hideLoader();
    }
  };

  useEffect(() => {
    fetchConversationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation_id, status]);

  // 🔐 Redirect if not allowed
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) router.replace(redirect);
  }, [status, isAllowed, redirect, router]);

  // ✏️ Edit Modal
  const handleEditMessageModal = (messageId, oldMessage, onEditMessage) => {
    openModal('editMessage', {
      title: t('edit_message'),
      confirmButtonText: t('save'),
      cancelButtonText: t('cancel'),
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
            displayMessage(t('message_updated'), 'success');
            hideModal();
            setShouldRefresh(true);
          }
        } catch (error) {
          displayMessage(t('error_edit'), 'error');
        }
      },
      onCancel: hideModal
    });
  };

  // 🗑️ Delete Modal
  const handleDeleteMessageModal = (messageId, onDeleteMessage) => {
    openModal('deleteMessage', {
      title: t('delete_message'),
      description: t('delete_prompt'),
      confirmButtonType: 'Danger',
      confirmButtonText: t('delete'),
      cancelButtonText: t('cancel'),
      onConfirm: () => {
        try {
          onDeleteMessage(messageId);
          displayMessage(t('message_deleted'), 'success');
          hideModal();
          setShouldRefresh(true);
        } catch (error) {
          displayMessage(t('error_delete'), 'error');
        }
      },
      onCancel: hideModal
    });
  };

  if (!conversation_id) return null; // 🧯 Guard

  return (
    <div className="flex flex-col items-center w-full mt-4">
      <div className="container-style lg:w-10/12 w-full mt-2 p-2">
        {/* 👤 User info title localized */}
        {conversationDetails && (
          <div className="flex items-center justify-center w-full">
            <div className="flex flex-col lg:flex-row gap-2 items-center lg:items-stretch w-10/12 mb-2">
              <div className="container-style lg:min-w-[220px] lg:max-w-lg w-full p-2 text-center border mx-auto">
                <h2 className="font-bold underline mb-1 text-xl">{t('user_info')}</h2>
                <p className="text-lg">
                  <strong>{t('name')}</strong> {conversationDetails.owner?.name || 'N/A'}
                </p>
                <p className="text-lg">
                  <strong>{t('email')}</strong> {conversationDetails.owner?.email || 'N/A'}
                </p>
                <p className="text-lg">
                  <strong>{t('username')}</strong> {conversationDetails.owner?.username || 'N/A'}
                </p>
              </div>
              <div className="container-style min-w-[220px] w-full p-2 text-center border mx-auto justify-center items-center">
                <IsAdminOnline user_id={session?.user?.user_id} />
              </div>
            </div>
          </div>
        )}

        {/* 🧭 Conversation Switcher: All user conversations as buttons */}
        {userConversations.length > 1 && (
          <div className="flex items-center justify-center mt-2 mb-4">
            <div className="container-style w-11/12 lg:w-10/12 p-2">
              <h3 className="text-lg font-bold mb-1 text-center">{t('other_conversations')}</h3>
              <div className="flex items-center justify-center">
                <hr className="border border-white w-8/12 my-2" />
              </div>

              <div
                className="flex flex-col gap-1 p-1 w-full max-h-48 overflow-y-auto transition-all"
                style={{ minWidth: 0, width: '100%' }}
              >
                {userConversations
                  .sort(
                    (conversationA, conversationB) =>
                      new Date(conversationB.updatedAt) - new Date(conversationA.updatedAt)
                  )
                  .map((conversationItem) => {
                    const isCurrent = conversationItem.conversation_id === conversation_id; // ✅ current highlight
                    const isUnread = conversationItem.unreadCount > 0; // 🔔 unread badge

                    // 🎨 Color logic (unchanged)
                    const readBg = 'bg-gray-500 hover:bg-slate-300 text-white';
                    const unreadBg = 'bg-purple-700 text-white hover:bg-purple-500';

                    return (
                      <button
                        key={conversationItem.conversation_id}
                        onClick={
                          () => router.replace(`/user/liveChat/${conversationItem.conversation_id}`)
                          // 💡 admin variant: router.replace(`/admin/liveChat/${conversationItem.conversation_id}`)
                        }
                        className={`px-2 py-3 rounded-lg text-xs font-bold w-full transition-colors border
                  ${isCurrent ? 'border-2 border-green-300' : 'border border-transparent'}
                  ${isUnread ? unreadBg : readBg}
                `}
                        style={{ minWidth: 90, width: '100%' }}
                        title={isUnread ? t('tooltip_unread') : t('tooltip_all_read')}
                      >
                        {/* 🏷️ Subject text with fallback */}
                        {conversationItem.subject || t('no_subject')}

                        {/* 🔔 Unread badge (pluralized) */}
                        {isUnread && (
                          <span className="inline-block ml-2 px-2 py-0.5 rounded-full bg-blue-900 text-white text-[14px] font-bold shadow">
                            {conversationItem.unreadCount === 1
                              ? t('unread_badge_one')
                              : t('unread_badge_other', { count: conversationItem.unreadCount })}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* 💬 Live Chat Room */}
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

        {/* ⚠️ Danger Zone */}
        <div className="flex flex-col justify-center items-center w-full">
          <div className="w-8/12 max-w-lg">
            <div className="w-full p-2 mt-4 border border-red-500 rounded-lg text-center bg-red-400">
              <h2 className="text-base font-bold mb-2 text-red-900">{t('danger_zone')}</h2>
              <p className="mb-2 text-xs text-red-100">{t('danger_message')}</p>
              <div className="flex items-center justify-center w-full">
                {userDetails?.user_id && (
                  <ConversationActionButton
                    action="delete"
                    user_id={userDetails.user_id}
                    conversation_id={conversation_id}
                    chatType="live"
                    onActionSuccess={() => {
                      displayMessage(t('conversation_deleted'), 'success');
                      setTimeout(() => {
                        router.push('/user/liveChat/main');
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
