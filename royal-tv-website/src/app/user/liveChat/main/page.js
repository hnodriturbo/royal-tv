// 📁 app/user/liveChat/main/page.js
/**
 * Lists the logged‑in user’s live‑chat conversations
 * with pagination and responsive (table ↔ mobile‑card) layout.
 */

'use client';

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

import axiosInstance from '@/lib/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useModal from '@/hooks/useModal';
import useAuthGuard from '@/hooks/useAuthGuard';
import Pagination from '@/components/reusableUI/Pagination';

const UserConversations = () => {
  // 1️⃣ Auth helpers
  const { data: session, status } = useSession();
  const { isAllowed, redirect } = useAuthGuard('user');
  const router = useRouter();
  const [userId, setUserId] = useState('');
  // 2️⃣ UX helpers
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { openModal, hideModal } = useModal();

  // 3️⃣ Local state
  const [conversations, setConversations] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // 4️⃣ Refs for “new conversation” modal
  const subjectInputRef = useRef(null);
  const textAreaRef = useRef(null);

  /* ────────────────────────────────────────────────────────────────
     Fetch helper — paginated conversations
  ───────────────────────────────────────────────────────────────── */
  const fetchUserConversations = useCallback(
    async (page = 1) => {
      try {
        showLoader({ text: 'Loading your conversations…' });
        const { data } = await axiosInstance.get('/api/user/liveChat/main', {
          params: { page, limit: 5 }
        });

        setConversations(data.conversations);
        setTotalPages(data.pagination.totalPages);
        setUserId(conversations.user_id);
        // 🚀 jump when only one convo
        if (data.pagination.totalConversations === 1) {
          router.replace(`/user/liveChat/${data.conversations[0].conversation_id}`);
        }
      } catch (err) {
        console.error('❌ Fetch conversations failed:', err?.response || err);
        displayMessage('Failed to load conversations', 'error');
      } finally {
        displayMessage('conversations fetched successfully', 'success');
        hideLoader();
      }
    },
    [router, displayMessage, showLoader, hideLoader]
  );
  // ✅ Show modal to start a new conversation
  // ✅ Show modal to start a new conversation
  const handleNewConversation = () => {
    openModal('newMessage', {
      title: 'Start a New Conversation',
      description: 'Enter a subject and message:',
      customContent: () => (
        <div className="flex flex-col gap-4 rounded-lg">
          <input
            type="text"
            ref={subjectInputRef}
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
        const subject = subjectInputRef.current?.value.trim();
        const message = textAreaRef.current?.value.trim();

        if (!subject || !message) {
          displayMessage('Subject and message cannot be empty', 'error');
          return;
        }

        try {
          showLoader({ text: 'Creating conversation...' });

          const { data } = await axiosInstance.post('/api/user/createConversation', {
            subject,
            message,
            chatType: 'live'
          });

          // Display success message
          displayMessage('Conversation created successfully', 'success');

          // ✅ Correct frontend redirect with received conversation_id
          router.push(`/user/liveChat/${data.conversation_id}`);
        } catch (error) {
          displayMessage('Failed to create conversation', 'error');
        } finally {
          hideLoader();
          hideModal();
        }
      },
      onCancel: () => hideModal()
    });
  };

  // ✅ Show modal to delete a conversation
  const handleDeleteConversation = (conversation_id) => {
    openModal('deleteConversation', {
      title: 'Delete Conversation',
      description:
        'Are you sure you want to delete this whole conversation and the messages within it?',
      confirmButtonText: 'Delete',
      confirmButtonType: 'Danger',
      cancelButtonText: 'Cancel',
      onConfirm: async () => {
        try {
          showLoader({ text: 'Deleting conversation...' });

          await axiosInstance.delete('/api/user/deleteConversation', {
            data: { conversation_id, chatType: 'live' }
          });
          // Display success message
          displayMessage('Conversation Deleted Successfully', 'success');
          // Refresh the conversation list
          fetchUserConversations(currentPage);
        } catch (error) {
          displayMessage('Failed to create conversation', 'error');
        } finally {
          hideLoader();
          hideModal();
        }
      },
      onCancel: () => hideModal()
    });
  };

  // Fetch the conversations
  useEffect(() => {
    if (status !== 'authenticated' || !isAllowed) return;
    fetchUserConversations(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isAllowed, currentPage]);

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
        {/* Header + actions */}
        <h1 className="text-2xl font-bold my-2 text-center">Your Conversations</h1>
        <div className="flex flex-row items-center justify-center gap-4 my-4">
          <button
            onClick={handleNewConversation}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Start New Conversation
          </button>
          <Link href="/user/subscriptions">
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
              See My Subscriptions
            </button>
          </Link>
        </div>

        {/* 📊 Desktop table */}
        <div className="overflow-x-auto w-full lg:block hidden">
          {conversations.length === 0 ? (
            <p className="text-center">No conversations found.</p>
          ) : (
            <table className="w-full border-collapse border border-gray-300 min-w-[600px]">
              <thead>
                <tr className="bg-gray-700 text-white">
                  <th className="border border-gray-300 px-4 py-2">ID</th>
                  <th className="border border-gray-300 px-4 py-2">Subject</th>
                  <th className="border border-gray-300 px-4 py-2">Unread</th>
                  <th className="border border-gray-300 px-4 py-2">Last Message</th>
                  <th className="border border-gray-300 px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((conv) => (
                  <tr key={conv.conversation_id} className="hover:bg-gray-400 text-white">
                    <td className="border border-gray-300 px-4 py-2">{conv.conversation_id}</td>
                    <td className="border border-gray-300 px-4 py-2">{conv.subject}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      {conv.unreadCount > 0 ? (
                        <span className="bg-green-600 text-white rounded-full px-2 py-0.5">
                          {conv.unreadCount}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-2">
                      {new Date(conv.lastMessageAt).toLocaleString()}
                    </td>
                    <td className="border border-gray-300 px-4 py-2 flex gap-2">
                      <button
                        onClick={() => router.push(`/user/liveChat/${conv.conversation_id}`)}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition text-sm"
                      >
                        View
                      </button>
                      <button
                        onClick={() => handleDeleteConversation(conv.conversation_id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 📱 Card View for Mobile */}
        <div className="lg:hidden flex flex-col gap-4 w-full mt-6 no-wrap">
          {conversations.map((conv) => (
            <div
              key={conv.conversation_id}
              className="border border-gray-300 rounded-lg p-4 shadow-sm bg-gray-500 text-white"
            >
              <h3 className="font-semibold text-lg mb-2">{conv.subject}</h3>
              <p className="mb-1">
                <strong>ID:</strong> {conv.conversation_id}
              </p>
              <p className="mb-1">
                <strong>Unread:</strong>{' '}
                {conv.unreadCount > 0 ? (
                  <span className="bg-red-600 text-white rounded-full px-2 py-0.5">
                    {conv.unreadCount}
                  </span>
                ) : (
                  'None'
                )}
              </p>
              <p className="mb-3">
                <strong>Last Message:</strong> {new Date(conv.lastMessageAt).toLocaleString()}
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => router.push(`/user/liveChat/${conv.conversation_id}`)}
                  className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition text-sm"
                >
                  View
                </button>
                <button
                  onClick={() => handleDeleteConversation(conv.conversation_id)}
                  className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* 🗂️ Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default UserConversations;
