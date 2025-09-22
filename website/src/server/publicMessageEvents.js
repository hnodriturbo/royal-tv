/**
 *   ============= messageEvents.js =============
 * 💬
 * SOCKET.IO EVENT HANDLERS FOR CHAT MESSAGES (PUBLIC ONLY)
 * - Handles sending, editing, deleting, and marking messages as read.
 * - Uses Prisma PublicLiveChat models directly
 * ==============================================
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
