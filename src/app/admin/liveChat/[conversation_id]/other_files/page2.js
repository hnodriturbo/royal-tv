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
import axiosInstance from '@/lib/axiosInstance';

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

const AdminLiveChatConversation = () => {
  // Auth & routing helpers
  const { data: session, status } = useSession();
  const { conversation_id } = useParams();
  const router = useRouter();
  const { isAllowed, redirect } = useAuthGuard('admin');
  // Get global loader and message handlers.
  const { displayMessage, showLoader, hideLoader } = useAppHandlers();
  // Get modal actions.
  const { openModal, hideModal } = useModal();

  // Socket helpers
  const { emit, listen } = useSocket();
  const { startTyping, subscribe } = useTypingIndicator(conversation_id);

  const [messages, setMessages] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [userConvos, setUserConvos] = useState([]);
  const [subject, setSubject] = useState('');
  const [seenIds, setSeenIds] = useState([]);
  const [othersTyping, setOthersTyping] = useState({});
  // Get modal actions.

  /* ─────────────────────────────
   *  4. Refs for auto‑scrolling
   * ──────────────────────────── */
  const textAreaRef = useRef(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  /* 🔽 scroll to bottom whenever needed */
  const scrollToBottom = () => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  };

  /* ─────────────────────────────
   *  5. Fetch conversation + list
   * ──────────────────────────── */
  const fetchConversationAndList = async () => {
    try {
      showLoader({ text: 'Loading conversation…' });

      /* 5‑a. Conversation details */
      const { data } = await axiosInstance.get(
        `/api/admin/liveChat/${conversation_id}`,
      );
      const sorted = data.messages.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      );

      setMessages(sorted);
      setUserDetails(data.user);
      setSubject(data.subject);
      setSeenIds(sorted.map((m) => m.message_id));

      /* 5‑b. All conversations for this user */
      const list = await axiosInstance.get(
        `/api/admin/liveChat/user/${data.user.user_id}`,
      );
      setUserConvos(list.data.conversations || []);

      /* 5‑c. Mark everything read */
      emit('mark_read', { conversation_id });
    } catch (err) {
      displayMessage('Failed to load conversation', 'error');
    } finally {
      hideLoader();
    }
  };

  /* ─────────────────────────────
   *  6. Edit / delete / send
   * ──────────────────────────── */
  const handleSendMessage = () => {
    if (!replyMessage.trim()) return;
    emit('send_message', { conversation_id, message: replyMessage });
    setReplyMessage('');
  };

  const handleInput = (e) => {
    setReplyMessage(e.target.value);
    startTyping(); // 🆕 helper handles emit + debounce
  };

  /* ─────────────────────────────
   *  7. Typing indicator subscr.
   * ──────────────────────────── */
  useEffect(() => subscribe(setOthersTyping), [subscribe]);

  /* ─────────────────────────────
   *  8. Socket listeners (messages etc.)
   * ──────────────────────────── */
  useEffect(() => {
    emit('join_room', conversation_id); // join room once
    fetchConversationAndList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation_id]);

  /* auto‑scroll on new messages */
  useEffect(scrollToBottom, [messages]);

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
          await axiosInstance.put(`/api/admin/liveChat/${conversation_id}`, {
            message_id: msg.message_id,
            message: updatedMessage,
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
            `/api/admin/liveChat/${conversation_id}?message_id=${msg.message_id}`,
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
          await axiosInstance.delete(`/api/admin/liveChat/${conversation_id}`);
          displayMessage('Conversation deleted successfully', 'success');
          router.push('/admin/liveChat/main');
        } catch (error) {
          displayMessage('Failed to delete conversation', 'error');
        } finally {
          hideLoader();
        }
      },
      onCancel: () => hideModal(),
    });
  };
  /* guard redirect */
  useEffect(() => {
    if (status !== 'loading' && !isAllowed && redirect)
      router.replace(redirect);
  }, [status, isAllowed, redirect, router]);

  /* ─────────────────────────────
   *  9. JSX
   * ──────────────────────────── */
  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="container-style">
        {/* … header + conversation switch list unchanged … */}

        {/* 💬 Messages */}
        <div className="flex flex-col items-center justify-center">
          <div className="container-style w-10/12 items-center my-5 pc:min-h-fit">
            <h1 className="text-2xl font-bold my-2 text-center">
              Conversation Subject: {subject || 'N/A'}
            </h1>

            {/* 👀 typing banner */}
            {Object.values(othersTyping).some(Boolean) && (
              <p className="text-center italic text-sm text-gray-300 mb-1">
                Someone is typing…
              </p>
            )}

            <hr className="border border-gray-400 w-8/12 mb-4 mx-auto" />

            <div
              ref={messagesContainerRef}
              className="overflow-y-auto flex flex-col gap-4 h-full w-full"
            >
              {messages.length === 0 ? (
                <p className="text-center text-gray-400">No messages yet.</p>
              ) : (
                messages
                  .filter((m) => m.status !== 'deleted')
                  .map((msg) => (
                    /* message bubble … unchanged … */
                    <div key={msg.message_id}>…</div>
                  ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>

        {/* 📥 Reply box */}
        <div className="flex flex-col items-center justify-center">
          <div className="container-style border p-4 mb-6 w-10/12">
            <h2 className="text-2xl font-bold mb-2 text-center">Reply</h2>
            <textarea
              value={replyMessage}
              onChange={handleInput}
              className="border p-2 w-full h-24 bg-white text-black"
              placeholder="Type your reply here…"
            />
            <div className="flex flex-col items-center">
              <button
                className="bg-green-500 text-white px-4 py-2 mt-2 rounded hover:bg-green-600 transition w-1/4"
                onClick={handleSendMessage}
              >
                Send Reply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLiveChatConversation;
