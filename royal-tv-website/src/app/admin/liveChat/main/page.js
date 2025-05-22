'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axiosInstance from '@/lib/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import { useSession } from 'next-auth/react';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/reusableUI/Pagination';
import useModal from '@/hooks/useModal';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import ConversationActionButton from '@/components/reusableUI/ConversationActionButton';

const ConversationsPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { openModal, hideModal } = useModal();

  const fetchUsersWithConversations = async () => {
    try {
      showLoader({ text: 'Fetching conversations...' });

      const response = await axiosInstance.get('/api/admin/liveChat/main', {
        params: { page: currentPage, limit: 5 }
      });
      setTotalPages(response.data.totalPages);
      setUsers(response.data.users);
    } catch (error) {
      displayMessage(`Failed to fetch conversations: ${error.message}`, 'error');
    } finally {
      hideLoader();
    }
  };

  // ✅ Fetch Conversations on Load
  useEffect(() => {
    fetchUsersWithConversations();
  }, [currentPage, status]);

  const { Countdown } = useAutoRefresh(fetchUsersWithConversations, {
    intervalSeconds: 600,
    uiOptions: {
      showManualButton: true,
      showPauseToggle: true
    }
  });

  // ✅ Redirect if Not Authorized And Wait Until We Know The State
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect); // ✅ Redirect safely in useEffect
    }
  }, [status, isAllowed, redirect, router]);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="container-style">
        <div className="flex flex-col items-center text-center justify-center text-2xl text-wonderful-3 relative">
          <h1 className="text-wonderful-5">Users with Conversations</h1>

          <hr className="border border-gray-400 w-8/12 text-center items-center justify-center my-4" />
          {Countdown}
          <hr className="border border-gray-400 w-8/12 text-center items-center justify-center my-4" />
        </div>

        {/* ✅ Responsive Scrollable Table */}
        <div className="overflow-x-auto w-full lg:block hidden">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="border-b-2 bg-gray-600">
                <th className="border border-gray-300 px-4 py-2">User</th>
                <th className="border border-gray-300 px-4 py-2">Email</th>
                <th className="border border-gray-300 px-4 py-2"># Conversations</th>
                <th className="border border-gray-300 px-4 py-2"># Unread Conv.</th>
                <th className="border border-gray-300 px-4 py-2">Last Message</th>

                <th className="border border-gray-300 px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {users.map((user) => (
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
                    {user.lastMessage ? new Date(user.lastMessage).toLocaleString() : 'No messages'}
                  </td>

                  <td className="border border-gray-300 px-4 py-2">
                    <div className="flex flex-row gap-2 items-center justify-center no-wrap">
                      <Link href={`/admin/liveChat/user/${user.user_id}`}>
                        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
                          View
                        </button>
                      </Link>
                      <ConversationActionButton
                        action="deleteAll"
                        user_id={user.user_id}
                        chatType="live"
                        onActionSuccess={fetchUsersWithConversations}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 📱 Card View for Mobile */}
        <div className="lg:hidden flex flex-col gap-4 w-full mt-6 no-wrap">
          {users.map((user) => (
            <div
              key={user.user_id}
              className="border border-gray-300 rounded-lg p-4 shadow-sm bg-gray-500 text-md"
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
                    chatType="live"
                    onActionSuccess={fetchUsersWithConversations}
                  />
                  <ConversationActionButton
                    action="deleteAll"
                    buttonStyle="w-10/12"
                    user_id={user.user_id}
                    chatType="live"
                    onActionSuccess={fetchUsersWithConversations}
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
