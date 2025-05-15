// 📄 src/app/admin/liveChat/[conversation_id]/page.js
/**
 * ConversationDetailsPage
 * -----------------------------------------------------------
 * Admin view of a single Live-Chat conversation:
 *   • Realtime messages, typing, room participants (Socket.IO)
 *   • Delete entire conversation (Danger-zone)
 *   • Sidebar switch to other conversations of the same user
 *
 * Hooks in play:
 *   • useChatRoom          → join room, markRead, roomUsers
 *   • useConversationsList → fetch other convos by the same user
 */

'use client';

// 1️⃣ Imports
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import axiosInstance from '@/lib/axiosInstance';

import useAuthGuard from '@/hooks/useAuthGuard';
import { useChatRoom } from '@/hooks/socket/useChatRoom';
import useConversationsList from '@/components/reusableUI/useConversationsList';
import useAppHandlers from '@/hooks/useAppHandlers';
import useModal from '@/hooks/useModal';
import ChatRoom from '@/components/reusableUI/socket/ChatRoom';
import useSocketHub from '@/hooks/socket/useSocketHub';

// 2️⃣ Component
function AdminConversationDetailsPage() {
  // 3️⃣ URL & auth
  const { conversation_id } = useParams();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('admin');
  const { data: session, status } = useSession();

  // 4️⃣ UI helpers
  const { showLoader, hideLoader, displayMessage } = useAppHandlers();

  // 5️⃣ Local state
  const [userDetails, setUserDetails] = useState(null);
  const [subject, setSubject] = useState('');
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Modal settings
  const { openModal, hideModal } = useModal();

  // 6️⃣ Socket / chat-room (only for roomUsers / markRead)
  const { users: roomUsers, join } = useChatRoom(conversation_id, {
    type: 'live',
  });
  /*
    const {
      users: roomUsers,
      join,
      send,
      messages,
      startTyping,
      subscribeTypingIndicator,
    } = useChatRoom(conversation_id, { type: 'live' });
*/
  // ─ Join the socket room ─
  useEffect(() => {
    join();
  }, [join]);
  // --------------------------------------------------------//
  // --------------------------------------------------------//

  // ──────────────────────────────────────────────────────────
  // Fetch conversation meta (subject & user) once
  // ──────────────────────────────────────────────────────────
  // 🔎 Function to fetch conversation metadata and user info
  async function fetchConversationDetails() {
    showLoader({ text: 'Loading conversation…' }); // 1️⃣ Show loader
    try {
      const { data } = await axiosInstance.get(
        `/api/admin/liveChat/${conversation_id}`, // 2️⃣ REST endpoint
      );

      setSubject(data.subject || ''); // 3️⃣ Update subject
      setUserDetails(data.user || null); // 4️⃣ Update user details
      setSelectedUserId(data.user?.user_id || null); // 5️⃣ Store userId
    } catch (err) {
      displayMessage('Failed to load conversation info', 'error'); // ❌ Error
    } finally {
      hideLoader(); // ✅ Hide loader
    }
  }

  // ──────────────────────────────────────────────────────────
  // Join socket room & scroll on every new message
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    join(); // join once per convId
    console.log('join was used');
  }, [conversation_id, join]);
  // 💡 Destructure useSocketHub with an alias

  // ──────────────────────────────────────────────────────────
  // Delete entire conversation via REST
  // ──────────────────────────────────────────────────────────
  const handleDeleteConversation = async () => {
    openModal('DeleteConversation', {
      title: 'Delete whole conversation',
      description: 'Are you sure you want to delete all this conversation?',
      confirmButtonText: 'Delete Conversation',
      cancelButtonText: 'Cancel',
      onConfirm: async () => {
        try {
          showLoader({ text: 'Deleting Conversation...' });
          const { deleted } = await axiosInstance.delete(
            '/api/admin/deleteConversation',
            {
              params: {
                userId: selectedUserId,
                chatType: 'liveChat',
              },
            },
          );
          displayMessage('Conversation deleted successfully!', 'success');
          // ✅ Redirect back
          router.replace(`/admin/conversations/main`);
        } catch (error) {
          displayMessage('Failed to delete conversation');
        } finally {
          hideLoader();
          hideModal();
        }
      },
    });
  };
  // 2️⃣ Fetch up to 50 conversations for that user
  const { conversations: otherConvos } = useConversationsList({
    role: 'admin',
    selectedUserId, // pass the userId you got from useParams()
    chatType: 'liveChat',
    pageSize: 50,
  });
  // ──────────────────────────────────────────────────────────<
  // Effect: run fetchConversationDetails when conversation_id changes
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchConversationDetails(); // 🔄 Trigger the fetch
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation_id]); // 🔑 Only re-run when ID changes
  // ──────────────────────────────────────────────────────────
  // Auth guard redirect
  // ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect);
    }
  }, [status, isAllowed, redirect, router]);

  if (!isAllowed) return null;

  // ✅ HTML Starts Below
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="container-style">
        {/* 🧑‍💻 User Details */}
        {userDetails && (
          <div className="flex flex-col pc:flex-row gap-4">
            <div className="flex justify-center w-full">
              <div className="container-style w-2/3 mobile:w-full p-4 border text-center">
                <h2 className="text-xl font-bold mb-2">User Details</h2>
                <p>
                  <strong>Name:</strong> {userDetails.name || 'N/A'}
                </p>
                <p>
                  <strong>Email:</strong> {userDetails.email || 'N/A'}
                </p>
                <p>
                  <strong>Username:</strong> {userDetails.username || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 🧑‍🤝‍🧑 Room Users */}
        <div className="flex flex-col items-center">
          <div className="container-style mt-5 w-10/12 mobile:w-full">
            <h2 className="text-lg font-bold text-center mb-2">
              👥 Users in This Conversation
            </h2>
            <div className="border p-4">
              <h3 className="font-semibold mb-2">Active in Room</h3>
              <div className="flex flex-wrap gap-2">
                {roomUsers.map((u) => (
                  <span key={u.user_id} className="bg-green-400 px-2 rounded">
                    {u.name} ({u.role})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 🧾 Conversation Switch */}
        {otherConvos.length > 1 && (
          <div className="flex flex-col items-center">
            <div className="container-style mt-5 w-10/12 mobile:w-full">
              <h1 className="text-xl font-bold mt-2 text-center">
                Conversations List:
              </h1>
              <div className="overflow-x-auto whitespace-nowrap px-4 py-2">
                <div className="flex flex-row justify-start items-center gap-3">
                  {otherConvos.map((conv) => (
                    <button
                      key={conv.conversation_id} // now exists
                      onClick={() =>
                        router.replace(
                          `/admin/liveChat/${conv.conversation_id}`,
                          undefined,
                          { shallow: true },
                        )
                      }
                      className={`inline-block px-4 py-2 mx-1 rounded ${
                        conv.conversation_id === conversation_id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-300 text-gray-800'
                      }`}
                    >
                      {conv.subject || 'No Subject'}
                      <span className="block text-xs text-gray-500">
                        ({new Date(conv.updatedAt).toLocaleDateString()})
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 💬 ChatRoom (replaces old message / reply boxes) */}
        <div className="flex items-center justify-center">
          <ChatRoom
            conversation_id={conversation_id}
            type="live"
            className="my-5 h-[600px] w-10/12 mobile:w-full"
          />
        </div>
        {/* ❌ Danger Zone */}
        <div className="p-6 border border-red-500 rounded-lg bg-red-400 text-center">
          <h2 className="text-3xl font-bold mb-4 text-red-700">Danger Zone</h2>
          <p className="mb-4 font-bold-italic text-red-200">
            Deleting the conversation will remove all messages permanently. This
            action cannot be undone.
          </p>
          <button
            className="bg-red-700 text-white px-6 py-3 rounded hover:bg-red-800 transition"
            onClick={handleDeleteConversation}
          >
            Delete Conversation
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdminConversationDetailsPage;
