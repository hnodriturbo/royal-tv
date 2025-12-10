/**
 *   ================= usePublicMessageEvents.js =================
 * 💬
 * Unified send/edit/delete/receive for public live chat messages.
 * - Uses Socket.IO events to communicate with the server.
 * - Mirrors useMessageEvents.js exactly for consistency!
 * =========================================================
 * PROPS:
 *   public_conversation_id: string
 * =========================================================
 * USAGE:
 *   const {
 *     sendMessage, editMessage, deleteMessage,
 *     onReceiveMessage, onMessageEdited, onMessageDeleted
 *   } = usePublicMessageEvents(public_conversation_id);
 * =========================================================
 */
import { useCallback } from 'react';
import useSocketHub from '@/hooks/socket/useSocketHub';

export default function usePublicMessageEvents(public_conversation_id) {
  // 🛰️ Get core socket actions and event listener from your hub
  const {
    sendPublicMessage,
    editPublicMessage,
    deletePublicMessage,
    onPublicMessageCreated,
    onPublicMessageEdited,
    onPublicMessageDeleted
  } = useSocketHub();

  // 📤 Send message (now sends ONLY UUID + message)
  const send = useCallback(
    (message) => {
      sendPublicMessage(public_conversation_id, message);
      console.log(`📤 [Public] Sent message: ${message}`);
    },
    [public_conversation_id, sendPublicMessage]
  );

  // ✏️ Edit message (no chatType—just pass IDs and text)
  const edit = useCallback(
    (public_message_id, newMessage) => {
      editPublicMessage(public_message_id, newMessage);
      console.log(`✏️ [Public] Edit message: ${public_message_id}`);
    },
    [editPublicMessage]
  );

  // 🗑️ Delete message (no chatType, just the IDs)
  const del = useCallback(
    (public_message_id) => {
      deletePublicMessage(public_message_id);
      console.log(`🗑️ [Public] Delete message: ${public_message_id}`);
    },
    [deletePublicMessage]
  );

  // 👂 Listen for new incoming messages in this conversation/room
  const onReceive = useCallback(
    (handler) =>
      onPublicMessageCreated((data) => {
        if (data.public_conversation_id === public_conversation_id) {
          handler(data);
        }
      }),
    [public_conversation_id, onPublicMessageCreated]
  );

  // 👂 Listen for messages being edited in this conversation/room
  const onEdit = useCallback(
    (handler) =>
      onPublicMessageEdited((data) => {
        if (data.public_conversation_id === public_conversation_id) {
          handler(data);
        }
      }),
    [public_conversation_id, onPublicMessageEdited]
  );

  // 👂 Listen for messages being deleted in this conversation/room
  const onDelete = useCallback(
    (handler) =>
      onPublicMessageDeleted((data) => {
        if (data.public_conversation_id === public_conversation_id) {
          handler(data);
        }
      }),
    [public_conversation_id, onPublicMessageDeleted]
  );

  // ✅ Export all actions & listeners for easy chat use
  return {
    sendMessage: send, // 🚀 Send a message
    editMessage: edit, // ✏️ Edit a message
    deleteMessage: del, // 🗑️ Delete a message
    onReceiveMessage: onReceive, // 👂 Listen for new messages
    onMessageEdited: onEdit, // 👂 Listen for message edits
    onMessageDeleted: onDelete // 👂 Listen for message deletions
  };
}
