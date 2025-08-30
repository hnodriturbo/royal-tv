'use client';

import { useEffect, useState } from 'react';
import { Link, useRouter } from '@/i18n';
import axiosInstance from '@/lib/core/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import { useSession } from 'next-auth/react';
import useAuthGuard from '@/hooks/useAuthGuard';

import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import ConversationActionButton from '@/components/reusableUI/ConversationActionButton';

// Sorting and Pagination
import SortDropdown from '@/components/reusableUI/SortDropdown'; // 🔀 Sort dropdown UI
import useLocalSorter from '@/hooks/useLocalSorter'; // 🧠 Local sorter hook
import {
  userWithConversationsSortOptions,
  getUserWithConversationsSortFunction
} from '@/lib/utils/sorting';
import Pagination from '@/components/reusableUI/Pagination';

const ConversationsPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  // 👥 All users from API
  const [allUsers, setAllUsers] = useState([]);
  // 🔢 Current page
  const [currentPage, setCurrentPage] = useState(1);
  // 📏 Results per page
  const pageSize = 5;
  // 🔀 Sort order
  const [sortOrder, setSortOrder] = useState('lastMessage_desc');

  // 🧠 Sorted users by order
  const sortedUsers = useLocalSorter(allUsers, sortOrder, getUserWithConversationsSortFunction);
  // 🔢 Total pages
  const totalPages = Math.ceil(sortedUsers.length / pageSize);
  // 🎯 Users for current page
  const pagedUsers = sortedUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const fetchUsersWithConversations = async () => {
    try {
      showLoader({ text: 'Fetching conversations...' }); // ⏳ Show loader

      // 🚀 Request ALL users with conversations (remove limit param, see below)
      const response = await axiosInstance.get('/api/admin/liveChat/main');
      setAllUsers(response.data.users || []); // 💾 Set users for local sort/pagination

      displayMessage('User conversations loaded!', 'success'); // ✅ Success!
    } catch (error) {
      displayMessage(`Failed to fetch conversations: ${error.message}`, 'error');
    } finally {
      hideLoader();
    }
  };

  // ---------- The AutoRefresh function component ----------
  const { AutoRefresh } = useAutoRefresh(fetchUsersWithConversations, {
    intervalSeconds: 600,
    uiOptions: {
      showManualButton: true,
      showPauseToggle: true
    }
  });

  // ✅ Use useEffect to run fetch on load/when needed:
  useEffect(() => {
    if (status === 'authenticated' && isAllowed) {
      fetchUsersWithConversations();
    }
  }, [status, isAllowed]);

  // ✅ Redirect if Not Authorized And Wait Until We Know The State
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect); // ✅ Redirect safely in useEffect
    }
  }, [status, isAllowed, redirect, router]);

  // ---------- If not allowed, render nothing ----------
  if (!isAllowed) return null;

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="container-style">
        <div className="flex flex-col items-center text-center justify-center text-2xl text-wonderful-3 relative">
          <h1 className="text-wonderful-5">Users with Conversations</h1>

          <hr className="border border-gray-400 w-8/12 text-center items-center justify-center my-4" />
        </div>
        {/* 🔄 Sorting & AutoRefresh Controls (row on desktop, stacked on mobile) */}
        <div className="flex justify-center items-center w-full">
          <div className="flex flex-col w-10/12 mb-3 items-center md:flex-row md:space-x-3 md:space-y-0 space-y-10">
            {/* 🟦 SortDropdown centered in its column */}
            <div className="flex-1 flex justify-center items-center m-0">
              <SortDropdown
                options={userWithConversationsSortOptions}
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
        {/* ===================💻 Desktop: Responsive Table View (Desktop) =================== */}
        <div className="hidden xl:flex justify-center w-full">
          {/* 🖱️ Enables horizontal scroll only when table can't shrink further */}
          <div className="w-full max-w-full overflow-x-auto">
            <table className="min-w-[500px] w-full border-separate border-spacing-0 text-shadow-dark-1">
              <thead>
                <tr className="bg-gray-600">
                  <th className="border border-gray-300 px-4 py-2">User</th>
                  <th className="border border-gray-300 px-4 py-2">Email</th>
                  <th className="border border-gray-300 px-4 py-2"># Conversations</th>
                  <th className="border border-gray-300 px-4 py-2"># Unread Conv.</th>
                  <th className="border border-gray-300 px-4 py-2">Last Message</th>
                  <th className="border border-gray-300 px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody className="text-center">
                {pagedUsers.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-400">
                    <td className="border border-gray-300 px-4 py-2">{user.name || 'N/A'}</td>
                    <td className="border border-gray-300 px-4 py-2">{user.email || 'N/A'}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {user.conversationCount}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {user.unreadConvoCount > 0 ? (
                        <span className="text-green-500 font-bold">● {user.unreadConvoCount}</span>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {user.lastMessage
                        ? new Date(user.lastMessage).toLocaleString()
                        : 'No messages'}
                    </td>
                    {/* 👇 Flex for horizontal buttons, keeps things tidy */}
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="flex flex-row gap-2 no-wrap w-fit justify-center">
                        <Link href={`/admin/liveChat/user/${user.user_id}`}>
                          <button className="btn-primary">View</button>
                        </Link>
                        <ConversationActionButton
                          action="create"
                          user_id={user.user_id}
                          user={user}
                          chatType="live"
                          onActionSuccess={fetchUsersWithConversations}
                          buttonText="Start New Conversation"
                          isAdmin={true}
                        />
                        <ConversationActionButton
                          action="deleteAll"
                          user_id={user.user_id}
                          chatType="live"
                          onActionSuccess={fetchUsersWithConversations}
                          isAdmin={true}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* 📱 Card View for Mobile */}
        <div className="xl:hidden flex flex-col gap-4 w-full mt-6 no-wrap">
          {pagedUsers.map((user) => (
            <div
              key={user.user_id}
              className="border border-gray-300 rounded-2xl p-4 shadow-sm bg-gray-500 text-md"
            >
              <div className="flex justify-between mb-2">
                <h3 className="font-semibold text-lg">{user.name || 'N/A'}</h3>
                <span>E-mail: {user.email || 'N/A'}</span>
              </div>

              <div className="space-y-1">
                <p>
                  <strong># Conversations:</strong> {user.conversationCount}
                </p>
                <p>
                  <strong>Last Message:</strong>{' '}
                  {user.lastMessage ? new Date(user.lastMessage).toLocaleString() : 'No messages'}
                </p>
                <p>
                  <strong># Unread Conversations:</strong>{' '}
                  {user.unreadConvoCount > 0 ? (
                    <span className="text-green-500 font-bold">● {user.unreadConvoCount}</span>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                </p>
              </div>
              <div className="flex justify-center">
                <div className="flex sm:flex-row flex-col justify-end gap-2 mt-3 sm:w-full w-10/12">
                  <Link
                    href={`/admin/liveChat/user/${user.user_id}`}
                    className="btn-primary sm:w-3/12 flex justify-center items-center"
                  >
                    <button>View</button>
                  </Link>
                  <ConversationActionButton
                    action="create"
                    user_id={user.user_id}
                    user={user}
                    chatType="live"
                    onActionSuccess={fetchUsersWithConversations}
                    buttonText="Start New Conversation"
                    isAdmin={true}
                  />
                  <ConversationActionButton
                    action="deleteAll"
                    buttonStyle="w-10/12"
                    user_id={user.user_id}
                    chatType="live"
                    onActionSuccess={fetchUsersWithConversations}
                    isAdmin={true}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Pagination component using onPageChange to update currentPage state */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default ConversationsPage;
