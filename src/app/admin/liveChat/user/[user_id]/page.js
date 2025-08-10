'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axiosInstance from '@/lib/core/axiosInstance';
import Link from 'next/link';
import useAppHandlers from '@/hooks/useAppHandlers';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useSession } from 'next-auth/react';
import ConversationActionButton from '@/components/reusableUI/ConversationActionButton';

// Sorting imports, AutoRefresh, Pagination
import SortDropdown from '@/components/reusableUI/SortDropdown';
import useLocalSorter from '@/hooks/useLocalSorter';
import { conversationSortOptions, getConversationSortFunction } from '@/lib/sorting';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import Pagination from '@/components/reusableUI/Pagination';

const AdminSeeUserConversations = () => {
  const { data: session, status } = useSession();
  const { user_id } = useParams();
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const router = useRouter();

  // 🟢 State
  const [conversations, setConversations] = useState([]);
  const [username, setUsername] = useState('');
  const [user, setUser] = useState({});

  const [currentPage, setCurrentPage] = useState(1); // 🔢 Current page
  const [sortOrder, setSortOrder] = useState('updatedAt_desc'); // 🔀 Sort order

  // 🧠 Sorted conversations
  const sortedConversations = useLocalSorter(conversations, sortOrder, getConversationSortFunction);
  // 📏 Results per page
  const pageSize = 5;
  // 🔢 Total pages
  const totalPages = Math.ceil(sortedConversations.length / pageSize);
  // 🎯 Conversations for current page
  const pagedConversations = sortedConversations.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // 🟢 Fetch ALL user conversations (no pagination, all at once)
  const fetchUserConversations = async () => {
    try {
      showLoader({ text: 'Loading conversations...' });

      const { data } = await axiosInstance.get(`/api/admin/liveChat/user/${user_id}`);
      const convs = data.conversations || [];
      setConversations(convs);

      // Store user details
      if (data.userDetails) {
        setUsername(data.userDetails.name);
        setUser(data.userDetails);
      }

      // Redirect if only one conversation
      if (convs.length === 1) {
        router.replace(`/admin/liveChat/${convs[0].conversation_id}`);
        return;
      }
    } catch (error) {
      displayMessage('Failed to load user conversations', 'error');
    } finally {
      hideLoader();
    }
  };

  // 🟢 Fetch on mount/param/status
  useEffect(() => {
    if (user_id && status === 'authenticated' && isAllowed) {
      fetchUserConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user_id, isAllowed, status]);

  // 🟢 AutoRefresh
  const { AutoRefresh } = useAutoRefresh(fetchUserConversations, {
    intervalSeconds: 600,
    uiOptions: { showManualButton: true, showPauseToggle: true }
  });

  // 🟢 Redirect if Not Authorized
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  // ---------- If not allowed, render nothing ----------
  if (!isAllowed) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="container-style">
        <div className="flex flex-col items-center text-center justify-center text-2xl text-wonderful-3 relative">
          <h1 className="text-wonderful-5">Conversations for {username}</h1>
          <hr className="border border-gray-400 w-8/12 text-center items-center justify-center my-2" />
        </div>
        {/* 🔄 Sorting & AutoRefresh Controls (row on desktop, stacked on mobile) */}
        <div className="flex justify-center items-center w-full">
          <div className="flex flex-col w-10/12 mb-3 items-center md:flex-row md:space-x-3 md:space-y-0 space-y-10">
            {/* 🟦 SortDropdown centered in its column */}
            <div className="flex-1 flex justify-center items-center m-2">
              <SortDropdown
                options={conversationSortOptions}
                value={sortOrder}
                onChange={setSortOrder}
              />
            </div>

            {/* 📏 Divider for mobile/tablet */}
            <hr className="md:hidden border border-gray-400 w-8/12 my-4" />

            {/* ⏳ AutoRefresh centered in its column */}
            <div className="flex-1 flex justify-center items-center">{AutoRefresh}</div>
          </div>
        </div>
        <div className="flex items-center justify-center">
          {/* 📏 Divider for mobile/tablet */}
          <hr className="md:hidden border border-gray-400 w-8/12 my-4" />
        </div>
        {/* 🆕 Create Conversation Button (own row, always centered) */}
        <div className="flex justify-center w-full mb-6">
          <ConversationActionButton
            action="create"
            user_id={user?.user_id}
            user={user}
            chatType="live"
            buttonText="Start New Conversation"
            isAdmin={true}
            // add m-0 if you want zero margin
          />
        </div>

        {/* ===================💻 Desktop: Responsive Table View (xl+) =================== */}
        <div className="hidden xl:flex justify-center w-full">
          {/* 🖱️ Enables horizontal scroll if needed */}
          <div className="w-full max-w-full overflow-x-auto">
            <table className="min-w-[750px] w-full border-separate border-spacing-0 text-shadow-dark-1">
              <thead className="text-center">
                <tr className="bg-gray-600">
                  <th className="border border-gray-300 px-4 py-2">Conversation ID</th>
                  <th className="border border-gray-300 px-4 py-2">Subject</th>
                  <th className="border border-gray-300 px-4 py-2">Last Updated</th>
                  <th className="border border-gray-300 px-4 py-2">Unread Messages</th>
                  <th className="border border-gray-300 px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody className="text-center">
                {pagedConversations.length === 0 ? (
                  <tr>
                    {/* 🚫 Empty state */}
                    <td
                      colSpan="5"
                      className="text-center py-4 text-gray-500 border border-gray-300"
                    >
                      No conversations found.
                    </td>
                  </tr>
                ) : (
                  pagedConversations.map((conversationObject) => (
                    <tr key={conversationObject.conversation_id} className="hover:bg-gray-400">
                      <td className="border border-gray-300 px-4 py-2">
                        {conversationObject.conversation_id}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 max-w-[200px] truncate">
                        {/* 📋 Subject truncated if too long */}
                        <span className="block truncate" title={conversationObject.subject}>
                          {conversationObject.subject || 'No Subject'}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {/* ⏱️ Show last updated in local format */}
                        {new Date(conversationObject.updatedAt).toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {/* 🟢 Unread messages count, green if positive */}
                        {conversationObject.unreadCount > 0 ? (
                          <span className="text-green-500 font-bold">
                            ● {conversationObject.unreadCount}
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {/* 🛠️ Action buttons */}
                        <div className="flex flex-row gap-2 no-wrap w-fit justify-center">
                          <button
                            className="btn-primary"
                            onClick={() =>
                              router.push(`/admin/liveChat/${conversationObject.conversation_id}`)
                            }
                          >
                            View Messages
                          </button>
                          <ConversationActionButton
                            action="delete"
                            user_id={user?.user_id}
                            conversation_id={conversationObject.conversation_id}
                            chatType="live"
                            onActionSuccess={fetchUserConversations}
                            isAdmin={true}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* ===================📱 Card View for Mobile/Tablet (below xl) =================== */}
        <div className="xl:hidden flex flex-col gap-4 w-full mt-6">
          {pagedConversations.map((conv) => (
            <div
              key={conv.conversation_id}
              className="border border-gray-300 rounded-2xl p-4 shadow-sm bg-gray-500 text-md"
            >
              <div className="flex justify-between mb-2">
                <h3 className="font-semibold text-lg">{user.name || 'N/A'}</h3>
                <span>E-mail: {user.email || 'N/A'}</span>
              </div>
              <div className="space-y-1">
                <p>
                  <strong>Subject:</strong>{' '}
                  <span title={conv.subject}>{conv.subject || 'No Subject'}</span>
                </p>
                <p>
                  <strong>Last Updated:</strong> {new Date(conv.updatedAt).toLocaleString()}
                </p>
                <p>
                  <strong>Unread Messages:</strong>{' '}
                  {conv.unreadCount > 0 ? (
                    <span className="text-green-500 font-bold">● {conv.unreadCount}</span>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                </p>
              </div>
              <div className="flex justify-center">
                <div className="flex sm:flex-row flex-col justify-end gap-2 mt-3 sm:w-full w-10/12">
                  <Link href={`/admin/liveChat/${conv.conversation_id}`}>
                    <button className="btn-primary w-full">View Messages</button>
                  </Link>
                  <ConversationActionButton
                    action="delete"
                    user_id={user?.user_id}
                    conversation_id={conv.conversation_id}
                    chatType="live"
                    onActionSuccess={fetchUserConversations}
                    isAdmin={true}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* 🔢 Pagination below tables/cards */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default AdminSeeUserConversations;
