/**
 * user/liveChat/[conversation_id]/page.js
 * ---------------------------------------
 *  1️⃣ Axios-loads header + conversation list once per room
 *  2️⃣ Mounts <ChatRoom /> only after header is ready
 *  3️⃣ Joins socket room exactly once & cleans on route change
 *  4️⃣ Shows “Danger Zone” with full-convo delete
 */

'use client';

// 0️⃣ React / Next
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import dayjs from 'dayjs';
import OnlineUsers from '@/components/reusableUI/socket/OnlineUsers';

// 1️⃣ Project helpers
import useAuthGuard from '@/hooks/useAuthGuard';
import useAppHandlers from '@/hooks/useAppHandlers';
import useModal from '@/hooks/useModal';
import axiosInstance from '@/lib/axiosInstance';

import ChatRoom from '@/components/reusableUI/socket/ChatRoom';

export default function UserConversationDetailsPage() {
  // 2️⃣ Route + auth
  const { conversation_id } = useParams();
  const { status } = useSession();
  const { isAllowed, redirect } = useAuthGuard('user');
  const router = useRouter();

  // 3️⃣ Utils
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { openModal, hideModal } = useModal();

  // 4️⃣ Local state
  const [conversationDetails, setConversationDetails] = useState(null);
  const [initialMessages, setInitialMessages] = useState([]);
  const [userConversations, setUserConversations] = useState([]);
  const [isReady, setIsReady] = useState(false);

  // 5️⃣ Header fetch
  const fetchHeaderData = useCallback(
    async (signal) => {
      if (!conversation_id) return;
      try {
        showLoader({ text: 'Loading conversation…' });

        // 5-a️⃣ Conversation + messages
        const { data: convo } = await axiosInstance.get(
          `/api/user/liveChat/${conversation_id}`,
          { signal },
        );

        setConversationDetails(convo);
        setInitialMessages(convo.messages);
        setIsReady(true);

        // 5-b️⃣ List all user conversations (for switcher)
        const { data: list } = await axiosInstance.get(
          `/api/user/liveChat/main`,
          { params: { page: 1, limit: 100 }, signal },
        );
        setUserConversations(list.conversations);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          console.error(err);
          displayMessage('Failed to load conversation', 'error');
        }
      } finally {
        hideLoader();
      }
    },
    [conversation_id, showLoader, hideLoader, displayMessage],
  );

  // 6️⃣ Load header once per conversation
  useEffect(() => {
    if (status !== 'authenticated' || !isAllowed) return;
    fetchHeaderData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isAllowed, conversation_id]);

  // 7️⃣ Auth redirect
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect)
      router.replace(redirect);
  }, [status, isAllowed, redirect, router]);

  // 8️⃣ Danger-zone delete
  const handleDeleteConversation = () =>
    openModal('confirmDeleteConvo', {
      title: 'Delete Conversation',
      description:
        'This will permanently delete the conversation and all messages.',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      onConfirm: async () => {
        try {
          showLoader({ text: 'Deleting…' });
          await axiosInstance.delete('/api/user/deleteConversation', {
            data: { conversation_id, chatType: 'live' },
          });
          displayMessage('Conversation deleted', 'success');
          router.push('/user/liveChat/main');
        } catch {
          displayMessage('Delete failed', 'error');
        } finally {
          hideLoader();
          hideModal();
        }
      },
      onCancel: hideModal,
    });

  // 9️⃣ Render
  return (
    <div className="flex flex-col items-center w-full">
      <OnlineUsers />
      <div className="container-style">
        {/* 🔀 Conversation switcher */}
        {userConversations.length > 1 && (
          <div className="container-style w-full mb-6">
            <h3 className="text-lg font-bold mb-2 text-center">
              Other Conversations
            </h3>
            <div className="flex overflow-x-auto gap-3 p-2 whitespace-nowrap">
              {userConversations
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .map((conv) => (
                  <button
                    key={conv.conversation_id}
                    onClick={() =>
                      router.replace(`/user/liveChat/${conv.conversation_id}`)
                    }
                    className={`px-4 py-2 rounded-lg text-white ${
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
        )}
        {/* 📰 Conversation header */}
        <div className="flex flex-col justify-center">
          {conversationDetails && (
            <div className="container-style mb-4 text-center">
              <h2 className="text-xl font-bold mb-2">
                {conversationDetails.subject || 'No Subject'}
              </h2>
              <p className="text-sm text-gray-300">
                Last updated:{' '}
                {dayjs(conversationDetails.updatedAt).format('MMM D HH:mm')}
              </p>
            </div>
          )}
        </div>
        {/* 💬 Chat room */}
        {isReady && (
          <div className="flex justify-center">
            <ChatRoom
              conversation_id={conversation_id}
              conversation={conversationDetails}
              initialMessages={initialMessages}
              className="max-h-[650px]"
            />
          </div>
        )}

        {/* ⚠️ Danger Zone */}
        <div className="p-6 mt-8 border border-red-500 rounded-lg bg-red-400 text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-900">Danger Zone</h2>
          <p className="mb-4 text-red-100">
            Deleting removes all messages permanently.
          </p>
          <button
            onClick={handleDeleteConversation}
            className="bg-red-700 text-white px-6 py-3 rounded hover:bg-red-800 transition"
          >
            Delete Conversation
          </button>
        </div>
      </div>
    </div>
  );
}
