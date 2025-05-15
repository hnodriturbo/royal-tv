'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axiosInstance from '@lib/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useAuthGuard from '@/hooks/useAuthGuard';
import Pagination from '@src/app/components/reusableUI/Pagination';
import useModal from '@/hooks/useModal';
import { useSession } from 'next-auth/react';

const AdminSeeUserConversations = () => {
  const { data: session, status } = useSession();
  // Get the user_id of the user from params
  const { user_id } = useParams();
  // Loaders and other security
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const router = useRouter();

  // Conversations and username
  const [conversations, setConversations] = useState([]); // ✅ Store conversations
  const [username, setUsername] = useState(''); // ✅ Store username separately
  const [user, setUser] = useState([]);
  // Pages
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal dialog import setting
  const { openModal, hideModal } = useModal();
  const inputRef = useRef(null);
  const textAreaRef = useRef(null);

  // ✅ Fetch user conversations
  const fetchUserConversations = async () => {
    try {
      showLoader({ text: 'Loading conversations...' });

      const response = await axiosInstance.get(
        `/api/admin/conversations/user/${user_id}`,
        {
          params: { page: currentPage, limit: 5 },
        },
      );

      // Set the response into convs
      const convs = response.data.conversations;
      setTotalPages(response.data.totalPages); // ✅ add this

      // ✅ Store username from API response
      if (response.data.userDetails) {
        setUsername(response.data.userDetails.name);
        setUser(response.data.userDetails);
      }

      // ✅ Extract all messages from conversations into a flat array
      const allMessages = convs.flatMap((conv) => conv.messages || []); // ✅ Handle undefined messages

      // ✅ If only one conversation, redirect directly
      if (convs.length === 1) {
        router.replace(`/admin/conversations/${convs[0].conversation_id}`);
        return;
      }

      setConversations(convs);
    } catch (error) {
      displayMessage('Failed to load user conversations', 'error');
    } finally {
      hideLoader();
    }
  };

  const handleNewConversation = (user) => {
    openModal('newMessage', {
      title: `Start a New Conversation With ${user.name}`,
      description: 'Enter a subject and message:',
      customContent: () => (
        <div className="flex flex-col gap-4 rounded-lg">
          <input
            type="text"
            ref={inputRef}
            className="border p-2 w-full text-black rounded-lg"
            placeholder="Enter subject"
          />
          <textarea
            ref={textAreaRef}
            className="border p-2 w-full h-24 text-black rounded-lg"
            placeholder="Type your message here..."
          />
        </div>
      ),
      confirmButtonText: 'Create Conversation',
      cancelButtonText: 'Cancel',
      onConfirm: async () => {
        const subject = inputRef.current?.value.trim();
        const messageText = textAreaRef.current?.value.trim();

        if (!subject || !messageText) {
          displayMessage('Subject and message cannot be empty', 'error');
          return;
        }

        try {
          showLoader({ text: 'Creating conversation...' });

          const { data } = await axiosInstance.post(
            '/api/admin/conversations/main/createConversation',
            {
              subject,
              message: messageText,
              user_id: user.user_id,
            },
            {
              headers: { 'User-ID': session?.user?.user_id || '' },
            },
          );
          // Display success message
          displayMessage('Conversation created successfully', 'success');
          // Push to the new conversation
          router.push(`/admin/conversations/${data.conversation_id}`);
        } catch (error) {
          displayMessage(
            `Failed to create conversation: ${error.message}`,
            'error',
          );
        } finally {
          hideLoader();
          hideModal();
        }
      },
      onCancel: () => hideModal(),
    });
  };

  // ✅ Fetch Conversations on Load
  useEffect(() => {
    if (user_id) {
      fetchUserConversations();
    }
  }, [user_id, currentPage]);

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
          <h1 className="text-3xl font-bold mb-4 text-center">
            Conversations with {username ? username : 'User'}
          </h1>
          <hr className="border border-gray-400 w-8/12 text-center items-center justify-center mb-4" />
          <div className="flex w-full items-center justify-center my-2">
            <button
              onClick={() => handleNewConversation({ user_id, name: username })}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
            >
              New Conversation
            </button>
          </div>
        </div>
        {/* ✅ Conversations Table */}
        <div className="overflow-x-auto w-full pc:block mobile:hidden no-wrap">
          <table className="w-full border-collapse border border-gray-600">
            <thead className="text-center">
              <tr className="bg-gray-600 border-b-2">
                <th className="border border-gray-300 px-4 py-2">
                  Conversation ID
                </th>
                <th className="border border-gray-300 px-4 py-2">Subject</th>
                <th className="border border-gray-300 px-4 py-2">
                  Last Updated
                </th>
                <th className="border border-gray-300 px-4 py-2">
                  Unread Messages
                </th>
                <th className="border border-gray-300 px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {conversations.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-gray-500">
                    No conversations found.
                  </td>
                </tr>
              ) : (
                conversations.map((conv) => {
                  return (
                    <tr
                      key={conv.conversation_id}
                      className="hover:bg-gray-400"
                    >
                      <td className="border border-gray-300 px-4 py-2">
                        {conv.conversation_id}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 max-w-[200px] truncate">
                        <span className="block truncate" title={conv.subject}>
                          {conv.subject || 'No Subject'}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {new Date(conv.updatedAt).toLocaleString()}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {conv.unreadCount > 0 ? (
                          <span className="text-green-500 font-bold">
                            ● {conv.unreadCount}
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <button
                          onClick={() =>
                            router.push(
                              `/admin/conversations/${conv.conversation_id}`,
                            )
                          }
                          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                        >
                          View Messages
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* 📱 Card View for Mobile */}
        <div className="mobile:flex pc:hidden flex-col gap-4 w-full mt-6 no-wrap">
          {conversations.map((conv) => (
            <div
              key={conv.conversation_id}
              className="border border-gray-300 rounded-lg p-4 shadow-sm bg-gray-500 text-md"
            >
              <div className="space-y-1">
                <p>
                  <strong>Conversation ID:</strong>{' '}
                  <span className="break-all">{conv.conversation_id}</span>
                </p>
                <p>
                  <strong>Subject:</strong>{' '}
                  <span title={conv.subject}>
                    {conv.subject || 'No Subject'}
                  </span>
                </p>
                <p>
                  <strong>Last Updated:</strong>{' '}
                  {new Date(conv.updatedAt).toLocaleString()}
                </p>
                <p>
                  <strong>Unread Messages:</strong>{' '}
                  {conv.unreadCount > 0 ? (
                    <span className="text-green-500 font-bold">
                      ● {conv.unreadCount}
                    </span>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                </p>
              </div>

              <button
                onClick={() =>
                  router.push(`/admin/conversations/${conv.conversation_id}`)
                }
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
              >
                View Messages
              </button>
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
};

export default AdminSeeUserConversations;
