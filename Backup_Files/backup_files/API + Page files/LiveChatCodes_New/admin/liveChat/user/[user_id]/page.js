/**
 * /admin/liveChat/user/[user_id]/page.js
 * --------------------------------------
 * Lists every live‑chat conversation that belongs to the selected user.
 * • Admin‑only (useAuthGuard)
 * • Paginated (useConversationsList + Pagination)
 * • Auto‑refresh on socket “refresh_conversation_lists”
 */

'use client';

import { useEffect, useCallback } from 'react'; // 🧰 React hooks
import { useParams, useRouter } from 'next/navigation'; // 🛣️  Next helpers
import { useSession } from 'next-auth/react'; // 🔐 Auth

import useAuthGuard from '@/hooks/useAuthGuard'; // 🛂 Role check
import useAppHandlers from '@/hooks/useAppHandlers'; // 🎉 Toast / Loader
import useConversationsList from '@/components/reusableUI/useConversationsList'; // 📊 Data hook

import Pagination from '@/components/reusableUI/Pagination'; // 🔢 Pager UI

const AdminUserConversationsPage = () => {
  // 1️⃣ ─── Auth & router
  const { status } = useSession(); // 🔄 logged‑in?
  const { isAllowed, redirect } = useAuthGuard('admin'); // 🛂 must be admin
  const router = useRouter();

  // 2️⃣ ─── URL param
  const { user_id } = useParams() || {}; // 🆔 user id from URL

  // 3️⃣ ─── Data (uses socket auto‑refresh behind the scenes)
  const {
    items: conversations,
    currentPage,
    totalPages,
    setCurrentPage,
    isLoading,
    refetch, // 🔄 manual silent refresh
  } = useConversationsList({
    role: 'admin',
    selectedUserId: user_id,
    chatType: 'liveChat',
    pageSize: 5,
  });

  // 4️⃣ ─── Helpers
  const { displayMessage } = useAppHandlers();

  const handleManualRefresh = useCallback(() => {
    refetch?.(); // 🔄 silent re‑fetch
    displayMessage('Refreshing…', 'info');
  }, [refetch, displayMessage]);

  // 5️⃣ ─── Redirect if not authorised
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  if (!isAllowed) return null; // 🚫 no peeky‑peeky

  // 6️⃣ ─── Render
  return (
    <div className="flex flex-col items-center w-full">
      <div className="container-style">
        {/* 🏷️  Header */}
        <div className="flex flex-col items-center text-center">
          <h1 className="text-3xl font-bold mb-3">
            Conversations for&nbsp;<span className="underline">{user_id}</span>
          </h1>
          <button
            onClick={handleManualRefresh}
            className="bg-gray-600 text-white px-3 py-1 rounded mb-4 hover:bg-gray-700 transition"
          >
            🔄 Refresh
          </button>
        </div>

        {/* 🖥️ Desktop table */}
        <div className="overflow-x-auto pc:block mobile:hidden">
          <table className="w-full border-collapse border border-gray-300 text-sm">
            <thead>
              <tr className="bg-gray-600 text-white">
                <th className="border px-4 py-2">Conversation ID</th>
                <th className="border px-4 py-2">Subject</th>
                <th className="border px-4 py-2">Updated</th>
                <th className="border px-4 py-2">Messages</th>
                <th className="border px-4 py-2">Unread</th>
                <th className="border px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-6">
                    Loading…
                  </td>
                </tr>
              ) : conversations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-6">
                    No conversations found.
                  </td>
                </tr>
              ) : (
                conversations.map((c) => (
                  <tr key={c.conversation_id} className="hover:bg-gray-400">
                    <td className="border px-4 py-2">{c.conversation_id}</td>
                    <td className="border px-4 py-2 max-w-xs truncate">
                      {c.subject || '—'}
                    </td>
                    <td className="border px-4 py-2">
                      {c.updatedAt
                        ? new Date(c.updatedAt).toLocaleString()
                        : '—'}
                    </td>
                    <td className="border px-4 py-2">{c.totalMessages || 0}</td>
                    <td className="border px-4 py-2">
                      {c.messagesCount > 0 ? (
                        <span className="text-green-500 font-bold">
                          ● {c.messagesCount}
                        </span>
                      ) : (
                        0
                      )}
                    </td>
                    <td className="border px-4 py-2">
                      <button
                        onClick={() =>
                          router.push(`/admin/liveChat/${c.conversation_id}`)
                        }
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition"
                      >
                        Open Chat
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 📱 Mobile cards */}
        <div className="mobile:flex pc:hidden flex-col gap-4 mt-6">
          {conversations.map((c) => (
            <div
              key={c.conversation_id}
              className="border border-gray-300 rounded-lg p-4 bg-gray-600 text-white"
            >
              <p>
                <strong>Subject:</strong> {c.subject || '—'}
              </p>
              <p>
                <strong>Updated:</strong>{' '}
                {c.updatedAt ? new Date(c.updatedAt).toLocaleString() : '—'}
              </p>
              <p>
                <strong>Messages:</strong> {c.totalMessages || 0}
              </p>
              <p>
                <strong>Unread:</strong>{' '}
                {c.messagesCount > 0 ? `● ${c.messagesCount}` : 0}
              </p>
              <button
                onClick={() =>
                  router.push(`/admin/liveChat/${c.conversation_id}`)
                }
                className="mt-3 bg-blue-500 text-white px-3 py-1 rounded w-full hover:bg-blue-600 transition"
              >
                Open Chat
              </button>
            </div>
          ))}
        </div>

        {/* 🔢 Pager */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default AdminUserConversationsPage;
