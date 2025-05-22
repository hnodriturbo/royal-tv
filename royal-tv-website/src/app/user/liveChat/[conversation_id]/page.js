/**
 * user/liveChat/[conversation_id]/page.js
 * ---------------------------------------
 * 1️⃣ Loads user + admin info for the header (compact, two-column)
 * 2️⃣ Shows <ChatRoom /> only after data is loaded
 * 3️⃣ Handles switching between user's conversations
 * 4️⃣ Shows “Is Admin Online” status (green ✔️ or red ❌)
 * 5️⃣ Danger Zone with compact styling
 */

'use client';

// 0️⃣ React / Next
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// 1️⃣ Project helpers
import useAuthGuard from '@/hooks/useAuthGuard';
import useAppHandlers from '@/hooks/useAppHandlers';
import useModal from '@/hooks/useModal';
import axiosInstance from '@/lib/axiosInstance';
import ChatRoom from '@/components/reusableUI/socket/ChatRoom';
import IsAdminOnline from '@/components/reusableUI/socket/IsAdminOnline';
import ConversationActionButton from '@/components/reusableUI/ConversationActionButton';

export default function UserConversationDetailsPage() {
  // 2️⃣ Route + auth
  const { conversation_id } = useParams();
  const { status } = useSession();
  const { isAllowed, redirect } = useAuthGuard('user');
  const router = useRouter();

  // 3️⃣ App handlers
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { openModal, hideModal } = useModal();

  // 4️⃣ Local state
  const [conversationDetails, setConversationDetails] = useState(null);
  const [initialMessages, setInitialMessages] = useState([]);
  const [userConversations, setUserConversations] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [isReady, setIsReady] = useState(false);

  // 6️⃣ Header fetch
  const fetchHeaderData = useCallback(
    async (signal) => {
      if (!conversation_id) return;
      try {
        showLoader({ text: 'Loading conversation…' });

        // a️⃣ Conversation + messages
        const { data: convo } = await axiosInstance.get(`/api/user/liveChat/${conversation_id}`, {
          signal
        });
        setConversationDetails(convo);
        setInitialMessages(convo.messages);
        setUserDetails(convoData.user);
        setIsReady(true);

        // b️⃣ List all user conversations (for switcher)
        const { data: list } = await axiosInstance.get(`/api/user/liveChat/main`, {
          params: { page: 1, limit: 100 },
          signal
        });
        setUserConversations(list.conversations);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          displayMessage('Failed to load conversation', 'error');
        }
      } finally {
        hideLoader();
      }
    },
    [conversation_id]
  );

  // 7️⃣ Load header once per conversation
  useEffect(() => {
    if (status !== 'authenticated' || !isAllowed) return;
    fetchHeaderData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isAllowed, conversation_id]);

  // 8️⃣ Auth redirect
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) router.replace(redirect);
  }, [status, isAllowed, redirect, router]);

  // 🔻 Render
  return (
    <div className="flex flex-col items-center w-full">
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

        {/* 🔀 Conversation switcher */}
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
                      onClick={() => router.replace(`/user/liveChat/${conv.conversation_id}`)}
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

        {/* 💬 Chat room */}
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

        {/* ⚠️ Danger Zone - compact */}
        <div className="flex flex-col justify-center items-center w-full">
          <div className="w-8/12 max-w-lg">
            <div className="w-full p-2 mt-4 border border-red-500 rounded-lg text-center bg-red-400">
              <h2 className="text-base font-bold mb-2 text-red-900">Danger Zone</h2>
              <p className="mb-2 text-xs text-red-100">
                Deleting removes all messages permanently.
              </p>
              <div className="flex items-center justify-center w-full">
                <ConversationActionButton action="delete" user_id="" chatType="live" />
                <button onClick={handleDeleteConversation} className="btn-danger w-10/12">
                  Delete Conversation
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
