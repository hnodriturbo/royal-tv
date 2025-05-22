'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axiosInstance from '@/lib/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import { useSession } from 'next-auth/react';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useRouter } from 'next/navigation';

const ConversationsPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  const [users, setUsers] = useState([]);

  useEffect(() => {
    const fetchUsersWithConversations = async () => {
      try {
        showLoader({ text: 'Fetching conversations...' });

        const response = await axiosInstance.get(
          '/api/dashboard/admin/conversations/showAllConversations',
        );

        setUsers(response.data.users);
      } catch (error) {
        displayMessage('Failed to fetch conversations', 'error');
      } finally {
        hideLoader();
      }
    };

    fetchUsersWithConversations();
  }, [status]);

  if (!isAllowed) {
    if (redirect) router.replace(redirect);
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 mt-6">
      <div className="container-style mt-6 pc:w-8/12 mobile:w-full mobile:p-2 p-6 flex-col">
        <div className="flex flex-col items-center text-center justify-center">
          <h1 className="text-2xl font-bold m-4 text-center">
            Users with Conversations
          </h1>
        </div>
        {/* ✅ Responsive Scrollable Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse border border-gray-300 min-w-[600px]">
            <thead>
              <tr className="border-white border-b-2">
                <th className="border border-gray-300 px-4 py-2">User</th>
                <th className="border border-gray-300 px-4 py-2">Email</th>
                <th className="border border-gray-300 px-4 py-2">
                  # Conversations
                </th>
                <th className="border border-gray-300 px-4 py-2">
                  Last Message
                </th>
                <th className="border border-gray-300 px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id} className="hover:bg-gray-50">
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
                    {user.lastMessage
                      ? new Date(user.lastMessage).toLocaleString()
                      : 'No messages'}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <Link
                      href={`/dashboard/admin/conversations/user/${user.user_id}`}
                    >
                      <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
                        View
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ConversationsPage;
