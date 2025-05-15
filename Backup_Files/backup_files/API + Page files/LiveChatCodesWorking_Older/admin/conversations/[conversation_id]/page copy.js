// 🧠 admin/liveChat/[conversation_id]/page.js
// ✅ Real‑time admin chat page with live updates, read receipts, edit/delete,
'use client';
// React imports
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// Hooks and axios
import useAuthGuard from '@/hooks/useAuthGuard';
import useAppHandlers from '@/hooks/useAppHandlers';
import useModal from '@/hooks/useModal';
import axiosInstance from '@lib/axiosInstance';

// Imports from sockets
import useSocket from '@/hooks/socket/useSocket';
import useSendMessage from '@/hooks/socket/useSendMessage';
import useReceiveMessage from '@/hooks/socket/useReceiveMessage';
import useTypingIndicator from '@/hooks/socket/useTypingIndicator';
import useJoinRoom from '@/hooks/socket/useJoinRoom';
import useEditMessage from '@/hooks/socket/useEditMessage';
import useDeleteMessage from '@/hooks/socket/useDeleteMessage';
import useMarkMessagesRead from '@/hooks/socket/useMarkMessagesRead';
import useOnlineUsers from '@/hooks/socket/useOnlineUsers';
import useRoomUsers from '@/hooks/socket/useRoomUsers';

