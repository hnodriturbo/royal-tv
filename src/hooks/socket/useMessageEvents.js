/**
 *   ================= useMessageEvents.js =================
 * 💬
 * Unified send/edit/delete/receive for messages in chat (Live only!).
 * - Uses Socket.IO events to communicate with the server.
 * - Bubble and chatType logic removed—NOW live-only and bulletproof!
 * =========================================================
 * PROPS:
 *   conversation_id: string
 * =========================================================
 * USAGE:
 *   const {
 *     sendMessage, editMessage, deleteMessage,
 *     onReceiveMessage, onMessageEdited, onMessageDeleted
 *   } = useMessageEvents(conversation_id);
 * =========================================================
 */
import { useCallback } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function useMessageEvents(conversation_id) {
  // 🛰️ Get core socket actions and event listener from your hub
  const { sendMessage, editMessage, deleteMessage, listen } = useSocketHub();

  // 📤 Send message (now sends ONLY UUID + message)
  const send = useCallback(
    (message) => {
      sendMessage(conversation_id, message);
      console.log(`📤 Sent message: ${message}`);
    },
    [conversation_id, sendMessage]
  );

  // ✏️ Edit message (no chatType—just pass IDs and text)
  const edit = useCallback(
    (message_id, newMessage) => {
      editMessage(conversation_id, message_id, newMessage);
      console.log(`✏️ Edit message: ${message_id}`);
    },
    [conversation_id, editMessage]
  );

  // 🗑️ Delete message (no chatType, just the IDs)
  const del = useCallback(
    (message_id) => {
      deleteMessage(conversation_id, message_id);
      console.log(`🗑️ Delete message: ${message_id}`);
    },
    [conversation_id, deleteMessage]
  );

  // 👂 Listen for new incoming messages in this conversation/room
  const onReceiveMessage = useCallback(
    (handler) =>
      listen('receive_message', (data) => {
        if (data.conversation_id === conversation_id) {
          handler(data);
        }
      }),
    [conversation_id, listen]
  );

  // 👂 Listen for messages being edited in this conversation/room
  const onMessageEdited = useCallback(
    (handler) =>
      listen('message_edited', (data) => {
        if (data.conversation_id === conversation_id) {
          handler(data);
        }
      }),
    [conversation_id, listen]
  );

  // 👂 Listen for messages being deleted in this conversation/room
  const onMessageDeleted = useCallback(
    (handler) =>
      listen('message_deleted', (data) => {
        if (data.conversation_id === conversation_id) {
          handler(data);
        }
      }),
    [conversation_id, listen]
  );

  // ✅ Export all actions & listeners for easy chat use
  return {
    sendMessage: send, // 🚀 Send a message
    editMessage: edit, // ✏️ Edit a message
    deleteMessage: del, // 🗑️ Delete a message
    onReceiveMessage, // 👂 Listen for new messages
    onMessageEdited, // 👂 Listen for message edits
    onMessageDeleted // 👂 Listen for message deletions
  };
}
