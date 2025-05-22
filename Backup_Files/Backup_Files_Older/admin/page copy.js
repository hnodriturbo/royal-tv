// dashboard/admin/conversations/main/page.js
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import axiosInstance from '@lib/axiosInstance';
import Pagination from '@components/ui/pagination/Pagination';
import useAppHandlers from '@hooks/useAppHandlers';
import { useSession } from 'next-auth/react';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useRouter } from 'next/navigation';

const ConversationsPage = () => {
  // Use NextAuth to get session info.
  const { data: session, status } = useSession();
  // ✅ Set up the router for redirection
  const router = useRouter();
  // Check authentication
  const { isAllowed, redirect } = useAuthGuard('admin');

  const [conversations, setConversations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Use these here instead of in the hooks of a useEffect function to stop infinite loops
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        showLoader({ text: 'Fetching conversations...' });
        const response = await axiosInstance.get(
          '/api/dashboard/admin/conversations/showAllConversations',
          {
            params: { page: currentPage, limit: 5 }
          }
        );
        setConversations(response.data.conversations);
        setTotalPages(response.data.totalPages);
      } catch (error) {
        console.error('Failed to fetch conversations:', error);
        displayMessage('Failed to fetch conversations', 'error', 3000);
      } finally {
        hideLoader();
      }
    };

    fetchConversations();
  }, [currentPage, status]);

  // ✅ Prevent rendering if user is NOT allowed (avoid UI flickering)
  if (!isAllowed) {
    console.log(`🔄 Redirecting to: ${redirect}`);
    if (redirect) {
      router.replace(redirect);
    }
    return null; // 🛑 Prevents rendering anything until redirected
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="container-style mt-6 lg:w-8/12">
        <h1 className="text-2xl font-bold mb-4 text-center">All Conversations</h1>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="border border-gray-300 px-4 py-2">User</th>
              <th className="border border-gray-300 px-4 py-2">Last Message</th>
              <th className="border border-gray-300 px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {conversations.map((conv) => (
              <tr key={conv.conversation_id}>
                <td className="border border-gray-300 px-4 py-2">{conv.user?.name || 'N/A'}</td>
                <td className="border border-gray-300 px-4 py-2">
                  {new Date(conv.updatedAt).toLocaleString()}
                </td>
                <td className="border border-gray-300 px-4 py-2">
                  <Link href={`/dashboard/admin/conversations/${conv.conversation_id}`}>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
                      View
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