// ✅ Admin Conversation Details Page
const ConversationDetailsPage = () => {
  // Use NextAuth to get session info.
  const { data: session, status } = useSession();
  // Get conversation_id from URL parameters.
  const { conversation_id } = useParams();
  // Guards
  const { isAllowed, redirect } = useAuthGuard('admin');
  const router = useRouter();
  // Get global loader and message handlers.
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  // Get modal actions.
  const { openModal, hideModal } = useModal();

  // Local state for conversation details.
  const [currentSubject, setCurrentSubject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [userConversations, setUserConversations] = useState([]);

  // State for reply message.
  const [replyMessage, setReplyMessage] = useState('');
  // (Optional) State for edited message (not used in controlled textarea).
  const [editedMessage, setEditedMessage] = useState('');

  // Ref for the uncontrolled textarea in the edit modal.
  const textAreaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // 1️⃣ Initialize socket-related states
  const { emit, listen } = useSocket();

  const sendMessage = useSendMessage();
  const editMessage = useEditMessage();
  const deleteMessage = useDeleteMessage();
  const markMessagesRead = useMarkMessagesRead();
  const { startTyping, subscribeTypingIndicator } =
    useTypingIndicator(conversation_id);

  const [othersTyping, setOthersTyping] = useState({});

  // 1️⃣ Scroll to bottom function for messages container
  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  // 2️⃣ Fetch Conversation Details From Admin Side
  const fetchConversationDetails = async () => {
    try {
      showLoader({ text: 'Loading conversation...' });

      const response = await axiosInstance.get(
        `/api/admin/conversations/${conversation_id}`,
      );

      const userConversations = await axiosInstance.get(
        `/api/admin/conversations/user/${response.data.user.user_id}`,
      );

      const sortedMessages = response.data.messages.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      );

      setMessages(sortedMessages);
      setUserDetails(response.data.user);
      setUserConversations(userConversations.data.conversations || []);
      setCurrentSubject(response.data.subject);

      // ✅ Single optimized PATCH request:
      await axiosInstance.patch(`/api/admin/conversations/${conversation_id}`);
    } catch (error) {
      displayMessage('Failed to fetch conversation details', 'error');
    } finally {
      hideLoader();
    }
  };

  // 3️⃣ Handler to send a reply.
  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      displayMessage('Please enter a reply message', 'error');
      return;
    }
    try {
      showLoader({ text: 'Sending reply...' });
      await axiosInstance.post(`/api/admin/conversations/${conversation_id}`, {
        message: replyMessage,
        sender_is_admin: true, // Adjust as needed.
      });
      setReplyMessage('');
      // Refresh conversation details.
      await fetchConversationDetails();
      displayMessage('Reply sent successfully', 'success');
    } catch (error) {
      displayMessage('Failed to send reply', 'error');
    } finally {
      hideLoader();
    }
  };

  // 4️⃣ Modal Handlers - Edit Message - Delete Message - Delete Conversation

  // Handler to edit a message.
  const handleEditMessage = async (msg) => {
    // Set initial edited message (optional).
    setEditedMessage(msg.message);
    openModal('editMessage', {
      title: 'Edit Message',
      description: 'Update your message below:',
      // Use an uncontrolled textarea with defaultValue and a ref.
      customContent: () => (
        <textarea
          defaultValue={msg.message}
          ref={textAreaRef}
          className="border p-2 w-full h-24 text-black bg-white"
          placeholder="Edit your message here..."
        />
      ),
      confirmButtonText: 'Save',
      cancelButtonText: 'Cancel',
      onConfirm: async () => {
        // Read updated value from the ref.
        const updatedMessage = textAreaRef.current.value;
        try {
          showLoader({ text: 'Saving message...' });
          await axiosInstance.put(
            `/api/admin/conversations/${conversation_id}`,
            {
              message_id: msg.message_id,
              message: updatedMessage,
            },
          );
          // Refresh conversation details.
          await fetchConversationDetails();
          displayMessage('Message updated successfully', 'success');
        } catch (error) {
          displayMessage('Failed to update message', 'error');
        } finally {
          hideLoader();
        }
      },
      onCancel: () => hideModal(),
    });
  };

  // Handler to delete a single message.
  const handleDeleteMessage = async (msg) => {
    openModal('confirmDelete', {
      title: 'Delete Message',
      description: 'Are you sure you want to delete this message?',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
      onConfirm: async () => {
        try {
          showLoader({ text: 'Deleting message...' });
          await axiosInstance.delete(
            `/api/admin/conversations/${conversation_id}?message_id=${msg.message_id}`,
          );
          // Re-fetch conversation details.
          await fetchConversationDetails();
          displayMessage('Message deleted successfully', 'success');
        } catch (error) {
          displayMessage('Failed to delete message', 'error');
        } finally {
          hideLoader();
        }
      },
      onCancel: () => hideModal(),
    });
  };

  // Handler to delete the entire conversation.
  const handleDeleteConversation = async () => {
    openModal('confirmDelete', {
      title: 'Delete Conversation',
      description:
        'This action will permanently delete the entire conversation and all its messages. Are you sure?',
      confirmButtonText: 'Delete Conversation',
      cancelButtonText: 'Cancel',
      onConfirm: async () => {
        try {
          showLoader({ text: 'Deleting conversation...' });
          await axiosInstance.delete(
            `/api/admin/conversations/${conversation_id}`,
          );
          displayMessage('Conversation deleted successfully', 'success');
          router.push('/admin/conversations/main');
        } catch (error) {
          displayMessage('Failed to delete conversation', 'error');
        } finally {
          hideLoader();
        }
      },
      onCancel: () => hideModal(),
    });
  };

  // Fetch conversation details when conversation_id or session changes
  useEffect(() => {
    fetchConversationDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation_id, session, isAllowed]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // ✅ Explicitly scrolls down whenever messages change

  // ✅ Redirect if Not Authorized And Wait Until We Know The State
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect) {
      router.replace(redirect); // ✅ Redirect safely in useEffect
    }
  }, [status, isAllowed, redirect, router]);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="container-style">
        {/* ✅ Centered User Details Container */}
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
        {/* Messaging Center */}
        {/* ✅ Show conversation switch buttons in a scrollable row */}
        {userConversations.length > 1 && (
          <div className="flex flex-col items-center">
            <div className="container-style mt-5 w-10/12 mobile:w-full">
              <h1 className="text-xl font-bold mt-2 text-center">
                Conversations List:
              </h1>
              <div className="overflow-x-auto mb-2 mx-4">
                <div className="flex flex-row justify-start items-center gap-3 p-2 whitespace-nowrap">
                  {userConversations
                    .sort(
                      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
                    ) // ✅ Sort latest first
                    .map((conv) => (
                      <button
                        key={conv.conversation_id}
                        onClick={() =>
                          // Using replace: doesn't add a new history entry
                          router.replace(
                            `/admin/conversations/${conv.conversation_id}`,
                            undefined,
                            { shallow: true },
                          )
                        }
                        className={`px-6 py-3 rounded-lg text-white text-center ${
                          conv.conversation_id === conversation_id
                            ? 'bg-blue-600'
                            : 'bg-smooth-gradient'
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-white font-semibold">
                            <strong>Conversation:</strong>{' '}
                            {conv.subject || 'No Subject'}
                          </span>
                          <span className="text-gray-200 text-sm">
                            ({new Date(conv.updatedAt).toLocaleDateString()})
                          </span>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Messages Container */}
        {/* ✅ Messages Container with Fixed Background */}
        <div className="flex flex-col items-center">
          <div className="container-style border p-2 my-5 relative min-h-20 max-h-[600px] flex flex-col w-10/12 mobile:w-full">
            <h1 className="text-2xl font-bold my-2 text-center">
              Conversation: <br /> {currentSubject || 'Loading conversation...'}
            </h1>
            <div className="flex flex-col items-center">
              <hr className="border border-gray-400 w-8/12 text-center items-center justify-center mb-4" />
            </div>
            <div
              className="overflow-y-auto flex flex-col gap-4 h-full"
              ref={messagesContainerRef}
            >
              {!messages?.length ? (
                <p className="text-center text-gray-400">No messages yet.</p>
              ) : (
                messages
                  .filter((msg) => msg.status !== 'deleted') // ✅ Filter out deleted messages
                  .map((msg) => (
                    <div
                      key={msg.message_id}
                      className={`p-3 rounded-lg max-w-3/4 flex justify-between items-center relative ${
                        msg.sender_is_admin
                          ? 'bg-gray-700 text-white self-start w-2/3'
                          : 'bg-gray-500 text-white self-end w-2/3'
                      }`}
                    >
                      <div>
                        <p className="text-sm">{msg.message}</p>
                        <p className="text-xs text-gray-400 mt-1 text-right">
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </p>

                        {/* ✅ New message indicator */}
                        {!msg.readAt && !msg.sender_is_admin && (
                          <span className="text-green-500 font-bold text-md">
                            ● New Message
                          </span>
                        )}

                        {/* ✅ Edited status clearly indicated */}
                        {msg.status === 'edited' && (
                          <span className="text-yellow-300 font-semibold">
                            (edited)
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button onClick={() => handleEditMessage(msg)}>
                          ✏️
                        </button>
                        <button onClick={() => handleDeleteMessage(msg)}>
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* Reply Section */}
        <div className="flex flex-col items-center">
          <div className="container-style border p-4 mb-6">
            <h2 className="text-2xl font-bold mb-2 text-center">Reply</h2>
            <textarea
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              className="border p-2 w-full h-24 text-black bg-white"
              placeholder="Type your reply here..."
            />
            <div className="flex flex-col items-center">
              <button
                className="bg-green-500 text-white px-4 py-2 mt-2 rounded hover:bg-green-600 transition w-1/4"
                onClick={handleSendReply}
              >
                Send Reply
              </button>
            </div>
          </div>
        </div>
        {/* Danger Zone Section */}
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
};

export default ConversationDetailsPage;
