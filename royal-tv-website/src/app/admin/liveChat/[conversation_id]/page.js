/**
 * admin/liveChat/[conversation_id]/page.js
 * ---------------------------------------
 *  1️⃣  Axios‑loads header (user + convo list) once per conversation
 *  2️⃣  Mounts <ChatRoom /> only after header is ready
 *  3️⃣  Joins socket room exactly once and cleans up on route change
 *  4️⃣  Shows “Danger Zone” with full‑convo delete
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

export default function AdminConversationDetailsPage() {
  /* ── route + auth ─────────────────────────────────────────────── */
  const { conversation_id } = useParams();
  const { data: session, status } = useSession();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const router = useRouter();

  /* ── utils ────────────────────────────────────────────────────── */
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { openModal, hideModal } = useModal();

  /* ── local state ──────────────────────────────────────────────── */
  const [userDetails, setUserDetails] = useState(null);
  const [userConversations, setUserConversations] = useState([]);
  /* ✨ 1. new piece of state holds the full conversation */
  const [conversationDetails, setConversationDetails] = useState(null);
  const [initialMessages, setInitialMessages] = useState([]);
  const [isReady, setIsReady] = useState(false); // unchanged

  /* ── header fetch ------------------------------------------------ */
  const fetchHeaderData = useCallback(
    async (signal) => {
      if (!conversation_id) return;
      try {
        showLoader({ text: 'Loading conversation…' });

        /* ① conversation + messages + user */
        const { data: convo } = await axiosInstance.get(
          `/api/admin/liveChat/${conversation_id}`,
          { signal },
        );

        /* ✨ 2. store everything we get back from the API */
        setConversationDetails(convo); // full record inc. subject, createdAt
        setInitialMessages(convo.messages);
        setIsReady(true);
        /* ② list of user conversations */
        const { data: list } = await axiosInstance.get(
          `/api/admin/liveChat/user/${convo.user.user_id}`,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversation_id], // 🗑️ join removed
  );

  /* ── effect: load header once per convo ------------------------- */
  useEffect(() => {
    if (status !== 'authenticated' || !isAllowed) return;
    const controller = new AbortController();
    fetchHeaderData(controller.signal);
    return () => controller.abort(); // 🧹 cancel on unmount / id change
  }, [status, isAllowed, conversation_id, fetchHeaderData]);

  /* ── auth redirect ---------------------------------------------- */
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect)
      router.replace(redirect);
  }, [status, isAllowed, redirect, router]);

  /* ── danger‑zone delete convo ----------------------------------- */
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
          await axiosInstance.delete(`/api/admin/liveChat/${conversation_id}`);
          displayMessage('Conversation deleted', 'success');
          router.push('/admin/liveChat/main');
        } catch (err) {
          displayMessage('Delete failed', 'error');
        } finally {
          hideLoader();
          hideModal();
        }
      },
      onCancel: hideModal,
    });

  /* ── render ───────────────────────────────────────────────────── */
  return (
    <div className="flex flex-col items-center w-full">
      <div className="container-style">
        {/* 1️⃣ user header */}
        {userDetails && (
          <div className="container-style w-full mb-6 p-4 text-center border">
            <h2 className="text-xl font-bold mb-2">User Details</h2>
            <p>
              <strong>Name:</strong> {userDetails.name || 'N/A'}
            </p>
            <p>
              <strong>Email:</strong> {userDetails.email || 'N/A'}
            </p>
            <p>
              <strong>Username:</strong> {userDetails.username || 'N/A'}
            </p>
          </div>
        )}

        {/* 2️⃣ convo switcher */}
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
                      router.replace(`/admin/liveChat/${conv.conversation_id}`)
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

        {/* 3️⃣ ChatRoom (only when ready) and centered */}

        {isReady && (
          <div className="flex justify-center">
            {' '}
            {/* 🎯 flexbox centering */}
            <ChatRoom
              conversation_id={conversation_id}
              conversation={conversationDetails} /* 🎁 new prop */
              initialMessages={initialMessages}
              className="max-h-[650px]"
            />
          </div>
        )}
        {/* 4️⃣ danger zone */}
        <div className="p-6 mt-8 border border-red-500 rounded-lg bg-red-400 text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-900">Danger Zone</h2>
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
