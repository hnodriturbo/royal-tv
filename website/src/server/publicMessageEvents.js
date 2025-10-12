/**
 * ================== publicMessageEvents.js ==================
 * 💬 Public Live Chat — Message lifecycle (create/edit/delete/refresh/mark_read/typing)
 * -----------------------------------------------------------
 * Inbound (client → server):
 *   • public_message:create       { public_conversation_id: string, message: string }
 *   • public_message:edit         { public_message_id: string, message: string }
 *   • public_message:delete       { public_message_id: string }
 *   • public_message:refresh      { public_conversation_id: string }
 *   • public_message:mark_read    { public_conversation_id: string }
 *   • public_message:typing       { public_conversation_id: string, isTyping?: boolean }
 *
 * Outbound (server → client):
 *   • public_message:created      { public_conversation_id, message }
 *   • public_message:edited       { public_conversation_id, public_message_id, message }
 *   • public_message:deleted      { public_conversation_id, public_message_id }
 *   • public_message:refreshed    { public_conversation_id, messages }
 *   • public_message:marked_read  { public_conversation_id, ok: true }
 *   • public_message:user_typing  { public_conversation_id, user, isTyping }
 *   • public_message:unread_user  { public_conversation_id, total }
 *   • public_message:unread_admin { total }
 *   • public_message:error        { code, message }
 */
import prisma from '../lib/core/prisma.js'; // 🧱 Prisma client
import createCookieUtils from './cookieEvents.js'; // 🍪 cookie helpers

// 🧪 UUID check
const isUuid = (value) => typeof value === 'string' && /^[0-9a-fA-F-]{36}$/.test(value);

// 🔎 Trim helper
const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

