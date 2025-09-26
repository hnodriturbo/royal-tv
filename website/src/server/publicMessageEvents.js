/**
 * ================== publicMessageEvents.js ==================
 * 💬 Public Live Chat — Message lifecycle (send/edit/delete/refresh/typing)
 * -----------------------------------------------------------
 * Inbound events:
 *   • public_send_message        { public_conversation_id: string, message: string }
 *   • public_edit_message        { public_message_id: string, message: string }
 *   • public_delete_message      { public_message_id: string }
 *   • public_refresh_messages    { public_conversation_id: string, limit?: number }
 *   • public_mark_read           { public_conversation_id: string }
 *   • public_typing              { public_conversation_id: string, isTyping?: boolean }
 *
 * Outbound emits:
 *   • public_receive_message     { public_conversation_id, message }
 *   • public_message_edited      { public_conversation_id, public_message_id, message }
 *   • public_message_deleted     { public_conversation_id, public_message_id }
 *   • public_messages_refreshed  { public_conversation_id, messages }
 *   • public_marked_read         { public_conversation_id, ok: true }
 *   • public_user_typing         { public_conversation_id, user: { user_id, name }, isTyping }
 *   • public_message_error       { error: string }
 *
 * Notes:
 *   • Uses cookie utils to remember the last open public room for nicer UX 🍪
 *   • Sender is either a real user (sender_user_id) or a guest (sender_guest_id = public_identity_id)
 *   • Admins may edit/delete any public message; authors may edit/delete their own.
 */

import dayjs from 'dayjs'; // 🗓️ For consistent dates (optional)
import prisma from '../lib/core/prisma.js'; // 🧱 Prisma client
import createCookieUtils from './cookieEvents.js'; // 🍪 tiny cookie helpers

// 🧪 Validation of UUID from another file (for checking the public_conversation_id)
const isUuid = (value) => typeof value === 'string' && /^[0-9a-fA-F-]{36}$/.test(value);

// 🧹 Trim + guard helper
const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

// 📨 Outgoing shape helper (keeps payloads compact + predictable)
function createMessage(row) {
  // 🧭 Minimal shape for UI rendering (ids + text + author hints + timestamp)
  return {
    public_message_id: row.public_message_id,
    public_conversation_id: row.public_conversation_id,
    message: row.message,
    sender_user_id: row.sender_user_id || null,
    sender_guest_id: row.sender_guest_id || null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

export default function registerPublicMessageEvents(io, socket) {
  // 🍪 Bind cookie helpers to this socket
  const cookieUtils = createCookieUtils({
    cookieHeader: socket?.handshake?.headers?.cookie || '',
    socket
  });

  /* =========================================================
   * ✉️ SEND
   * =======================================================*/

  // 📨 Send a messaqe from client
  socket.on('public_send_message', async ({ public_conversation_id, message } = {}) => {
    try {
      // 🛡️ Validate input text and the use of validator for UUID
      const cleanText = normalizeText(message);
      if (!isUuid(public_conversation_id)) {
        socket.emit('public_message_error', { error: 'Invalid conversation id.' });
        return;
      }
      if (!cleanText) {
        socket.emit('public_message_error', { error: 'Message cannot be empty.' });
        return;
      }

      // 🔎 Ensure conversation exists
      const conversation = await prisma.publicLiveChatConversation.findUnique({
        where: { public_conversation_id },
        select: { public_conversation_id: true }
      });
      if (!conversation) {
        socket.emit('public_message_error', { error: 'Conversation not found.' });
        return;
      }

      // ✍️ Build author fields (user vs guest)
      const authorFields =
        socket.userData.role !== 'guest' && isUuid(socket.userData.user_id)
          ? { sender_user_id: socket.userData.user_id }
          : { sender_guest_id: socket.userData.public_identity_id };

      // 💾 Create message row
      const created = await prisma.publicLiveChatMessage.create({
        data: {
          public_conversation_id,
          message: cleanText,
          ...authorFields
        },
        select: {
          public_message_id: true,
          public_conversation_id: true,
          message: true,
          sender_user_id: true,
          sender_guest_id: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // 📣 Broadcast to the room (everyone currently in the room)
      io.to(public_conversation_id).emit('public_receive_message', {
        public_conversation_id,
        message: createMessage(created)
      });

      // 🍪 Remember last room for smooth reload UX
      cookieUtils.rememberLastRoom(public_conversation_id);

      // 📝 Log creation
      console.log(
        `💬 [SOCKET PublicMessage] Sent in ${public_conversation_id} by ${socket.userData.name}`
      );
    } catch (error) {
      console.error('❌ [SOCKET PublicMessage] send failed', error);
      socket.emit('public_message_error', { error: 'Failed to send message.' });
    }

    /* =========================================================
     * ✏️ EDIT
     * =======================================================*/
    socket.on('public_edit_message', async ({ public_message_id, message } = {}) => {
      try {
        const cleanText = normalizeText(message);
        if (!isUuid(public_message_id)) {
          socket.emit('public_message_error', { error: 'Invalid message id.' });
          return;
        }
        if (!cleanText) {
          socket.emit('public_message_error', { error: 'Message cannot be empty.' });
          return;
        }

        // 🔎 Load message to check permissions + get convo id
        const existing = await prisma.publicLiveChatMessage.findUnique({
          where: { public_message_id },
          select: {
            public_message_id: true,
            public_conversation_id: true,
            sender_user_id: true,
            sender_guest_id: true
          }
        });
        if (!existing) {
          socket.emit('public_message_error', { error: 'Message not found.' });
          return;
        }
        // 🔐 Allow if admin OR (author matches by sender_user_id or sender_guest_id)
        const isAdmin = socket.userData.role === 'admin';
        const isAuthorUser =
          existing.sender_user_id && existing.sender_user_id === socket.userData.user_id;
        const isAuthorGuest =
          existing.sender_guest_id &&
          existing.sender_guest_id === socket.userData.public_identity_id;

        if (!isAdmin && !isAuthorUser && !isAuthorGuest) {
          socket.emit('public_message_error', { error: 'Forbidden to edit this message.' });
          return;
        }

        // 💾 Update the message in the database
        const updated = await prisma.publicLiveChatMessage.update({
          where: { public_message_id },
          data: { message: cleanText },
          select: {
            public_message_id: true,
            public_conversation_id: true,
            message: true,
            sender_user_id: true,
            sender_guest_id: true,
            createdAt: true,
            updatedAt: true
          }
        });

        // 📣 Broadcast edit to the room
        io.to(updated.public_conversation_id).emit('public_message_edited', {
          public_conversation_id: updated.public_conversation_id,
          public_message_id: updated.public_message_id,
          message: createMessage(updated)
        });

        // 📝 Log the event
        console.log(`✏️ [SOCKET PublicMessage] Edited ${public_message_id}`);
      } catch (error) {
        console.error('❌ [SOCKET PublicMessage] edit failed', error);
        socket.emit('public_message_error', { error: 'Failed to edit message.' });
      }
    });
    /* =========================================================
     * 🗑️ DELETE
     * =======================================================*/

    /* =========================================================
     * 🔄 REFRESH (fetch recent)
     * =======================================================*/

    /* =========================================================
     * ✅ MARK READ (conversation)
     * =======================================================*/
  });
}
