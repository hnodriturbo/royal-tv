'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

import useAppHandlers from '@/hooks/useAppHandlers'; // Default export
import useModal from '@/hooks/useModal';
import axiosInstance from '@lib/axiosInstance';
import { useSession } from 'next-auth/react';
import useAuthGuard from '@/hooks/useAuthGuard';

const ConversationDetailsPage = () => {
  // Use NextAuth to get session info.
  const { data: session, status } = useSession();
  // Derive authentication state and user.
  const authenticated = status === 'authenticated';
  // Get conversation_id from URL parameters.
  const { conversation_id } = useParams();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('admin');
  // Get global loader and message handlers.
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();

  // Get modal actions.
  const { openModal } = useModal();

  // Local state for conversation details.
  const [messages, setMessages] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [userConversations, setUserConversations] = useState([]);
  // State for reply message.
  const [replyMessage, setReplyMessage] = useState('');

  // (Optional) State for edited message (not used in controlled textarea).
  const [editedMessage, setEditedMessage] = useState('');

  // Ref for the uncontrolled textarea in the edit modal.
  const textAreaRef = useRef(null);
  /* 
  // Fetch conversation details.
  const fetchConversationDetails = async () => {
    try {
      showLoader({ text: 'Loading conversation...' });
      const response = await axiosInstance.get(
        `/api/dashboard/admin/conversations/${conversation_id}`,
      );
      // Sort messages so that the latest appears first.
      const sortedMessages = response.data.messages.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
      );
      setMessages(sortedMessages);
      setUserDetails(response.data.user);
    } catch (error) {
      displayMessage('Failed to fetch conversation details', 'error');
    } finally {
      hideLoader();
    }
  };
 */
  const fetchConversationDetails = async () => {
    try {
      showLoader({ text: 'Loading conversation...' });

      // Fetch the current conversation
      const response = await axiosInstance.get(
        `/api/dashboard/admin/conversations/${conversation_id}`
      );

      // Fetch all conversations for the same user
      const userConversations = await axiosInstance.get(
        `/api/dashboard/admin/conversations/user/${response.data.user.user_id}`
      );

      // Sort messages so that the latest appears first.
      const sortedMessages = response.data.messages.sort(
        (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
      );

      setMessages(sortedMessages);
      setUserDetails(response.data.user);
      setUserConversations(userConversations.data.conversations); // ✅ Store all conversations for this user
    } catch (error) {
      displayMessage('Failed to fetch conversation details', 'error');
    } finally {
      hideLoader();
    }
  };

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
          await axiosInstance.put(`/api/dashboard/admin/conversations/${conversation_id}`, {
            message_id: msg.message_id,
            message: updatedMessage
          });
          // Refresh conversation details.
          await fetchConversationDetails();
          displayMessage('Message updated successfully', 'success');
        } catch (error) {
          displayMessage('Failed to update message', 'error');
        } finally {
          hideLoader();
        }
      },
      onCancel: () => {
        // Optional cleanup.
      }
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
            `/api/dashboard/admin/conversations/${conversation_id}?message_id=${msg.message_id}`
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
      onCancel: () => {}
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
          await axiosInstance.delete(`/api/dashboard/admin/conversations/${conversation_id}`);
          displayMessage('Conversation deleted successfully', 'success');
          router.push('/dashboard/admin/conversations/main');
        } catch (error) {
          displayMessage('Failed to delete conversation', 'error');
        } finally {
          hideLoader();
        }
      },
      onCancel: () => {}
    });
  };

  // Handler to send a reply.
  const handleSendReply = async () => {
    if (!replyMessage.trim()) {
      displayMessage('Please enter a reply message', 'error');
      return;
    }
    try {
      showLoader({ text: 'Sending reply...' });
      await axiosInstance.post(`/api/dashboard/admin/conversations/${conversation_id}`, {
        message: replyMessage,
        sender_is_admin: true // Adjust as needed.
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

  // Fetch conversation details when conversation_id or session changes
  useEffect(() => {
    fetchConversationDetails();
  }, [conversation_id, session]);

  if (!isAllowed) {
    if (redirect) router.replace(redirect);
    return null;
  }
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 mt-6">
      <div className="container-style mt-6 lg:w-10/12 lg:p-6 w-11/12 p-2 flex-col">
        {/* Wrap both details in a flex container */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* User Details Container */}
          {userDetails && (
            <div className="container-style lg:w-1/2 w-full p-4 border rounded-lg">
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
          )}

          {/* Admin Details Container */}
          <div className="container-style mobile:w-full pc:w-1/2 p-4 border rounded-lg">
            <h2 className="text-xl font-bold mb-2">Admin Details</h2>
            <p>
              <strong>Name:</strong> {session?.user?.name || 'N/A'}
            </p>
            <p>
              <strong>Role:</strong> {session?.user?.role || 'N/A'}
            </p>
            <p>
              <strong>ID:</strong> {session?.user?.user_id || 'N/A'}
            </p>
          </div>
        </div>
        {/* Messaging Center */}
        {/* Show conversation switch buttons if user has multiple conversations */}
        {userConversations.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {userConversations.map((conv) => (
              <button
                key={conv.conversation_id}
                onClick={() =>
                  router.push(`/dashboard/admin/conversations/${conv.conversation_id}`)
                }
                className={`px-4 py-2 rounded-lg text-white ${
                  conv.conversation_id === conversation_id
                    ? 'bg-blue-600'
                    : 'bg-gray-400 hover:bg-gray-500'
                }`}
              >
                Conversation {conv.conversation_id}
              </button>
            ))}
          </div>
        )}

        {/*         <h1 className="text-3xl font-bold mb-4 text-center mt-5 text-outline-glow-dark-1">
          Conversation
        </h1> */}
        <div className="messages-container border rounded-lg p-4 mb-6 h-96 overflow-y-auto">
          {messages.map((msg) => (
            <div
              key={msg.message_id}
              className={`p-4 my-4 rounded-lg shadow-md ${
                msg.sender_is_admin ? 'bg-blue-100 text-blue-900' : 'bg-gray-100 text-gray-900'
              }`}
            >
              <div className="mb-2">
                <p>{msg.message}</p>
              </div>
              <div className="flex justify-between">
                <button
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                  onClick={() => handleEditMessage(msg)}
                >
                  Edit
                </button>
                <button
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                  onClick={() => handleDeleteMessage(msg)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Reply Section */}
        <div className="reply-section border rounded-lg p-4 mb-6">
          <h2 className="text-xl font-bold mb-2">Reply</h2>
          <textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            className="border p-2 w-full h-24 text-black bg-white"
            placeholder="Type your reply here..."
          />
          <button
            className="bg-green-500 text-white px-4 py-2 mt-2 rounded hover:bg-green-600 transition"
            onClick={handleSendReply}
          >
            Send Reply
          </button>
        </div>

        {/* Danger Zone Section */}
        <div className="p-6 border border-red-500 rounded-lg bg-red-50">
          <h2 className="text-xl font-bold text-red-600 mb-4">Danger Zone</h2>
          <p className="mb-4 text-black font-bold-italic">
            Deleting the conversation will remove all messages permanently. This action cannot be
            undone.
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
