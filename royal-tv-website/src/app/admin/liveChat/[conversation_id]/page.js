// 🗃️ AdminConversationDetailsPage.js (with signal support)
// ----------------------------------------------------
// Handles fetching and displaying an admin's view of a user's conversation details,
// including all user conversations, with safe request cancellation.

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import useAuthGuard from '@/hooks/useAuthGuard';
import axiosInstance from '@/lib/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import ConversationActionButton from '@/components/reusableUI/ConversationActionButton';
import ChatRoom from '@/components/reusableUI/socket/ChatRoom';
import OnlineUsers from '@/components/reusableUI/socket/OnlineUsers';
import IsAdminOnline from '@/components/reusableUI/socket/IsAdminOnline';
import useModal from '@/hooks/useModal';

export default function AdminConversationDetailsPage() {
  // 🔑 Routing & Auth
  const { conversation_id } = useParams();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const { data: session, status } = useSession();
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { openModal, hideModal } = useModal();

  // 💾 Local State
  const [conversationDetails, setConversationDetails] = useState(null);
  const [initialMessages, setInitialMessages] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [userConversations, setUserConversations] = useState([]);
  const [isReady, setIsReady] = useState(false);

  // 📨 Fetch conversation details + all user conversations (signal-safe)
  const fetchConversationData = useCallback(
    async (signal) => {
      if (!conversation_id) return;
      showLoader({ text: 'Loading Conversation' });
      try {
        // 1️⃣ Fetch conversation with messages + user info (pass signal!)
        const { data: convoData } = await axiosInstance.get(
          `/api/admin/liveChat/${conversation_id}`,
          { signal }
        );
        setConversationDetails(convoData);
        setInitialMessages(convoData.messages);
        setUserDetails(convoData.user);

        // 2️⃣ Fetch all conversations for this user (pass signal!)
        const { data: userConvos } = await axiosInstance.get(
          `/api/admin/liveChat/user/${convoData.user.user_id}`,
          {
            params: { page: 1, limit: 100 },
            signal
          }
        );
        setUserConversations(userConvos.conversations || []);
        setIsReady(true);
      } catch (error) {
        if (error.name !== 'CanceledError') {
          displayMessage('❌ Failed to load conversation', 'error');
        }
        setIsReady(false);
      } finally {
        hideLoader();
      }
    },
    [conversation_id]
  );

  // 🚦 AbortController pattern for safe fetch cancellation
  useEffect(() => {
    const controller = new AbortController();
    fetchConversationData(controller.signal);
    return () => controller.abort();
  }, [conversation_id, fetchConversationData]);

  // 🔐 Redirect if not authorized
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  // 🔻 Render
  return (
    <div className="flex flex-col items-center w-full">
      <OnlineUsers />
      {/* 🔲 Main container, compact width */}
      <div className="container-style max-w-5xl mt-2 p-2">
        {/* 🧑‍🤝‍🧑 Two-column header (User & Admin info) */}
        {conversationDetails && (
          <div className="flex flex-col md:flex-row gap-2 justify-center items-stretch w-full mb-2">
            {/* 👤 User info */}
            <div className="container-style flex-1 min-w-[220px] p-2 text-center border">
              <h2 className="text-base font-bold mb-1">Your Info</h2>
              <p className="text-xs">
                <strong>Name:</strong> {conversationDetails.user?.name || 'N/A'}
              </p>
              <p className="text-xs">
                <strong>Email:</strong> {conversationDetails.user?.email || 'N/A'}
              </p>
              <p className="text-xs">
                <strong>Username:</strong> {conversationDetails.user?.username || 'N/A'}
              </p>
            </div>
            {/* 🧑‍💼 Admin info */}
            <div className="container-style flex-1 min-w-[220px] p-2 text-center border">
              <IsAdminOnline user_id={conversationDetails.user?.user_id} />
            </div>
          </div>
        )}
        {/* 2️⃣ Conversation Switcher */}
        {userConversations.length > 1 && (
          <div className="flex items-center justify-center">
            <div className="container-style-sm mb-2 p-2">
              <h3 className="text-sm font-bold mb-1 text-center">Other Conversations</h3>
              <div className="flex overflow-x-auto gap-1 p-1 whitespace-nowrap">
                {userConversations
                  .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                  .map((conv) => (
                    <button
                      key={conv.conversation_id}
                      onClick={() => router.replace(`/admin/liveChat/${conv.conversation_id}`)}
                      className={`px-2 py-1 rounded-lg text-xs text-white ${
                        conv.conversation_id === conversation_id
                          ? 'bg-blue-600'
                          : 'bg-gray-700 hover:bg-gray-600'
                      }`}
                    >
                      {conv.subject || 'No Subject'}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* 3️⃣ ChatRoom */}
        {isReady && (
          <div className="flex justify-center">
            <ChatRoom
              conversation_id={conversation_id}
              conversation={conversationDetails}
              initialMessages={initialMessages}
              className="max-h-[500px] min-h-[400px]"
              chatType="live"
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
                    chatType="live"
                    onActionSuccess={() =>
                      router.push(`/admin/liveChat/user/${userDetails.user_id}`)
                    }
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
