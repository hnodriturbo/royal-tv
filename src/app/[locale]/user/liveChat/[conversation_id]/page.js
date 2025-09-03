/**
 *   =================== UserConversationDetailsPage.js ===================
 * 📑 HEADLINE: User Conversation Details (full CRUD, real-time, modal-safe)
 * - Fetch and show one conversation with its messages
 * - Keep modal handlers at page level for reliability
 * - Pass modal callbacks to <LiveChatRoom />
 * =======================================================================
 */

'use client';

import { useEffect, useState, useRef } from 'react';

import { Link, useRouter } from '@/i18n';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl'; // 🌍 translator root (no namespace)

import useAuthGuard from '@/hooks/useAuthGuard';
import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import ConversationActionButton from '@/components/reusableUI/ConversationActionButton';
import LiveChatRoom from '@/components/reusableUI/socket/LiveChatRoom';
import IsAdminOnline from '@/components/reusableUI/socket/IsAdminOnline';
import useModal from '@/hooks/useModal';
import useRefreshMessages from '@/hooks/socket/useRefreshMessages';

export default function UserConversationDetailsPage() {
  // 🗣️ Use root translator; always call full paths
  const t = useTranslations();

  // 🧭 Routing/Auth/Session
  const { conversation_id } = useParams(); // 🧩 route param
  const router = useRouter(); // 🚦 navigation
  const { isAllowed, redirect } = useAuthGuard('user'); // 🔐 guard
  const { data: session, status } = useSession(); // 👤 session

  // 🧰 App handlers
  const { displayMessage, showLoader, hideLoader } = useAppHandlers(); // 🧯 UX helpers
  const { openModal, hideModal } = useModal(); // 🪟 modal

  // 💬 Local state for page rendering
  const [conversationDetails, setConversationDetails] = useState(null); // 🧾 convo
  const [initialMessages, setInitialMessages] = useState([]); // ✉️ initial messages
  const [userDetails, setUserDetails] = useState(null); // 👤 owner details
  const [userConversations, setUserConversations] = useState([]); // 📚 list
  const [currentSubject, setCurrentSubject] = useState(''); // 🏷️ subject
  const [isReady, setIsReady] = useState(false); // ✅ ready flag
  const [shouldRefresh, setShouldRefresh] = useState(false); // 🔁 trigger refresh
  const editTextAreaRef = useRef(null); // 📝 modal textarea ref

  // 🔄 Socket refresh helper
  const { requestRefresh } = useRefreshMessages(conversation_id, 'live'); // 📡 refresh hook

  // 🔁 Kick socket refresh after modal actions
  useEffect(() => {
    if (shouldRefresh) {
      requestRefresh?.(); // 🔔 ask chat to re-fetch messages
      setShouldRefresh(false); // 🔧 reset flag
    }
  }, [shouldRefresh, requestRefresh]); // 🧩 do not include t

  // 📥 Load conversation + list for switcher
  const fetchConversationData = async () => {
    try {
      if (!conversation_id) return; // 🚧 guard
      showLoader({ text: t('app.user.liveChat.conversation.loading') }); // ⏳ show loader

      // 📄 load one conversation
      const { data: conversationData } = await axiosInstance.get(
        `/api/user/liveChat/${conversation_id}`
      );
      setConversationDetails(conversationData);
      setInitialMessages(conversationData.messages);
      setUserDetails(conversationData.owner);
      setCurrentSubject(conversationData.subject);

      // 📚 load user conversations (for switcher)
      const { data: userConversationsData } = await axiosInstance.get(`/api/user/liveChat/main`, {
        params: { page: 1, limit: 100 }
      });
      setUserConversations(userConversationsData.conversations || []);
      setIsReady(true); // ✅ ready to render room
    } catch (error) {
      displayMessage(t('app.user.liveChat.conversation.fail'), 'error'); // ❌ error toast
      setIsReady(false);
    } finally {
      hideLoader(); // 🧽 hide loader
    }
  };

  // 🚀 Fetch on mount / param change / after login
  useEffect(() => {
    fetchConversationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation_id, status]); // 🔁 avoid t dependency

  // ✏️ Edit modal (confirms and calls provided handler)
  const handleEditMessageModal = (messageId, oldMessage, onEditMessage) => {
    openModal('editMessage', {
      title: t('app.user.liveChat.conversation.edit_message'), // 📝 title
      confirmButtonText: t('app.user.liveChat.conversation.save'), // 💾 save
      cancelButtonText: t('app.user.liveChat.conversation.cancel'), // ❎ cancel
      customContent: () => (
        // 🧾 textarea for editing
        <textarea
          defaultValue={oldMessage}
          ref={editTextAreaRef}
          className="border p-2 w-full h-24 text-black rounded-lg"
        />
      ),
      onConfirm: () => {
        try {
          const updatedMessage = editTextAreaRef.current?.value?.trim(); // ✍️ new content
          if (updatedMessage && updatedMessage !== oldMessage) {
            onEditMessage(messageId, updatedMessage); // 🚚 send to room
            displayMessage(t('app.user.liveChat.conversation.message_updated'), 'success'); // ✅ toast
            hideModal(); // 🧹 close modal
            setShouldRefresh(true); // 🔁 trigger refresh
          }
        } catch (error) {
          displayMessage(t('app.user.liveChat.conversation.error_edit'), 'error'); // ❌ toast
        }
      },
      onCancel: hideModal
    });
  };

  // 🗑️ Delete modal (confirms and calls provided handler)
  const handleDeleteMessageModal = (messageId, onDeleteMessage) => {
    openModal('deleteMessage', {
      title: t('app.user.liveChat.conversation.delete_message'), // 🗑️ title
      description: t('app.user.liveChat.conversation.delete_prompt'), // ⚠️ prompt
      confirmButtonType: 'Danger',
      confirmButtonText: t('app.user.liveChat.conversation.delete'), // 🧨 delete
      cancelButtonText: t('app.user.liveChat.conversation.cancel'), // ❎ cancel
      onConfirm: () => {
        try {
          onDeleteMessage(messageId); // 🧹 delete in room
          displayMessage(t('app.user.liveChat.conversation.message_deleted'), 'success'); // ✅ toast
          hideModal(); // 🧹 close modal
          setShouldRefresh(true); // 🔁 refresh chat
        } catch (error) {
          displayMessage(t('app.user.liveChat.conversation.error_delete'), 'error'); // ❌ toast
        }
      },
      onCancel: hideModal
    });
  };
  // 🔐 Redirect if blocked
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) router.replace(redirect);
  }, [status, isAllowed, redirect, router]); // 🧭 no t here

  if (!conversation_id) return null; // 🧯 extra guard

  return (
    <div className="flex flex-col items-center w-full mt-4">
      <div className="container-style lg:w-10/12 w-full mt-2 p-2">
        {/* 👤 User info header */}
        {conversationDetails && (
          <div className="flex items-center justify-center w-full">
            <div className="flex flex-col lg:flex-row gap-2 items-center lg:items-stretch w-10/12 mb-2">
              <div className="container-style lg:min-w-[220px] lg:max-w-lg w-full p-2 text-center border mx-auto">
                <h2 className="font-bold underline mb-1 text-xl">
                  {t('app.user.liveChat.conversation.user_info')}
                </h2>
                <p className="text-lg">
                  <strong>{t('app.user.liveChat.conversation.name')}</strong>{' '}
                  {conversationDetails.owner?.name || 'N/A'}
                </p>
                <p className="text-lg">
                  <strong>{t('app.user.liveChat.conversation.email')}</strong>{' '}
                  {conversationDetails.owner?.email || 'N/A'}
                </p>
                <p className="text-lg">
                  <strong>{t('app.user.liveChat.conversation.username')}</strong>{' '}
                  {conversationDetails.owner?.username || 'N/A'}
                </p>
              </div>

              {/* 🟢 Admin online indicator */}
              <div className="container-style min-w-[220px] w-full p-2 text-center border mx-auto justify-center items-center">
                <IsAdminOnline user_id={session?.user?.user_id} />
              </div>
            </div>
          </div>
        )}

        {/* 🧭 Conversation switcher */}
        {userConversations.length > 1 && (
          <div className="flex items-center justify-center mt-2 mb-4">
            <div className="container-style w-11/12 lg:w-10/12 p-2">
              <h3 className="text-lg font-bold mb-1 text-center">
                {t('app.user.liveChat.conversation.other_conversations')}
              </h3>
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
                    const isCurrent = conversationItem.conversation_id === conversation_id; // 📍 current
                    const isUnread = conversationItem.unreadCount > 0; // 🔔 unread flag

                    // 🎨 simple color logic
                    const readBg = 'bg-gray-500 hover:bg-slate-300 text-white';
                    const unreadBg = 'bg-purple-700 text-white hover:bg-purple-500';

                    return (
                      <Link
                        href={`/user/liveChat/${conversationItem.conversation_id}`}
                        className="px-2 py-3 rounded-lg text-xs font-bold w-full transition-colors border"
                        title={
                          isUnread
                            ? t('app.user.liveChat.conversation.tooltip_unread')
                            : t('app.user.liveChat.conversation.tooltip_all_read')
                        }
                      >
                        <span className="inline-flex items-center gap-2">
                          <span>
                            {conversationItem.subject ||
                              t('app.user.liveChat.conversation.no_subject')}
                          </span>
                          {isUnread && (
                            <span className="inline-block ml-2 px-2 py-0.5 rounded-full bg-blue-900 text-white text-[14px] font-bold shadow">
                              {conversationItem.unreadCount === 1
                                ? t('app.user.liveChat.conversation.unread_badge_one')
                                : t('app.user.liveChat.conversation.unread_badge_other', {
                                    count: conversationItem.unreadCount
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
              <h2 className="text-base font-bold mb-2 text-red-900">
                {t('app.user.liveChat.conversation.danger_zone')}
              </h2>
              <p className="mb-2 text-xs text-red-100">
                {t('app.user.liveChat.conversation.danger_message')}
              </p>
              <div className="flex items-center justify-center w-full">
                {userDetails?.user_id && (
                  <ConversationActionButton
                    action="delete"
                    user_id={userDetails.user_id}
                    conversation_id={conversation_id}
                    chatType="live"
                    onActionSuccess={() => {
                      displayMessage(
                        t('app.user.liveChat.conversation.conversation_deleted'),
                        'success'
                      );
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