// 🎁 UI shape
function displayMessage(row) {
  return {
    public_message_id: row.public_message_id,
    public_conversation_id: row.public_conversation_id,
    message: row.message,
    sender_user_id: row.sender_user_id || null,
    sender_guest_id: row.sender_guest_id || null,
    sender_is_admin: !!row.sender_is_admin,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

// 🔐 Author/admin permission helper
const makeCanModifyChecker = (socket) => {
  const { role, user_id, public_identity_id } = socket.userData || {};
  return (existing) =>
    role === 'admin' ||
    (existing.sender_user_id != null && existing.sender_user_id === user_id) ||
    (existing.sender_guest_id != null && existing.sender_guest_id === public_identity_id);
};

// 🔔 Unread helpers
async function computeUserUnread(prisma, public_conversation_id) {
  return prisma.publicLiveChatMessage.count({
    where: { public_conversation_id, sender_is_admin: true, readAt: null }
  });
}
async function computeAdminGlobalUnread(prisma) {
  return prisma.publicLiveChatMessage.count({
    where: { sender_is_admin: false, readAt: null }
  });
}
function whereForMarkReadByRole(role) {
  return role === 'admin'
    ? { sender_is_admin: false, readAt: null }
    : { sender_is_admin: true, readAt: null };
}

export default function registerPublicMessageEvents(io, socket) {
  // 🍪 bind cookie helpers
  const cookieUtils = createCookieUtils({
    cookieHeader: socket?.handshake?.headers?.cookie || '',
    socket
  });

  /* =========================================================
   * ✉️ CREATE
   * =======================================================*/
  socket.on('public_message:create', async ({ public_conversation_id, message } = {}) => {
    try {
      const cleanText = normalizeText(message);
      if (!isUuid(public_conversation_id)) {
        console.log('[Public] 🧨 Message not sent (INVALID_ID)'); // invalid id
        socket.emit('public_message:error', {
          code: 'INVALID_ID',
          message: 'Invalid conversation id.'
        });
        return;
      }
      if (!cleanText) {
        console.log('[Public] 🧨 Message not sent (VALIDATION_EMPTY)'); // empty message
        socket.emit('public_message:error', {
          code: 'VALIDATION_EMPTY',
          message: 'Message required.'
        });
        return;
      }
      const conversation = await prisma.publicLiveChatConversation.findUnique({
        where: { public_conversation_id },
        select: { public_conversation_id: true }
      });
      if (!conversation) {
        console.log('[Public] 🧨 Message not sent (NOT_FOUND)'); // missing conversation
        socket.emit('public_message:error', {
          code: 'NOT_FOUND',
          message: 'Conversation not found.'
        });
        return;
      }
      const authorFields =
        socket.userData?.role !== 'guest' && isUuid(socket.userData?.user_id)
          ? { sender_user_id: socket.userData.user_id }
          : { sender_guest_id: socket.userData?.public_identity_id || null };

      const created = await prisma.publicLiveChatMessage.create({
        data: {
          public_conversation_id,
          message: cleanText,
          ...authorFields,
          sender_is_admin: socket.userData?.role === 'admin',
          sender_is_bot: false
        },
        select: {
          public_message_id: true,
          public_conversation_id: true,
          message: true,
          sender_user_id: true,
          sender_guest_id: true,
          sender_is_admin: true,
          createdAt: true,
          updatedAt: true
        }
      });

      console.log('[Public] 📨 Message sent:', created.public_message_id); // 🟢 Confirm send

      // 📣 Fan-out to room
      io.to(public_conversation_id).emit('public_message:created', {
        public_conversation_id,
        message: displayMessage(created)
      });

      // 🔔 Update unread counters
      try {
        if (socket.userData?.role === 'admin') {
          const total = await computeUserUnread(prisma, public_conversation_id);
          io.to(public_conversation_id).emit('public_message:unread_user', {
            public_conversation_id,
            total
          });
        } else {
          const total = await computeAdminGlobalUnread(prisma);
          io.to('admins').emit('public_message:unread_admin', { total });
        }
      } catch {}

      // 🍪 Remember last room for smoother UX
      cookieUtils.rememberLastRoom(public_conversation_id);
    } catch (error) {
      console.log('[Public] 🧨 Message not sent (DB_FAILURE)'); // db error
      socket.emit('public_message:error', {
        code: 'DB_FAILURE',
        message: 'Failed to create message.'
      });
    }
  });

  /* =========================================================
   * ✏️ EDIT
   * =======================================================*/
  socket.on('public_message:edit', async ({ public_message_id, message } = {}) => {
    try {
      const cleanText = normalizeText(message);
      if (!isUuid(public_message_id)) {
        socket.emit('public_message:error', { code: 'INVALID_ID', message: 'Invalid message id.' });
        return;
      }
      if (!cleanText) {
        socket.emit('public_message:error', {
          code: 'VALIDATION_EMPTY',
          message: 'Message required.'
        });
        return;
      }
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
        socket.emit('public_message:error', { code: 'NOT_FOUND', message: 'Message not found.' });
        return;
      }
      const canModify = makeCanModifyChecker(socket);
      if (!canModify(existing)) {
        socket.emit('public_message:error', { code: 'FORBIDDEN', message: 'Forbidden to edit.' });
        return;
      }
      const updated = await prisma.publicLiveChatMessage.update({
        where: { public_message_id },
        data: { message: cleanText },
        select: {
          public_message_id: true,
          public_conversation_id: true,
          message: true,
          sender_user_id: true,
          sender_guest_id: true,
          sender_is_admin: true,
          createdAt: true,
          updatedAt: true
        }
      });

      console.log('[Public] 🛠️ Message edited:', updated.public_message_id); // 🟢 Confirm edit

      io.to(updated.public_conversation_id).emit('public_message:edited', {
        public_conversation_id: updated.public_conversation_id,
        public_message_id: updated.public_message_id,
        message: displayMessage(updated)
      });
    } catch (error) {
      socket.emit('public_message:error', {
        code: 'DB_FAILURE',
        message: 'Failed to edit message.'
      });
    }
  });

  /* =========================================================
   * 🗑️ DELETE
   * =======================================================*/
  socket.on('public_message:delete', async ({ public_message_id } = {}) => {
    try {
      if (!isUuid(public_message_id)) {
        socket.emit('public_message:error', { code: 'INVALID_ID', message: 'Invalid message id.' });
        return;
      }
      const existing = await prisma.publicLiveChatMessage.findUnique({
        where: { public_message_id },
        select: {
          public_message_id: true,
          public_conversation_id: true,
          sender_user_id: true,
          sender_guest_id: true,
          sender_is_admin: true
        }
      });
      if (!existing) {
        socket.emit('public_message:error', { code: 'NOT_FOUND', message: 'Message not found.' });
        return;
      }
      const canModify = makeCanModifyChecker(socket);
      if (!canModify(existing)) {
        socket.emit('public_message:error', {
          code: 'FORBIDDEN',
          message: 'Not allowed to delete.'
        });
        return;
      }

      await prisma.publicLiveChatMessage.delete({ where: { public_message_id } });

      console.log('[Public] 🧽 Message deleted:', public_message_id); // 🟢 Confirm delete

      io.to(existing.public_conversation_id).emit('public_message:deleted', {
        public_conversation_id: existing.public_conversation_id,
        public_message_id
      });

      // 🔔 Admin counter might change if non-admin message removed
      if (!existing.sender_is_admin) {
        const total = await computeAdminGlobalUnread(prisma);
        io.to('admins').emit('public_message:unread_admin', { total });
      }
    } catch (error) {
      socket.emit('public_message:error', {
        code: 'DB_FAILURE',
        message: 'Failed to delete message.'
      });
    }
  });

  /* =========================================================
   * 🔄 REFRESH
   * =======================================================*/
  socket.on('public_message:refresh', async ({ public_conversation_id } = {}) => {
    try {
      if (!isUuid(public_conversation_id)) {
        socket.emit('public_message:error', {
          code: 'INVALID_ID',
          message: 'Invalid conversation id.'
        });
        return;
      }

      const rows = await prisma.publicLiveChatMessage.findMany({
        where: { public_conversation_id },
        orderBy: { createdAt: 'asc' }
      });

      const messages = rows.map(displayMessage);

      console.log(
        '[Public] 🔁 Messages refreshed:',
        public_conversation_id,
        'count:',
        messages.length
      ); // 🟢 Confirm list

      socket.emit('public_message:refreshed', { public_conversation_id, messages });
    } catch (error) {
      socket.emit('public_message:error', {
        code: 'DB_FAILURE',
        message: 'Failed to refresh messages.'
      });
    }
  });

  /* =========================================================
   * ✅ MARK READ
   * =======================================================*/
  socket.on('public_message:mark_read', async ({ public_conversation_id } = {}) => {
    try {
      if (!isUuid(public_conversation_id)) {
        socket.emit('public_message:error', {
          code: 'INVALID_ID',
          message: 'Invalid conversation id.'
        });
        return;
      }
      const role = socket.userData?.role || 'guest';
      await prisma.publicLiveChatMessage.updateMany({
        where: { public_conversation_id, ...whereForMarkReadByRole(role) },
        data: { readAt: new Date() }
      });

      console.log('[Public] ✅ Conversation marked read:', public_conversation_id); // 🟢 Confirm read

      socket.emit('public_message:marked_read', { public_conversation_id, ok: true });

      if (role === 'admin') {
        const total = await computeAdminGlobalUnread(prisma);
        io.to('admins').emit('public_message:unread_admin', { total });
      } else {
        const total = await computeUserUnread(prisma, public_conversation_id);
        socket.emit('public_message:unread_user', { public_conversation_id, total });
      }
      await prisma.publicLiveChatConversation.update({
        where: { public_conversation_id },
        data: { read: true }
      });
    } catch (error) {
      socket.emit('public_message:error', { code: 'DB_FAILURE', message: 'Failed to mark read.' });
    }
  });

  /* =========================================================
   * ⌨️ TYPING
   * =======================================================*/
  socket.on('public_message:typing', ({ public_conversation_id, isTyping = true } = {}) => {
    if (!isUuid(public_conversation_id)) return;
    io.to(public_conversation_id).emit('public_message:user_typing', {
      public_conversation_id,
      user: {
        user_id: socket.userData.user_id,
        name: socket.userData.name,
        role: socket.userData.role
      },
      isTyping: !!isTyping
    });
  });
}
