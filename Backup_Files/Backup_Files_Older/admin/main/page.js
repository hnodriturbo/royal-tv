'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axiosInstance from '@lib/axiosInstance';
import Pagination from '@components/ui/pagination/Pagination';
import useAppHandlers from '@hooks/useAppHandlers';
import { useSession } from 'next-auth/react';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useRouter } from 'next/navigation';

const UsersPage = () => {
  const { data: session, status } = useSession();
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const router = useRouter();

  // Check authentication
  const { isAllowed, redirect } = useAuthGuard('admin');

  // Local state for users and pagination info
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch users from API with pagination whenever currentPage changes
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        showLoader({ text: 'Fetching users...' });
        const response = await axiosInstance.get(
          '/api/admin/dashboard/users/showAllUsers',
          {
            params: { page: currentPage, limit: 5 },
          },
        );
        setUsers(response.data.users);
        setTotalPages(response.data.totalPages);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        displayMessage('Failed to fetch users', 'error');
      } finally {
        hideLoader();
      }
    };

    fetchUsers();
  }, [currentPage, status]);

  // ✅ Handle creating a conversation with a specific user
  const handleCreateConversation = async (userId) => {
    try {
      showLoader({ text: 'Creating conversation...' });

      const response = await axiosInstance.post(
        '/api/admin/dashboard/conversations/create',
        { user_id: userId },
      );

      displayMessage('Conversation created successfully!', 'success');
      router.push(
        `/admin/dashboard/conversations/${response.data.conversation_id}`,
      );
    } catch (error) {
      displayMessage('Failed to create conversation', 'error');
    } finally {
      hideLoader();
    }
  };

  // Redirect if not allowed
  if (!isAllowed) {
    if (redirect) router.replace(redirect);
    return null;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 mt-6">
      <div className="container-style mt-6 pc:w-8/12 mobile:w-full mobile:p-2 p-6 flex-col">
        <div className="flex flex-col items-center text-center justify-center">
          <h1 className="text-2xl font-bold m-2 text-center">Manage Users</h1>

          <hr className="border border-gray-400 w-8/12 text-center items-center justify-center mb-4" />
        </div>
        {/* ✅ Responsive Scrollable Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="border-b-2 bg-gray-600">
                <th className="border border-gray-300 px-4 py-2">Username</th>
                <th className="border border-gray-300 px-4 py-2">Email</th>
                <th className="border border-gray-300 px-4 py-2">Role</th>
                <th className="border border-gray-300 px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id}>
                  <td className="border border-gray-300 px-4 py-2">
                    {user.username}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {user.email}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {user.role}
                  </td>
                  <td className="border border-gray-300 px-4 py-2 flex gap-2">
                    <Link href={`/admin/dashboard/users/${user.user_id}`}>
                      <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
                        View Details
                      </button>
                    </Link>
                    <button
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                      onClick={() => handleCreateConversation(user.user_id)}
                    >
                      Create Conversation
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

export default UsersPage;
