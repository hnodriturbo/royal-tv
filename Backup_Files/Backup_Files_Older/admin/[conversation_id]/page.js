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

  const fetchConversationDetails = async () => {
    try {
      showLoader({ text: 'Loading conversation...' });

      // Fetch the current conversation
      const response = await axiosInstance.get(
        `/api/admin/dashboard/conversations/${conversation_id}`
      );

      // Fetch all conversations for the same user
      const userConversations = await axiosInstance.get(
        `/api/admin/dashboard/conversations/user/${response.data.user.user_id}`
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
          await axiosInstance.put(`/api/admin/dashboard/conversations/${conversation_id}`, {
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
            `/api/admin/dashboard/conversations/${conversation_id}?message_id=${msg.message_id}`
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
          await axiosInstance.delete(`/api/admin/dashboard/conversations/${conversation_id}`);
          displayMessage('Conversation deleted successfully', 'success');
          router.push('/admin/dashboard/conversations/main');
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
      await axiosInstance.post(`/api/admin/dashboard/conversations/${conversation_id}`, {
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
      <div className="container-style mt-6 lg:w-8/12 lg:p-6 w-full p-2 flex-col">
        {/* Wrap both details in a flex container */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* ✅ Centered User Details Container */}
          {userDetails && (
            <div className="flex justify-center w-full">
              <div className="container-style lg:w-2/3 w-full p-4 border text-center">
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
          )}
        </div>
        {/* Messaging Center */}
        {/* ✅ Show conversation switch buttons in a scrollable row */}
        {userConversations.length > 1 && (
          <div className="w-full overflow-x-auto scrollbar-hide">
            <div className="flex flex-row justify-start items-center gap-3 p-2 whitespace-nowrap">
              {userConversations
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)) // ✅ Sort latest first
                .map((conv) => (
                  <button
                    key={conv.conversation_id}
                    onClick={() =>
                      // Using replace: doesn't add a new history entry
                      router.replace(
                        `/admin/dashboard/conversations/${conv.conversation_id}`,
                        undefined,
                        { shallow: true }
                      )
                    }
                    className={`px-6 py-3 rounded-lg text-white text-center bg-smooth-gradient ${
                      conv.conversation_id === conversation_id ? 'bg-blue-600' : 'hover:bg-gray-500'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <span className="text-white font-semibold">
                        <strong>Conversation:</strong>{' '}
                        {conv.messages.length > 0 && conv.messages[0]?.subject
                          ? conv.messages[0].subject
                          : 'No Subject'}
                      </span>
                      <span className="text-gray-200 text-sm">
                        ({new Date(conv.updatedAt).toLocaleDateString()})
                      </span>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/*         <h1 className="text-3xl font-bold mb-4 text-center mt-5 text-outline-glow-dark-1">
          Conversation
        </h1> */}
        {/* ✅ Messages Container */}
        {/* ✅ Messages Container with Fixed Background */}
        <div className="container-style border p-4 my-6 relative min-h-20 max-h-96 flex flex-col">
          {/* ✅ Scrollable Messages List */}
          <div className="overflow-y-auto flex flex-col gap-4 h-full">
            {!messages?.length ? (
              <p className="text-center text-gray-400">No messages yet.</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.message_id}
                  className={`p-3 rounded-lg max-w-3/4 flex justify-between items-center ${
                    msg.sender_is_admin
                      ? 'bg-gray-700 text-white self-start w-2/3' // ✅ Admin messages on the left
                      : 'bg-gray-500 text-white self-end w-2/3' // ✅ User messages on the right
                  }`}
                >
                  <div>
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs text-gray-400 mt-1 text-right">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                  {/* ✅ Admin can edit/delete all messages (User & Admin) */}
                  <div className="flex gap-2">
                    <button onClick={() => handleEditMessage(msg)}>✏️</button>
                    <button onClick={() => handleDeleteMessage(msg)}>🗑️</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Reply Section */}
        <div className="reply-section border rounded-lg p-4 mb-6">
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

        {/* Danger Zone Section */}
        <div className="p-6 border border-red-500 rounded-lg bg-red-400 text-center">
          <h2 className="text-3xl font-bold mb-4 text-red-700">Danger Zone</h2>
          <p className="mb-4 font-bold-italic text-red-200">
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
