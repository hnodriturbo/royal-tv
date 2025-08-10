/**
 * ========================= AdminUsersMainPage.js =========================
 * 👤
 * HEADLINE: Admin Users – Main List (Cards Only)
 * - Cards for each user, show all key relations.
 * - Sorting at top, pagination at bottom.
 * - Buttons to see user’s Free Trials, Live & Bubble Chats, Subs, Profile.
 * ========================================================================
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import { useSession } from 'next-auth/react';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useRouter } from 'next/navigation';
import { adminUserSortOptions, getAdminUserSortFunction } from '@/lib/sorting';
import SortDropdown from '@/components/reusableUI/SortDropdown';
import useLocalSorter from '@/hooks/useLocalSorter';
import Pagination from '@/components/reusableUI/Pagination';
import ConversationActionButton from '@/components/reusableUI/ConversationActionButton';

export default function AdminUsersMainPage() {
  // 🦸 Admin session/auth
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  // 📦 Users state
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1); // 🔢 Current page
  const [sortOrder, setSortOrder] = useState('livechat_unread_first'); // 🔀 Default sort order

  // 📥 Fetch all Users (admin)
  const fetchUsers = async () => {
    try {
      showLoader({ text: 'Loading users...' }); // ⏳
      const res = await axiosInstance.get('/api/admin/users/main');
      setUsers(res.data.users || []);
      displayMessage('Users loaded!', 'success');
    } catch (err) {
      displayMessage(
        `Failed to load users${err?.response?.data?.error ? `: ${err.response.data.error}` : ''}`,
        'error'
      );
    } finally {
      hideLoader();
    }
  };

  // 🚦 Only fetch ONCE when allowed
  useEffect(() => {
    if (status === 'authenticated' && isAllowed) {
      fetchUsers();
    }
  }, [status, isAllowed]);

  // 🚦 Redirect if not allowed
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  // 🧠 Add the sort fields for compatibility with your sort function
  const usersWithSortFields = users.map((user) => ({
    ...user,
    freeTrials: user.freeTrials || [],
    subscriptions: user.subscriptions || [],
    unreadLiveChats: user.unreadLiveChats || 0,
    unreadBubbleChats: user.unreadBubbleChats || 0,
    name: user.name || ''
  }));

  // 🧠 Sorted users (use custom hook)
  const sortedUsers = useLocalSorter(usersWithSortFields, sortOrder, getAdminUserSortFunction);

  // 📏 Results per page
  const pageSize = 5;

  // 🔢 Total pages
  const totalPages = Math.ceil(sortedUsers.length / pageSize);

  // 🎯 Users for current page
  const pagedUsers = sortedUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // 🔄 Reset to first page if sortOrder changes
  useEffect(() => {
    setCurrentPage(1);
  }, [sortOrder]);

  // ---------- If not allowed, render nothing ----------
  if (!isAllowed) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="container-style max-w-3xl w-full">
        {/* 🏷️ Title & Divider */}
        <div className="flex flex-col items-center text-center justify-center w-full">
          <h1 className="text-wonderful-5 text-2xl mb-0">All Users (Cards View)</h1>
          <hr className="border border-gray-400 w-8/12 my-4" />
        </div>

        {/* 🔀 Sorting Dropdown */}
        <div className="flex justify-end w-full mb-4">
          <SortDropdown options={adminUserSortOptions} value={sortOrder} onChange={setSortOrder} />
        </div>

        {/* 🃏 User Cards */}
        <div className="flex flex-col gap-6 w-full mt-6">
          {pagedUsers.length === 0 && (
            <div className="text-center text-gray-400 my-8">No users found.</div>
          )}
          {pagedUsers.map((user) => (
            <div
              key={user.user_id}
              className="border border-gray-300 rounded-2xl p-5 shadow-md bg-gray-600 text-base-100 relative"
            >
              {/* 🆔 Top: Name, Username, Email */}
              <div className="flex flex-col md:flex-row justify-between mb-2 items-center">
                <div className="w-full text-center flex flex-col items-center">
                  <h3 className="font-semibold text-lg">
                    {/* 👤 Name & Username */}
                    {user.name}
                    <span className="ml-2 text-xs text-muted">({user.username})</span>
                  </h3>
                  <div className="text-sm mt-1">
                    <span>Email: {user.email}</span>
                  </div>
                  <div className="text-xs text-muted">
                    <span>
                      {/* 🕰️ Joined: */}
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 items-end mt-2 md:mt-0">
                  {/* 🔑 User Role */}
                  <span className="absolute right-2 top-2 px-3 py-1 rounded-lg bg-purple-800 text-sm font-bold uppercase tracking-wider">
                    {user.role}
                  </span>
                </div>
              </div>
              {/* 📱 Contact info row */}
              <div className="flex flex-row gap-4 text-sm mb-2 justify-center">
                {user.whatsapp && (
                  <span>
                    <span className="font-bold">WhatsApp:</span> {user.whatsapp}
                  </span>
                )}
                {user.telegram && (
                  <span>
                    <span className="font-bold">Telegram:</span> {user.telegram}
                  </span>
                )}
                <span>
                  <span className="font-bold">Preferred Contact:</span> {user.preferredContactWay}
                </span>
              </div>
              {/* 🔗 Action Buttons for Relations */}
              <div className="flex flex-col gap-3 mt-4 w-full">
                {/* 🎁 Free Trials */}
                {user.freeTrials && user.freeTrials.length > 0 ? (
                  <Link
                    href={`/admin/freeTrials/${user.freeTrials[0].trial_id}`}
                    className="w-full"
                  >
                    <button className="btn-secondary w-full flex items-center justify-center">
                      <span>
                        🎁 Free Trials{' '}
                        <span className="ml-1 font-normal">({user.totalFreeTrials})</span>
                      </span>
                      {user.freeTrials[0].status && (
                        <span
                          className={`ml-2 text-xs font-bold ${
                            user.freeTrials[0].status === 'disabled'
                              ? 'text-red-400'
                              : user.freeTrials[0].status === 'pending'
                                ? 'text-yellow-400'
                                : 'text-green-400'
                          }`}
                        >
                          (
                          {user.freeTrials[0].status.charAt(0).toUpperCase() +
                            user.freeTrials[0].status.slice(1)}
                          )
                        </span>
                      )}
                    </button>
                  </Link>
                ) : (
                  <button
                    className="btn:disabled w-full opacity-50 cursor-not-allowed flex flex-col items-center py-2 border border-white rounded-md"
                    disabled
                  >
                    🎁 Free Trials (0)
                  </button>
                )}

                {/* 💬 Live Chat Conversations */}
                {user.totalLiveChats > 0 && user.role !== 'admin' ? (
                  <Link href={`/admin/liveChat/user/${user.user_id}`} className="w-full">
                    <button className="btn-primary w-full flex flex-col items-center py-2">
                      <span>💬 Live Chats </span>
                      <span className="font-normal mt-1">
                        Total: {user.totalLiveChats} -{' '}
                        <span className={user.unreadLiveChats > 0 ? 'font-bold' : 'text-muted'}>
                          Unread: {user.unreadLiveChats}
                        </span>
                      </span>
                    </button>
                  </Link>
                ) : (
                  user.role !== 'admin' && (
                    <ConversationActionButton
                      action="create"
                      buttonClass="w-full flex flex-col items-center py-4 border border-white rounded-md btn-primary"
                      user_id={user.user_id}
                      user={user}
                      isAdmin={true}
                      size="lg"
                      buttonText="💬 Start Conversation"
                    />
                  )
                )}

                {/* 🫧 Bubble Chat Conversations */}
                {/* {user.totalBubbleChats > 0 ? (
                  <Link href={`/admin/bubbleChat/user/${user.user_id}`} className="w-full">
                    <button className="btn-primary w-full flex flex-col items-center py-2">
                      <span>
                        🫧 Bubble Chats{' '}
                        <span className="font-normal">({user.totalBubbleChats})</span>
                      </span>
                      <span className="text-sm mt-1">
                        Unread:
                        <span
                          className={
                            user.unreadBubbleChats > 0 ? 'text-accent-2 font-bold' : 'text-muted'
                          }
                        >
                          {user.unreadBubbleChats}
                        </span>
                      </span>
                    </button>
                  </Link>
                ) : (
                  <button
                    className="btn:disabled w-full opacity-50 cursor-not-allowed flex flex-col items-center py-2 border border-white rounded-md"
                    disabled
                    type="button"
                  >
                    <span>🫧 Bubble Chats (0)</span>
                    <span className="text-sm mt-1 text-muted">Unread: 0</span>
                  </button>
                )} */}

                {/* 📦 Subscriptions */}
                {user.subscriptions && user.subscriptions.length > 0 ? (
                  <Link
                    href={`/admin/subscriptions/${user.subscriptions[0].subscription_id}`}
                    className="w-full"
                  >
                    <button className="btn-secondary w-full">
                      📦 Subscriptions{' '}
                      <span className="ml-1 font-normal">({user.totalSubscriptions})</span>
                    </button>
                  </Link>
                ) : (
                  <button
                    className="btn:disabled w-full opacity-50 cursor-not-allowed flex flex-col items-center py-2 border border-white rounded-md"
                    disabled
                  >
                    📦 Subscriptions (0)
                  </button>
                )}

                {/* 🪪 Profile */}
                <Link href={`/admin/users/${user.user_id}`} className="w-full">
                  <button className="btn-success w-full">🪪 Profile</button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* 🔢 Pagination below cards */}
        <div className="flex justify-center mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}
