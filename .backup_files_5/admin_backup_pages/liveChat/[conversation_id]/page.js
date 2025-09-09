/**
 *   =================== AdminConversationDetailsPage.js ===================
 * 📑
 * HEADLINE: Admin Conversation Details (full CRUD, real-time, modal-safe)
 * - Fetches and displays conversation & messages for admin.
 * - Handles modals for edit/delete at the page level for reliability.
 * - Passes all modal handlers as props to LiveChatRoom.
 * ========================================================================
 */

'use client';

import { useEffect, useState, useRef } from 'react';

import { useSession } from 'next-auth/react';
import { useRouter } from '@/i18n';

import useAuthGuard from '@/hooks/useAuthGuard';
import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import ConversationActionButton from '@/components/reusableUI/ConversationActionButton';
import LiveChatRoom from '@/components/reusableUI/socket/LiveChatRoom';
import { IsAdminOnline } from '@/components/reusableUI/socket/IsAdminOnline';
import useModal from '@/hooks/useModal';
import useRefreshMessages from '@/hooks/socket/useRefreshMessages';

export default function AdminConversationDetailsPage() {
  // 1️⃣ Routing, Auth, and Modal Contexts
  const { conversation_id } = useParams();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const { data: session, status } = useSession();
  const { openModal, hideModal } = useModal();
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  // 2️⃣ Chat and UI State
  const [conversationDetails, setConversationDetails] = useState(null);
  const [initialMessages, setInitialMessages] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [userConversations, setUserConversations] = useState([]);
  const [currentSubject, setCurrentSubject] = useState('');
  const [isReady, setIsReady] = useState(false);
  const [shouldRefresh, setShouldRefresh] = useState(false);
  const editTextAreaRef = useRef(null);

  // 3️⃣ Socket Refresh Hook (for chatroom or page-level refresh)
  const { requestRefresh } = useRefreshMessages(conversation_id, 'live');

  // 4️⃣ Handle Modal-triggered refreshes
  useEffect(() => {
    if (shouldRefresh) {
      requestRefresh?.();
      setShouldRefresh(false);
    }
  }, [shouldRefresh, requestRefresh]);

  // 5️⃣ Fetch conversation details (and all conversations for the user)
  const fetchConversationData = async () => {
    try {
      if (!conversation_id) return;
      showLoader({ text: 'Loading Conversation' });

      // 👉 Fetch conversation + user info
      const { data: convoData } = await axiosInstance.get(`/api/admin/liveChat/${conversation_id}`);
      setConversationDetails(convoData);
      setInitialMessages(convoData.messages);
      let user;
      if (convoData.owner.role === 'user') {
        user = convoData.owner;
      } else {
        // Admin is owner—find the user from the messages
        const userMessage = convoData.messages.find(
          (msg) => msg.sender_is_admin === false && msg.sender
        );
        user = userMessage ? userMessage.sender : null;
      }
      setUserDetails(user);
      setUserDetails(convoData.owner);
      setCurrentSubject(convoData.subject);

      // 👉 Fetch all conversations for this user
      const { data: userConvos } = await axiosInstance.get(
        `/api/admin/liveChat/user/${convoData.owner.user_id}`,
        { params: { page: 1, limit: 100 } }
      );
      setUserConversations(userConvos.conversations || []);
      setIsReady(true);
    } catch (error) {
      displayMessage('❌ Failed to load conversation', 'error');
      setIsReady(false);
    } finally {
      hideLoader();
    }
  };

  // 6️⃣ Fetch on mount and conversation_id/session change
  useEffect(() => {
    fetchConversationData();
    // eslint-disable-next-line
  }, [conversation_id, status]);

  // 7️⃣ Auth Guard - redirect if not allowed
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  // 8️⃣ Edit Message Modal Handler (passed to LiveChatRoom)
  const handleEditMessageModal = (msgId, oldMsg, onEditMessage) => {
    openModal('editMessage', {
      title: 'Edit Message',
      confirmButtonText: 'Save',
      cancelButtonText: 'Cancel',
      customContent: () => (
        <textarea
          defaultValue={oldMsg}
          ref={editTextAreaRef}
          className="border p-2 w-full h-24 text-black rounded-lg"
        />
      ),
      onConfirm: () => {
        try {
          const updated = editTextAreaRef.current?.value?.trim();
          if (updated && updated !== oldMsg) {
            onEditMessage(msgId, updated);
            displayMessage('Message updated!', 'success');
            hideModal();
            setShouldRefresh(true); // 🚦 Will auto-refresh after modal closes!
          }
        } catch (error) {
          displayMessage('There was an error editing the message', 'error');
        }
      },
      onCancel: hideModal
    });
  };

  // 9️⃣ Delete Message Modal Handler (passed to LiveChatRoom)
  const handleDeleteMessageModal = (msgId, onDeleteMessage) => {
    openModal('deleteMessage', {
      title: 'Delete Message',
      description: 'Are you sure you want to delete this message?',
      confirmButtonType: 'Danger',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      onConfirm: () => {
        try {
          onDeleteMessage(msgId);
          displayMessage('Message deleted!', 'success');
          hideModal();
          setShouldRefresh(true); // 🚦 Will auto-refresh after modal closes!
        } catch (error) {
          displayMessage(
            'There was an error deleting your message. Please try again later.',
            'error'
          );
        }
      },
      onCancel: hideModal
    });
  };

  // 🔒 Render nothing if no conversation_id (defensive)
  if (!conversation_id) return null;

  // 🔻 RENDER UI
  return (
    <div className="flex flex-col items-center w-full mt-4">
      {/* 🔲 Main container, compact width */}
      <div className="container-style lg:w-10/12 w-full mt-4 p-2">
        {/* 🧑‍🤝‍🧑 Two-column header (User & Admin info) */}
        {conversationDetails && (
          <div className="flex items-center justify-center w-full">
            <div className="flex flex-col lg:flex-row gap-2 items-center lg:items-stretch w-10/12 mb-2">
              {/* 👤 User info */}
              <div className="container-style lg:min-w-[220px] lg:max-w-lg w-full p-2 text-center border mx-auto">
                <h2 className="text-base font-bold mb-1">User Info</h2>
                <p className="text-xs">
                  <strong>Name:</strong> {conversationDetails.owner?.name || 'N/A'}
                </p>
                <p className="text-xs">
                  <strong>Email:</strong> {conversationDetails.owner?.email || 'N/A'}
                </p>
                <p className="text-xs">
                  <strong>Username:</strong> {conversationDetails.owner?.username || 'N/A'}
                </p>
              </div>
              {/* 🧑‍💼 Admin info */}
              <div className="container-style min-w-[220px] lg:max-w-lg w-full p-2 text-center border mx-auto">
                <IsAdminOnline />
              </div>
            </div>
          </div>
        )}
        {/* 2️⃣ Conversation Switcher: All user conversations as buttons */}
        {userConversations.length > 1 && (
          <div className="flex items-center justify-center mt-2 mb-4">
            <div className="container-style w-11/12 lg:w-10/12 p-2">
              <h3 className="text-lg font-bold mb-1 text-center">Other Conversations</h3>
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
                    const isCurrent = conversationItem.conversation_id === conversation_id;
                    const isUnread = conversationItem.unreadCount > 0;

                    // 🎨 Color logic
                    const readBg = 'bg-gray-500 hover:bg-slate-300 text-white'; // For read convos
                    const unreadBg = 'bg-purple-700 text-white hover:bg-purple-500'; // For unread convos

                    return (
                      <button
                        key={conversationItem.conversation_id}
                        onClick={() =>
                          router.replace(`/admin/liveChat/${conversationItem.conversation_id}`)
                        }
                        className={`px-2 py-3 rounded-lg text-xs font-bold w-full transition-colors border
                  ${isCurrent ? 'border-2 border-green-300' : 'border border-transparent'}
                  ${isUnread ? unreadBg : readBg}
                `}
                        style={{ minWidth: 90, width: '100%' }}
                        title={
                          isUnread ? 'Unread messages in this conversation' : 'All messages read'
                        }
                      >
                        {conversationItem.subject || 'No Subject'}
                        {isUnread && (
                          <span className="inline-block ml-2 px-2 py-0.5 rounded-full bg-blue-900 text-white text-[14px] font-bold shadow">
                            {conversationItem.unreadCount === 1
                              ? '1 Unread Message'
                              : `${conversationItem.unreadCount} Unread Messages`}
                          </span>
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* 3️⃣ Live Chat Room (flex-grow container for chat!) */}
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

        {/* 4️⃣ Danger Zone */}
        <div className="flex flex-col justify-center items-center w-full">
          <div className="w-8/12 max-w-lg">
            <div className="w-full p-2 mt-4 border border-red-500 rounded-lg text-center bg-red-400">
              <h2 className="text-base font-bold mb-2 text-red-900">Danger Zone</h2>
              <p className="mb-2 text-xs text-red-100">
                Deleting removes all messages permanently.
              </p>
              <div className="flex items-center justify-center w-full">
                {userDetails?.user_id && (
                  <ConversationActionButton
                    action="delete"
                    user_id={userDetails.user_id}
                    conversation_id={conversation_id}
                    onActionSuccess={() => {
                      displayMessage('Conversation deleted successfully!', 'success');
                      setTimeout(() => {
                        router.push(`/admin/liveChat/user/${userDetails.user_id}`);
                      }, 1200); // 1.2s delay for user feedback
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
