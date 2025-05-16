'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

import useAppHandlers from '@/hooks/useAppHandlers';
import useAuthGuard from '@/hooks/useAuthGuard';
import useModal from '@/hooks/useModal';
import useConversationsList from '@/components/reusableUI/useConversationsList';
import Pagination from '@/components/reusableUI/Pagination';

export default function UsersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { openModal } = useModal();
  const { isAllowed, redirect } = useAuthGuard('admin');

  // ─── useConversationsList in "main" mode (no selectedUserId)
  const {
    conversations: users, // actually our enriched user‐stats
    currentPage,
    totalPages,
    setCurrentPage
  } = useConversationsList({
    role: 'admin',
    chatType: 'live',
    initialPage: 1,
    pageSize: 5
  });

  // ➡️ Redirect if not authorised
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  if (!isAllowed) return null;

  const handleNewConversation = (recipientUserId) => {
    let subjectRef, messageRef;

    openModal('newMessage', {
      title: 'Start a New Conversation',
      description: 'Enter a subject and message:',
      customContent: () => (
        <div className="flex flex-col gap-4">
          <input
            type="text"
            ref={(el) => (subjectRef = el)}
            className="border p-2 w-full text-black bg-white rounded-lg"
            placeholder="Enter subject"
          />
          <textarea
            ref={(el) => (messageRef = el)}
            className="border p-2 w-full h-24 text-black bg-white rounded-lg"
            placeholder="Type your message here..."
          />
        </div>
      ),
      confirmButtonText: 'Send',
      cancelButtonText: 'Cancel',
      onConfirm: async () => {
        const subject = subjectRef?.value.trim();
        const messageText = messageRef?.value.trim();
        if (!subject || !messageText) {
          displayMessage('Subject and message cannot be empty', 'error');
          return;
        }
        try {
          showLoader({ text: 'Creating conversation...' });
          const { data } = await axiosInstance.post('/api/admin/createConversation', {
            subject,
            message: messageText,
            user_id: user_id
          });
          displayMessage('Conversation created successfully', 'success');
          router.push(`/admin/liveChat/${data.conversation_id}`);
        } catch (err) {
          displayMessage('Failed to create conversation', 'error');
        } finally {
          hideLoader();
        }
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="container-style">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold">Manage Users</h1>
          <hr className="border-gray-400 w-8/12 mx-auto mt-2" />
        </div>

        {/* Desktop Table */}
        <div className="overflow-x-auto w-full lg:block hidden text-lg">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-600">
                <th className="border px-4 py-2">Username</th>
                <th className="border px-4 py-2">Email</th>
                <th className="border px-4 py-2">Conversations</th>
                <th className="border px-4 py-2">Unread Threads</th>
                <th className="border px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.user_id} className="hover:bg-gray-400">
                  <td className="border px-4 py-2">{user.username}</td>
                  <td className="border px-4 py-2">{user.email}</td>
                  <td className="border px-4 py-2">{user.conversationCount}</td>
                  <td className="border px-4 py-2">{user.convoUnreadCount}</td>
                  <td className="border px-4 py-2 flex gap-2 justify-center">
                    <Link href={`/admin/users/${user.user_id}`}>
                      <button className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600">
                        View
                      </button>
                    </Link>
                    <button
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                      onClick={() => handleNewConversation(user.user_id)}
                    >
                      Create Convo
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 📱 Card View for Mobile */}
        <div className="lg:hidden flex flex-col gap-4 w-full mt-6 no-wrap">
          {users.map((user) => (
            <div key={user.user_id} className="bg-white border rounded-lg p-4 shadow-sm text-sm">
              <h3 className="font-bold text-lg">{user.username}</h3>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>Convos:</strong> {user.conversationCount}
              </p>
              <p>
                <strong>Unread:</strong> {user.convoUnreadCount}
              </p>
              <div className="flex justify-end gap-2 mt-2">
                <Link href={`/admin/users/${user.user_id}`}>
                  <button className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600">
                    View
                  </button>
                </Link>
                <button
                  className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600"
                  onClick={() => handleNewConversation(user.user_id)}
                >
                  Create Convo
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
