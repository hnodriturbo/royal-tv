'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import axiosInstance from '@lib/axiosInstance';
import useAppHandlers from '@/hooks/useAppHandlers';
import useAuthGuard from '@/hooks/useAuthGuard';
import { useRouter } from 'next/navigation';

const UserConversationDetails = () => {
  const { conversation_id } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  const { isAllowed, redirect } = useAuthGuard('user');

  const [messages, setMessages] = useState([]);
  const [replyMessage, setReplyMessage] = useState('');
  const [subject, setSubject] = useState(''); // ✅ Store subject
  const [userDetails, setUserDetails] = useState(null); // ✅ Store user info

  // ✅ Fetch Messages and Subject
  const fetchMessages = async (user_id) => {
    try {
      showLoader({ text: 'Loading messages...' });

      const { data } = await axiosInstance.get(
        `/api/user/conversations/${conversation_id}`,
        { headers: { 'User-ID': user_id } },
      );

      setMessages(data.messages);
      setSubject(data.subject); // ✅ Store subject
      setUserDetails(data.user); // ✅ Store user details
    } catch (error) {
      displayMessage('Failed to load messages', 'error');
    } finally {
      hideLoader();
    }
  };

  // ✅ Send Message
  const handleSendMessage = async () => {
    if (!replyMessage.trim()) {
      displayMessage('Please enter a message', 'error');
      return;
    }

    try {
      showLoader({ text: 'Sending message...' });

      await axiosInstance.post(
        `/api/user/conversations/${conversation_id}`, // ✅ Calls the correct API
        { message: replyMessage },
        { headers: { 'User-ID': session?.user?.user_id } }, // ✅ Ensure User-ID is sent
      );

      setReplyMessage('');
      displayMessage('Message sent!', 'success');

      // Refresh messages
      fetchMessages(session?.user?.user_id);
    } catch (error) {
      console.error('❌ Send Message Error:', error.response?.data || error);
      displayMessage('Failed to send message', 'error');
    } finally {
      hideLoader();
    }
  };

  // ✅ Fetch Messages on Load
  useEffect(() => {
    if (session?.user?.user_id) {
      fetchMessages(session.user.user_id);
      /* console.log('sender is admin: ', messages.sender_is_admin); */
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
      <div className="container-style-sm">
        <div className="text-2xl font-bold mb-2 text-center">
          Conversation Subject:
        </div>
        <div className="text-2xl font-bold mb-4 text-center text-black text-outline-light-1">
          {subject}
        </div>
        {/* ✅ Messages Container */}
        <div className="messages-container border rounded-lg p-4 mb-6 min-h-20 max-h-96 overflow-y-auto flex flex-col gap-4">
          {!messages?.length ? (
            <p className="text-center text-gray-600">No messages yet.</p>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.message_id}
                className={`p-3 rounded-lg max-w-3/4 flex flex-col ${
                  msg.sender_is_admin
                    ? 'bg-gray-700 text-white text-start self-start w-2/3' // ✅ Admin messages on the left
                    : 'bg-gray-500 text-white text-start self-end w-2/3' // ✅ User messages on the right
                }`}
              >
                {/* ✅ Message Content First */}
                <p className="text-sm">{msg.message}</p>

                {/* ✅ Sender Info and Timestamp Below Message */}
                <p className="text-xs text-white text-outline-none mt-2 self-end">
                  {msg.sender_is_admin
                    ? `Sent from Admin at ${new Date(msg.createdAt).toLocaleString()}`
                    : `Sent from ${userDetails?.username || 'User'} at ${new Date(msg.createdAt).toLocaleString()}`}
                </p>
              </div>
            ))
          )}
        </div>

        {/* ✅ Reply Section */}
        <div className="reply-section border rounded-lg p-4 mb-6 flex flex-col items-center">
          <h2 className="text-xl font-bold mb-2">Reply</h2>
          <textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            className="border p-2 w-full h-24 text-black bg-white rounded-md"
            placeholder="Type your reply here..."
          />
          <button
            className="bg-green-500 text-white px-4 py-2 mt-2 rounded hover:bg-green-600 transition"
            onClick={handleSendMessage}
          >
            Send Reply
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserConversationDetails;
