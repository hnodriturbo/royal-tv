'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import axiosInstance from '@/lib/axiosInstance';
import Link from 'next/link';
import useAppHandlers from '@/hooks/useAppHandlers';
import useAuthGuard from '@/hooks/useAuthGuard';
import Pagination from '@/components/reusableUI/Pagination';
import useModal from '@/hooks/useModal';
import { useSession } from 'next-auth/react';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import ConversationActionButton from '@/components/reusableUI/ConversationActionButton';

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

      const { data } = await axiosInstance.get(`/api/admin/liveChat/user/${user_id}`, {
        params: { page: currentPage, limit: 5 }
      });

      // Set the response into convs
      const convs = data.conversations; // The response set into convs
      setTotalPages(data.totalPages); // ✅ Set Pages

      // ✅ Store username from API response
      if (data.userDetails) {
        setUsername(data.userDetails.name);
        setUser(data.userDetails);
      }

      // ✅ Extract all messages from conversations into a flat array
      /* const allMessages = convs.flatMap((conv) => conv.messages || []); */ // ✅ Handle undefined messages

      // ✅ Only redirect if TOTAL conversations is 1, and we're on the first page!
      if (data.totalPages === 1 && convs.length === 1 && currentPage === 1) {
        router.replace(`/admin/liveChat/${convs[0].conversation_id}`);
        return;
      }
      // Set the conversations into conversations
      setConversations(convs);
    } catch (error) {
      displayMessage('Failed to load user conversations', 'error');
    } finally {
      hideLoader();
    }
  };

  // ✅ Fetch Conversations on Load
  useEffect(() => {
    if (user_id && status === 'authenticated' && isAllowed) {
      fetchUserConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user_id, currentPage]);

  // Countdown timer every 10 minutes automatic refresh
  const { Countdown } = useAutoRefresh(fetchUserConversations, {
    intervalSeconds: 600,
    uiOptions: { showManualButton: true, showPauseToggle: true }
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
          <h1 className="text-3xl font-bold mb-4 text-center">
            Conversations with {username ? username : 'User'}
          </h1>
          {Countdown}

          <hr className="border border-gray-400 w-8/12 text-center items-center justify-center my-4" />

          <div className="flex w-full items-center justify-center my-2">
            <ConversationActionButton action="create" user_id={user?.user_id} chatType="live" />
          </div>
        </div>
        {/* ✅ Conversations Table */}
        <div className="overflow-x-auto w-full lg:block hidden">
          <table className="w-full border-collapse border border-gray-600">
            <thead className="text-center">
              <tr className="bg-gray-600 border-b-2">
                <th className="border border-gray-300 px-4 py-2">Conversation ID</th>
                <th className="border border-gray-300 px-4 py-2">Subject</th>
                <th className="border border-gray-300 px-4 py-2">Last Updated</th>
                <th className="border border-gray-300 px-4 py-2">Unread Messages</th>
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
                    <tr key={conv.conversation_id} className="hover:bg-gray-400">
                      <td className="border border-gray-300 px-4 py-2">{conv.conversation_id}</td>
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
                          <span className="text-green-500 font-bold">● {conv.unreadCount}</span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex flex-row gap-2 justify-end no-wrap">
                          <button
                            className="btn-primary"
                            onClick={() => router.push(`/admin/liveChat/${conv.conversation_id}`)}
                          >
                            View Messages
                          </button>
                          <ConversationActionButton
                            action="delete"
                            user_id={user.user_id}
                            conversation_id={conv.conversation_id}
                            chatType="live"
                            onActionSuccess={fetchUserConversations}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* 📱 Card View for Mobile */}
        <div className="lg:hidden flex flex-col gap-4 w-full mt-6 no-wrap">
          {conversations.map((conv) => (
            <div
              key={conv.conversation_id}
              className="border border-gray-300 rounded-lg p-4 shadow-sm bg-gray-500 text-md"
            >
              <div className="flex justify-between mb-2">
                <h3 className="font-semibold text-lg">{user.name || 'N/A'}</h3>
                <span>E-mail: {user.email || 'N/A'}</span>
              </div>
              <div className="space-y-1">
                <p>
                  <strong>Subject:</strong>{' '}
                  <span title={conv.subject}>{conv.subject || 'No Subject'}</span>
                </p>
                <p>
                  <strong>Last Updated:</strong> {new Date(conv.updatedAt).toLocaleString()}
                </p>
                <p>
                  <strong>Unread Messages:</strong>{' '}
                  {conv.unreadCount > 0 ? (
                    <span className="text-green-500 font-bold">● {conv.unreadCount}</span>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                </p>
              </div>
              <div className="flex justify-center">
                <div className="flex sm:flex-row flex-col justify-end gap-2 mt-3 sm:w-full w-10/12">
                  <Link href={`/admin/liveChat/${conv.conversation_id}`}>
                    <button className="btn-primary w-full">View Messages</button>
                  </Link>

                  <ConversationActionButton
                    action="delete"
                    user_id={user?.user_id}
                    conversation_id={conv.conversation_id}
                    chatType="live"
                    onActionSuccess={fetchUserConversations}
                  />
                </div>
              </div>
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
