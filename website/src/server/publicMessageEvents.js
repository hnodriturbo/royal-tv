/**
 * ================== publicMessageEvents.js ==================
 * 💬 Public Live Chat — Message handlers (send/edit/delete/read/refresh/typing)
 * ---------------------------------------------------------------------------
 * Inbound events:
 *   • public_send_message       { public_conversation_id, message }
 *   • public_edit_message       { public_conversation_id, public_message_id, message }
 *   • public_delete_message     { public_conversation_id, public_message_id }
 *   • public_mark_read          { public_conversation_id }
 *   • public_refresh_messages   { public_conversation_id }
 *   • public_typing             { public_conversation_id, isTyping: boolean }
 *
 * Outbound emits:
 *   • public_receive_message
 *   • public_message_edited
 *   • public_message_deleted
 *   • public_unread_count_update
 *   • public_messages_refreshed
 *   • public_user_typing
 */

import dayjs from 'dayjs'; // 🗓️ For consistent dates (optional)
import prisma from '../lib/core/prisma.js'; // 📦 Prisma client singleton

// 🧪 Validation of UUID from another file (for checking the public_conversation_id)
const isUuid = (value) => typeof value === 'string' && /^[0-9a-fA-F-]{36}$/.test(value);

export default function publicMessageEvents(io, socket) {
  // 📨 Send a messaqe from client
  socket.on('public_send_message', async ({ public_conversation_id, public_message }) => {
    console.log('[DEBUG] public_send_message payload:', { public_conversation_id, public_message });

    // 🛡️ Use validator of UUID to make sure we have an useful public_conversation_id
    if (!isUuid(public_conversation_id)) {
      console.error('[ERROR] Invalid public_conversation_id (not uuid)', public_conversation_id);
      socket.emit('public_send_message_error', { error: 'Invalid public_conversation_id' });
      return;
    }

    // ✨ Put the message in the publicLiveChatMessage model
    const publicMessageModel = prisma.publicLiveChatMessage;
    const senderId = socket.userData.user_id || socket.userData.socket_id; // 📌 The one sending the message

    // TO BE CONTINUED
  });
}
