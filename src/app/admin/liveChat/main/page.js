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
        params: { page: currentPage, limit: 5 },
      });
      setTotalPages(response.data.totalPages);
      setUsers(response.data.users);
    } catch (error) {
      displayMessage(
        `Failed to fetch conversations: ${error.message}`,
        'error',
      );
    } finally {
      hideLoader();
    }
  };

  // ✅ Use Modal To Delete All Conversations From User As Admin
  const handleDeleteConversations = (user) => {
    openModal('deleteAllConversations', {
      title: `Delete All Conversations From User: ${user.name || 'Unnamed'}`,
      description:
        'Are you sure you want to delete all conversations from this user?',
      confirmButtonType: 'Danger',
      confirmButtonText: 'Delete All Convs',
      cancelButtonText: 'Cancel',

      onConfirm: async () => {
        try {
          showLoader({ text: 'Deleting all conversations from user...' });
          await axiosInstance.delete('/api/admin/deleteAllUserConversations', {
            params: {
              user_id: user.user_id,
              chatType: 'live',
            },
          });
          // Refresh the list
          fetchUsersWithConversations();
        } catch (error) {
          displayMessage(
            'Failed to delete all conversations from this user',
            'error',
          );
        } finally {
          displayMessage(
            `All conversations from user ${user.name || user.email} deleted.`,
            'success',
          );

          hideLoader();
        }
      },
      onCancel: () => hideModal(),
    });
  };

  // ✅ Fetch Conversations on Load
  useEffect(() => {
    fetchUsersWithConversations();
  }, [currentPage, status]);

  const { Countdown } = useAutoRefresh(fetchUsersWithConversations, {
    intervalSeconds: 600,
    uiOptions: {
      showManualButton: true,
      showPauseToggle: true,
    },
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
        <div className="flex flex-col items-center text-center justify-center">
          <h1 className="text-2xl font-bold m-4 text-center">
            Users with Conversations
          </h1>
          {Countdown}
          <hr className="border border-gray-400 w-8/12 text-center items-center justify-center my-4" />
        </div>
        {/* ✅ Responsive Scrollable Table */}
        <div className="overflow-x-auto w-full pc:block mobile:hidden">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="border-b-2 bg-gray-600">
                <th className="border border-gray-300 px-4 py-2">User</th>
                <th className="border border-gray-300 px-4 py-2">Email</th>
                <th className="border border-gray-300 px-4 py-2">
                  # Conversations
                </th>
                <th className="border border-gray-300 px-4 py-2">
                  # Unread Conv.
                </th>
                <th className="border border-gray-300 px-4 py-2">
                  Last Message
                </th>

                <th className="border border-gray-300 px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody className="text-center">
              {users.map((user) => (
                <tr key={user.user_id} className="hover:bg-gray-400">
                  <td className="border border-gray-300 px-4 py-2">
                    {user.name || 'N/A'}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {user.email || 'N/A'}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {user.conversationCount}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {user.unreadConvoCount > 0 ? (
                      <span className="text-green-500 font-bold">
                        ● {user.unreadConvoCount}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {user.lastMessage
                      ? new Date(user.lastMessage).toLocaleString()
                      : 'No messages'}
                  </td>

                  <td className="border border-gray-300 px-4 py-2">
                    <div className="flex flex-row gap-2 items-center justify-center no-wrap">
                      <Link href={`/admin/liveChat/user/${user.user_id}`}>
                        <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
                          View
                        </button>
                      </Link>

                      <button
                        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                        onClick={() => handleDeleteConversations(user)}
                      >
                        Delete All
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 📱 Card View for Mobile */}
        <div className="mobile:flex pc:hidden flex-col gap-4 w-full">
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
                  {user.lastMessage
                    ? new Date(user.lastMessage).toLocaleString()
                    : 'No messages'}
                </p>
                <p>
                  <strong># Unread Conversations:</strong>{' '}
                  {user.unreadConvoCount > 0 ? (
                    <span className="text-green-500 font-bold">
                      ● {user.unreadConvoCount}
                    </span>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                </p>
              </div>

              <div className="flex justify-end gap-2 mt-3">
                <Link href={`/admin/liveChat/user/${user.user_id}`}>
                  <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition text-md">
                    View
                  </button>
                </Link>
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition text-md"
                  onClick={() => handleDeleteConversations(user)}
                >
                  Delete All
                </button>
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
