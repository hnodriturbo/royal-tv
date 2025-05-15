/**
 * Admin › Live‑Chat › Main (Page)
 * --------------------------------------------------------------------
 * • Shows every user that has ≥ 1 live‑chat conversation
 * • Pagination (5 per page)
 * • Auto refresh every 60 s  +  manual actions call refetch()
 * • Online indicator from <OnlineUsers/>
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import dayjs from 'dayjs';

import axiosInstance from '@/lib/axiosInstance';
import useAuthGuard from '@/hooks/useAuthGuard';
import useAppHandlers from '@/hooks/useAppHandlers';
import useModal from '@/hooks/useModal';
import useConversationsList from '@/components/reusableUI/useConversationsList';
import useOnlineUsers from '@/hooks/socket/useOnlineUsers';
import OnlineUsers from '@/components/reusableUI/socket/OnlineUsers';
import Pagination from '@/components/reusableUI/Pagination';

export default function AdminLiveChatMain() {
  /* ── 1. auth guard ─────────────────────────────── */
  const { status } = useSession();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const router = useRouter();

  /* ── 2. live‑chat list hook ────────────────────── */
  const {
    items: conversations, // <── rename for readability
    currentPage,
    totalPages,
    setCurrentPage,
    isLoading,
    refetch, // ← exposed by the hook
  } = useConversationsList({
    role: 'admin',
    chatType: 'liveChat',
    pageSize: 5,
  });

  /* ── 3. online‑users helper ────────────────────── */
  const onlineUsers = useOnlineUsers();
  const isUserOnline = (uid) => onlineUsers.some((u) => u.user_id === uid);

  /* ── 4. 60‑second auto‑refresh timer ───────────── */
  const [secondsLeft, setSecondsLeft] = useState(60);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (secondsLeft === 0) {
      (async () => {
        await refetch(); // silent refetch
        setSecondsLeft(60); // restart countdown
      })();
    }
  }, [secondsLeft, refetch]);

  /* ── 5. delete‑all convos for one user ─────────── */
  const { openModal, hideModal } = useModal();
  const { showLoader, hideLoader, displayMessage } = useAppHandlers();

  const handleDeleteAll = (userId) =>
    openModal('deleteAllConvos', {
      title: 'Delete All Conversations',
      description:
        'This deletes every live‑chat conversation for this user. Continue?',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      onConfirm: async () => {
        try {
          showLoader({ text: 'Deleting…' });
          await axiosInstance.delete('/api/admin/deleteConversation', {
            params: { userId, chatType: 'liveChat' },
          });
          displayMessage('Deleted ✔️', 'success');
          refetch();
        } catch (e) {
          displayMessage('Delete failed ❌', 'error');
        } finally {
          hideLoader();
          hideModal();
        }
      },
    });

  /* ── 6. redirect guests / non‑admins ───────────── */
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect)
      router.replace(redirect);
  }, [status, isAllowed, redirect, router]);
  if (!isAllowed) return null;

  /* ── 7. render ─────────────────────────────────── */
  return (
    <div className="flex flex-col items-center w-full">
      <OnlineUsers />

      <div className="container-style">
        <h1 className="text-2xl font-bold text-center mb-2">
          👥 Users with Live‑Chat Conversations
        </h1>

        <p className="text-center text-sm mb-4 text-gray-300">
          auto‑refresh in&nbsp;
          <span className="font-semibold text-white">{secondsLeft}s</span>
        </p>

        {isLoading && <p className="text-center text-white mb-4">Loading…</p>}
        {!isLoading && conversations.length === 0 && (
          <p className="text-center text-white mb-4">
            No users with conversations found.
          </p>
        )}

        {/* Desktop table */}
        <div className="overflow-x-auto hidden pc:block">
          <table className="w-full border border-gray-400">
            <thead className="bg-gray-600 text-white">
              <tr>
                <th className="px-3 py-2 border">User</th>
                <th className="px-3 py-2 border">Email</th>
                <th className="px-3 py-2 border">Convos</th>
                <th className="px-3 py-2 border">Unread</th>
                <th className="px-3 py-2 border">Last Msg</th>
                <th className="px-3 py-2 border">Status</th>
                <th className="px-3 py-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((c) => (
                <tr key={c.user.user_id} className="hover:bg-gray-500">
                  <td className="border px-3 py-2">
                    {c.user.name || 'Unnamed'} ({c.user.username})
                  </td>
                  <td className="border px-3 py-2">{c.user.email}</td>
                  <td className="border px-3 py-2">{c.conversationCount}</td>
                  <td className="border px-3 py-2 text-center">
                    {c.totalConversationsForUser > 0 ? (
                      <span className="text-green-400 font-bold">
                        ● {c.totalConversationsForUser}
                      </span>
                    ) : (
                      <span className="text-gray-300">0</span>
                    )}
                  </td>
                  <td className="border px-3 py-2">
                    {c.updatedAt
                      ? dayjs(c.updatedAt).format('MMM D HH:mm')
                      : '—'}
                  </td>
                  <td className="border px-3 py-2 text-center">
                    {isUserOnline(c.user.user_id) ? (
                      <span className="text-green-400 font-bold">
                        🟢 Online
                      </span>
                    ) : (
                      <span className="text-gray-400">🔴 Offline</span>
                    )}
                  </td>
                  <td className="border px-3 py-2">
                    <div className="flex gap-2">
                      <Link href={`/admin/liveChat/user/${c.user.user_id}`}>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">
                          View
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDeleteAll(c.user.user_id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="pc:hidden flex flex-col gap-4">
          {conversations.map((c) => (
            <div
              key={c.user.user_id}
              className="border border-gray-400 rounded-lg p-4 bg-gray-700 text-white"
            >
              <p>
                <strong>User:</strong> {c.user.name || 'Unnamed'}
              </p>
              <p>
                <strong>Email:</strong> {c.user.email}
              </p>
              <p>
                <strong>Convos:</strong> {c.conversationCoun}
              </p>
              <p>
                <strong>Unread:</strong>{' '}
                {c.unreadConversationsForUser > 0 ? (
                  <span className="text-green-400 font-bold">
                    ● {c.unreadConversationsForUser}
                  </span>
                ) : (
                  0
                )}
              </p>
              <p>
                <strong>Last Msg:</strong>{' '}
                {c.updatedAt ? dayjs(c.updatedAt).format('MMM D HH:mm') : '—'}
              </p>
              <p>
                <strong>Status:</strong>{' '}
                {isUserOnline(c.user.user_id) ? '🟢 Online' : '⚪ Offline'}
              </p>

              <div className="flex justify-end gap-2 mt-3">
                <Link href={`/admin/liveChat/user/${c.user.user_id}`}>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded">
                    View
                  </button>
                </Link>
                <button
                  onClick={() => handleDeleteAll(c.user.user_id)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
