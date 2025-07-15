/**
 * Lists the logged‑in user’s live‑chat conversations
 * with pagination and responsive (table ↔ mobile‑card) layout.
 */

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

import axiosInstance from '@/lib/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useModal from '@/hooks/useModal';
import useAuthGuard from '@/hooks/useAuthGuard';
import Pagination from '@/components/reusableUI/Pagination';
import ConversationActionButton from '@/components/reusableUI/ConversationActionButton';

const UserConversations = () => {
  // 1️⃣ Auth helpers
  const { data: session, status } = useSession();
  const { isAllowed, redirect } = useAuthGuard('user');
  const router = useRouter();
  const [userId, setUserId] = useState('');

  // 2️⃣ UX helpers
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  // 3️⃣ Local state
  const [conversations, setConversations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /* ────────────────────────────────────────────────────────────────
     Fetch helper — paginated conversations
  ───────────────────────────────────────────────────────────────── */
  const fetchUserConversations = useCallback(
    async (page = 1) => {
      try {
        showLoader({ text: 'Loading your conversations…' });
        const { data } = await axiosInstance.get('/api/user/liveChat/main', {
          params: { page, limit: 5 }
        });

        // Defensive: fallback empty array if missing
        setConversations(Array.isArray(data.conversations) ? data.conversations : []);
        // Defensive: fallback 1 if missing
        setTotalPages(data.pagination?.totalPages || 1);

        // Defensive: set user id (session or first conversation)
        if (session?.user?.user_id) {
          setUserId(session.user.user_id);
        } else if (data.conversations && data.conversations.length > 0) {
          setUserId(data.conversations[0].user_id);
        }
        // 🚀 jump when only one convo
        if (data.pagination?.totalConversations === 1 && data.conversations.length === 1) {
          router.replace(`/user/liveChat/${data.conversations[0].conversation_id}`);
        }
      } catch (err) {
        console.error('❌ Fetch conversations failed:', err?.response || err);
        displayMessage('Failed to load conversations', 'error');
        setConversations([]); // fallback
        setTotalPages(1); // fallback
      } finally {
        displayMessage('conversations fetched successfully', 'success');
        hideLoader();
      }
    },
    [router, displayMessage, showLoader, hideLoader, session]
  );

  // Fetch the conversations
  useEffect(() => {
    if (status !== 'authenticated' || !isAllowed) return;
    fetchUserConversations(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isAllowed, currentPage]);

  // ✅ Redirect if Not Authorized
  useEffect(() => {
    if (!isAllowed && redirect) {
      router.replace(redirect); // ✅ Redirect safely in useEffect
    }
  }, [isAllowed, redirect, router]);

  // 🛡️ Don't render anything if access is not allowed
  if (!isAllowed) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="container-style">
        {/* Header + actions */}
        <h1 className="text-3xl font-bold my-2 text-center">
          <span className="super-decorative-2 bold italic">Your Conversations</span>
        </h1>
        <div className="flex justify-center">
          <hr className="border border-gray-400 w-10/12 text-center items-center justify-center m-2" />
        </div>
        <div className="flex flex-row items-center justify-center gap-4 my-4">
          {/* 🟢 Start New Conversation Button */}
          <ConversationActionButton
            action="create"
            user_id={userId}
            user={session?.user}
            isAdmin={false}
            buttonClass="btn-success border-radius-15"
            buttonText="Start New Conversation"
            onActionSuccess={() => fetchUserConversations(currentPage)}
          />
        </div>
        <div className="flex justify-center">
          <hr className="border border-gray-400 w-10/12 text-center items-center justify-center m-2 mb-4" />
        </div>
        {/* 📊 Desktop table */}
        <div className="overflow-x-auto w-full lg:block hidden">
          {conversations.length === 0 ? (
            <p className="text-center">No conversations found.</p>
          ) : (
            <table className="w-full border-collapse border border-gray-300 min-w-[600px]">
              <thead>
                <tr className="bg-gray-700 text-white">
                  <th className="border border-gray-300 px-4 py-2">ID</th>
                  <th className="border border-gray-300 px-4 py-2">Subject</th>
                  <th className="border border-gray-300 px-4 py-2">Unread</th>
                  <th className="border border-gray-300 px-4 py-2">Last Message</th>
                  <th className="border border-gray-300 px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((conv) => (
                  <tr key={conv.conversation_id} className="hover:bg-gray-400 text-white">
                    <td className="border border-gray-300 px-4 py-2">{conv.conversation_id}</td>
                    <td className="border border-gray-300 px-4 py-2">{conv.subject}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {conv.unreadCount > 0 ? (
                        <span className="bg-green-600 text-white rounded-full px-2 py-0.5">
                          {conv.unreadCount}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {new Date(conv.lastMessageAt).toLocaleString()}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 flex gap-2">
                      <button
                        onClick={() => router.push(`/user/liveChat/${conv.conversation_id}`)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition text-sm"
                      >
                        View
                      </button>
                      <ConversationActionButton
                        action="delete"
                        user_id={userId}
                        conversation_id={conv.conversation_id}
                        chatType="live"
                        isAdmin={false}
                        buttonClass="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition text-sm"
                        buttonText="Delete"
                        onActionSuccess={() => fetchUserConversations(currentPage)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 📱 Card View for Mobile */}
        <div className="lg:hidden flex flex-col gap-4 w-full mt-6 no-wrap">
          {conversations.map((conv) => (
            <div
              key={conv.conversation_id}
              className="border border-gray-300 rounded-lg p-4 shadow-sm bg-gray-500 text-white"
            >
              <h3 className="font-semibold text-lg mb-2">{conv.subject}</h3>
              <p className="mb-1">
                <strong>ID:</strong> {conv.conversation_id}
              </p>
              <p className="mb-1">
                <strong>Unread:</strong>{' '}
                {conv.unreadCount > 0 ? (
                  <span className="bg-red-600 text-white rounded-full px-2 py-0.5">
                    {conv.unreadCount}
                  </span>
                ) : (
                  'None'
                )}
              </p>
              <p className="mb-3">
                <strong>Last Message:</strong> {new Date(conv.lastMessageAt).toLocaleString()}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => router.push(`/user/liveChat/${conv.conversation_id}`)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition text-sm"
                >
                  View
                </button>
                <ConversationActionButton
                  action="delete"
                  user_id={userId}
                  conversation_id={conv.conversation_id}
                  chatType="live"
                  isAdmin={false}
                  buttonClass="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition text-sm"
                  buttonText="Delete"
                  onActionSuccess={() => fetchUserConversations(currentPage)}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 🗂️ Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default UserConversations;
