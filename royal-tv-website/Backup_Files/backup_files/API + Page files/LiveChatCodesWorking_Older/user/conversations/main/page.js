'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axiosInstance from '@lib/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useModal from '@/hooks/useModal';
import useAuthGuard from '@/hooks/useAuthGuard';

const UserConversations = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { openModal, hideModal } = useModal();
  const { isAllowed, redirect } = useAuthGuard('user');

  const [conversations, setConversations] = useState([]);

  const textAreaRef = useRef(null);
  const inputRef = useRef(null);

  // ✅ Fetch the user's conversations
  const fetchUserConversations = async (user_id) => {
    if (!user_id) {
      console.error('❌ User ID is missing - API request skipped.');
      return;
    }

    try {
      showLoader({ text: 'Loading your conversations...' });

      const { data } = await axiosInstance.get('/api/user/conversations/main', {
        headers: { 'User-ID': user_id },
      });

      console.log('✅ Fetched conversations:', data);
      setConversations(data.conversations);
    } catch (error) {
      console.error(
        '❌ Axios Error:',
        error.response ? error.response.data : error,
      );
      displayMessage('Failed to load conversations', 'error');
    } finally {
      hideLoader();
    }
  };

  // ✅ Show modal to start a new conversation
  const handleNewConversation = () => {
    openModal('newMessage', {
      title: 'Start a New Conversation',
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
      confirmButtonText: 'Send',
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
            '/api/user/conversations/main',
            { subject, message: messageText },
            {
              headers: { 'User-ID': session?.user?.user_id || '' },
            },
          );
          // Display success message
          displayMessage('Conversation created successfully', 'success');
          // Push to the new conversation
          router.push(`/user/conversations/${data.conversation_id}`);
        } catch (error) {
          displayMessage('Failed to create conversation', 'error');
        } finally {
          hideLoader();
          hideModal();
        }
      },
      onCancel: () => hideModal(),
    });
  };

  // ✅ Fetch conversations on page load
  useEffect(() => {
    if (session?.user?.user_id) {
      fetchUserConversations(session.user.user_id);
    }
  }, [session]);

  // ✅ Redirect if Not Authorized
  useEffect(() => {
    if (!isAllowed && redirect) {
      router.replace(redirect); // ✅ Redirect safely in useEffect
    }
  }, [isAllowed, redirect, router]);

  // 🛡️ Don't render anything if access is not allowed
  if (!isAllowed) return null;
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="container-style">
        <h1 className="text-2xl font-bold my-2 text-center">
          Your Conversations
        </h1>
        <div className="flex flex-col items-center my-3">
          <hr className="border border-white w-8/12 text-center items-center justify-center" />
        </div>
        {/* ✅ Button to Start New Conversation */}
        <div className="mb-6 flex flex-row items-center justify-center gap-4 text-center w-full">
          <button
            onClick={handleNewConversation}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Start New Conversation
          </button>
          <button
            onClick={handleNewConversation}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            See My Subscriptions
          </button>
        </div>

        {/* ✅ Conversation List Table */}
        <div className="w-full border rounded-lg p-4 overflow-x-auto">
          {conversations.length === 0 ? (
            <p className="text-center">No conversations found.</p>
          ) : (
            <table className="w-full border-collapse border border-gray-300 min-w-[600px]">
              <thead>
                <tr className="bg-gray-700 text-white">
                  <th className="border border-gray-300 px-4 py-2">ID</th>
                  <th className="border border-gray-300 px-4 py-2">Subject</th>
                  <th className="border border-gray-300 px-4 py-2">
                    Last Updated
                  </th>
                  <th className="border border-gray-300 px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((conv) => (
                  <tr
                    key={conv.conversation_id}
                    className="hover:bg-gray-400 text-white"
                  >
                    <td className="border border-gray-300 px-4 py-2">
                      {conv.conversation_id}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {conv.subject}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {new Date(conv.updatedAt).toLocaleString()}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      <button
                        onClick={() =>
                          router.push(
                            `/user/conversations/${conv.conversation_id}`,
                          )
                        }
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserConversations;
