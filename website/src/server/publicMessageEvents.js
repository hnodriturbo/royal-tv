/**
 * ================== publicMessageEvents.js ==================
<<<<<<< HEAD
 * 💬 Public Live Chat — Message lifecycle (create/update/delete/list/typing)
=======
 * 💬 Public Live Chat — Message lifecycle (send/edit/delete/refresh/typing)
 * -----------------------------------------------------------
 * Inbound events:
 *   • public:send_message        { public_conversation_id: string, message: string }
 *   • public:edit_message        { public_message_id: string, message: string }
 *   • public:delete_message      { public_message_id: string }
 *   • public:refresh_messages    { public_conversation_id: string, limit?: number }
 *   • public:mark_read           { public_conversation_id: string }
 *   • public:typing              { public_conversation_id: string, isTyping?: boolean }
 *
 * Outbound emits:
 *   • public:receive_message     { public_conversation_id, message }
 *   • public:message_edited      { public_conversation_id, public_message_id, message }
 *   • public:message_deleted     { public_conversation_id, public_message_id }
 *   • public:messages_refreshed  { public_conversation_id, messages }
 *   • public:marked_read         { public_conversation_id, ok: true }
 *   • public:user_typing         { public_conversation_id, user: { user_id, name }, isTyping }
 *   • public:error               { code, error: string }
 *
 * Notes:
 *   • Uses cookie utils to remember the last open public room for nicer UX 🍪
 *   • Sender is either a real user (sender_user_id) or a guest (sender_guest_id = public_identity_id)
 *   • Admins may edit/delete any public message; authors may edit/delete their own.
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef
 */

import prisma from '../lib/core/prisma.js';
import createCookieUtils from './cookieEvents.js';

// 🧪 UUID guard
const isUuid = (v) => typeof v === 'string' && /^[0-9a-fA-F-]{36}$/.test(v);

// 🧼 Trim message
const normalizeText = (v) => (typeof v === 'string' ? v.trim() : '');

// 📦 Normalize DB row → UI
const displayMessage = (row) => ({
  public_message_id: row.public_message_id,
  public_conversation_id: row.public_conversation_id,
  message: row.message,
  sender_user_id: row.sender_user_id || null,
  sender_guest_id: row.sender_guest_id || null,
  sender_is_admin: !!row.sender_is_admin,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt
});

// 🔐 Author/admin permission checker
const makeCanModifyChecker = (socket) => {
  const { role, user_id, public_identity_id } = socket.userData || {};
  return (existing) =>
    role === 'admin' ||
    (existing.sender_user_id && existing.sender_user_id === user_id) ||
    (existing.sender_guest_id && existing.sender_guest_id === public_identity_id);
};

<<<<<<< HEAD
// 🔔 Unread counters
const computeUserUnread = (prisma, public_conversation_id) =>
  prisma.publicLiveChatMessage.count({
    where: { public_conversation_id, sender_is_admin: true, readAt: null }
  });

const computeAdminGlobalUnread = (prisma) =>
  prisma.publicLiveChatMessage.count({
    where: { sender_is_admin: false, readAt: null }
  });

const whereForMarkReadByRole = (role) =>
  role === 'admin'
    ? { sender_is_admin: false, readAt: null }
    : { sender_is_admin: true, readAt: null };

// 👥 Map Set(socketId) → [userData] (for presence echo when we auto-create)
const usersFromSet = (io, set) =>
  Array.from(set || [])
    .map((sid) => io.sockets.sockets.get(sid)?.userData)
    .filter(Boolean);

export default function registerPublicMessageEvents(io, socket, globalState) {
  // 🍪 cookie helpers
=======
// Count unread for a specific conversation for a user/guest (admin-authored, unread)
async function computeUserUnread(prisma, public_conversation_id) {
  return prisma.publicLiveChatMessage.count({
    where: { public_conversation_id, sender_is_admin: true, readAt: null }
  });
}
// Count admin's global unread (all non-admin authored, unread)
async function computeAdminGlobalUnread(prisma) {
  return prisma.publicLiveChatMessage.count({
    where: { sender_is_admin: false, readAt: null }
  });
}
// Role-aware where for marking readAt
function whereForMarkReadByRole(role) {
  return role === 'admin'
    ? { sender_is_admin: false, readAt: null }
    : { sender_is_admin: true, readAt: null };
}

export default function registerPublicMessageEvents(io, socket) {
  // 🍪 Bind cookie helpers to this socket
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef
  const cookieUtils = createCookieUtils({
    cookieHeader: socket?.handshake?.headers?.cookie || '',
    socket
  });

  // 🗂️ ensure presence registry container
  globalState.activeUsersInPublicRoom =
    globalState.activeUsersInPublicRoom && typeof globalState.activeUsersInPublicRoom === 'object'
      ? globalState.activeUsersInPublicRoom
      : Object.create(null);

  const ensureRoomSet = (roomId) => (globalState.activeUsersInPublicRoom[roomId] ||= new Set());

  /* ======================= ✉️ CREATE (supports no-room → auto-create) ======================= */
  socket.on('public_message:create', async ({ public_conversation_id, message } = {}) => {
    const clean = normalizeText(message);
    console.log(
      '📥 [public_message:create] from %s role:%s room:%s text:"%s"',
      socket.userData?.user_id,
      socket.userData?.role,
      public_conversation_id || '(none)',
      clean
    );

<<<<<<< HEAD
=======
  // 📨 Send a messaqe from client
  socket.on('public:send_message', async ({ public_conversation_id, message } = {}) => {
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef
    try {
      if (!clean) {
        console.warn('🛑 [public_message:create] empty message — abort');
        return socket.emit('public_error', { code: 'INVALID_ID' });
      }

      // 🧭 No room yet? Create conversation on the fly and join+announce presence
      if (!isUuid(public_conversation_id)) {
        // current file rejected here before. :contentReference[oaicite:2]{index=2}
        const owner_user_id =
          socket.userData?.role !== 'guest' && isUuid(socket.userData?.user_id)
            ? socket.userData.user_id
            : null;
        const owner_guest_id =
          socket.userData?.role === 'guest' ? socket.userData?.public_identity_id || null : null;

        const conv = await prisma.publicLiveChatConversation.create({
          data: { owner_id: owner_user_id, owner_guest_id },
          select: { public_conversation_id: true }
        });
<<<<<<< HEAD

        public_conversation_id = conv.public_conversation_id;
        console.log('🆕 [public_message:create] created conversation %s', public_conversation_id);

        const set = ensureRoomSet(public_conversation_id);
        socket.join(public_conversation_id);
        set.add(socket.id);
        cookieUtils.rememberLastRoom(public_conversation_id);

        io.to(public_conversation_id).emit('public_presence:update', {
          room_id: public_conversation_id,
          users: usersFromSet(io, set)
=======
        socket.emit('public:error', {
          code: 'INVALID_ID',
          message: '[SOCKET INVALID_ID] Invalid conversation id.'
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef
        });
      }

<<<<<<< HEAD
      // ✍️ Author fields
=======
      // ❌ Empty message
      if (!cleanText) {
        console.error('[SOCKET VALIDATION_EMPTY][PublicMessage] send refused: empty message', {
          public_conversation_id,
          user: socket.userData?.user_id
        });
        socket.emit('public:error', {
          code: 'VALIDATION_EMPTY',
          message: '[SOCKET VALIDATION_EMPTY] Message cannot be empty.'
        });
        return; // ⛔
      }

      // 🔎 Ensure conversation exists
      const conversation = await prisma.publicLiveChatConversation.findUnique({
        where: { public_conversation_id },
        select: { public_conversation_id: true }
      });

      // ❌ conversation not found
      if (!conversation) {
        console.error('[SOCKET NOT_FOUND][PublicMessage] send refused: conversation missing', {
          public_conversation_id,
          user: socket.userData?.user_id
        });
        socket.emit('public:error', {
          code: 'NOT_FOUND',
          message: '[SOCKET NOT_FOUND] Conversation not found.'
        });
        return; // ⛔
      }

      // ✍️ Build author fields (user vs guest)
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef
      const authorFields =
        socket.userData?.role !== 'guest' && isUuid(socket.userData?.user_id)
          ? { sender_user_id: socket.userData.user_id }
          : { sender_guest_id: socket.userData?.public_identity_id || null };

      // 💾 Insert message
      const created = await prisma.publicLiveChatMessage.create({
        data: {
          public_conversation_id,
<<<<<<< HEAD
          message: clean,
=======
          message: cleanText,
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef
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

<<<<<<< HEAD
      console.log(
        '📤 [public_message:create] emit created → room:%s id:%s',
        public_conversation_id,
        created.public_message_id
      );

      io.to(public_conversation_id).emit('public_message:created', {
=======
      // 📣 Broadcast to the room (everyone currently in the room)
      io.to(public_conversation_id).emit('public:receive_message', {
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef
        public_conversation_id,
        message: displayMessage(created)
      });

<<<<<<< HEAD
      // 🔔 Unread bump (other side)
      try {
        if (socket.userData?.role === 'admin') {
          const total = await computeUserUnread(prisma, public_conversation_id);
          io.to(public_conversation_id).emit('public_unread:updated', {
            scope: 'user',
=======
      try {
        if (socket.userData?.role === 'admin') {
          const total = await computeUserUnread(prisma, public_conversation_id);
          io.to(public_conversation_id).emit('public:unread_user', {
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef
            public_conversation_id,
            total
          });
        } else {
          const total = await computeAdminGlobalUnread(prisma);
<<<<<<< HEAD
          io.to('admins').emit('public_unread:updated', { scope: 'admin', total });
        }
      } catch (e) {
        console.warn('⚠️ [public_message:create] unread update failed:', e?.message || e);
      }
    } catch (err) {
      console.error('[public_message:create] DB_FAILURE →', err);
      socket.emit('public_error', { code: 'DB_FAILURE' });
    }
  });

  /* ======================= ✏️ UPDATE ======================= */
  socket.on('public_message:update', async (payload = {}) => {
    console.log('📥 [public_message:update]', payload?.action, payload);
=======
          io.to('admins').emit('public:unread_admin', { total });
        }
      } catch {}

      // 🍪 Remember last room for smooth reload UX
      cookieUtils.rememberLastRoom(public_conversation_id);

      // 📝 Log creation
      console.log(
        `💬 [SOCKET PublicMessage] Sent in ${public_conversation_id} by ${socket.userData.name}`
      );
    } catch (error) {
      // ❌ Catch (DB or unknown)
      console.error('[SOCKET DB_FAILURE][PublicMessage] send failed:', error);
      socket.emit('public:error', {
        code: 'DB_FAILURE',
        message: '[SOCKET DB_FAILURE] Failed to send message.'
      });
      return; // ⛔
    }
  });

  /* =========================================================
   * ✏️ EDIT
   * =======================================================*/
  socket.on('public:edit_message', async ({ public_message_id, message } = {}) => {
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef
    try {
      const { action } = payload;
      if (action === 'edit') {
        const { public_message_id, message } = payload;
        const clean = normalizeText(message);
        if (!isUuid(public_message_id) || !clean) {
          console.warn('🛑 [public_message:update] edit invalid args');
          return socket.emit('public_error', { code: 'INVALID_ID' });
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
        if (!existing) return socket.emit('public_error', { code: 'NOT_FOUND' });

        const canModify = makeCanModifyChecker(socket);
        if (!canModify(existing)) return socket.emit('public_error', { code: 'FORBIDDEN' });

        const updated = await prisma.publicLiveChatMessage.update({
          where: { public_message_id },
          data: { message: clean },
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

        console.log('✏️ [public_message:update] edited %s', public_message_id);

        io.to(existing.public_conversation_id).emit('public_message:updated', {
          action: 'edit',
          public_conversation_id: existing.public_conversation_id,
          public_message_id,
          message: displayMessage(updated)
        });
<<<<<<< HEAD
      } else if (action === 'mark_read') {
        const { public_conversation_id } = payload;
        if (!isUuid(public_conversation_id)) {
          console.warn('🛑 [public_message:update] mark_read invalid room');
          return socket.emit('public_error', { code: 'INVALID_ID' });
        }
=======
        socket.emit('public:error', {
          code: 'INVALID_ID',
          message: '[SOCKET INVALID_ID] Invalid message id.'
        });
        return; // ⛔
      }
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef

        const role = socket.userData?.role || 'guest';
        await prisma.publicLiveChatMessage.updateMany({
          where: { public_conversation_id, ...whereForMarkReadByRole(role) },
          data: { readAt: new Date() }
        });
<<<<<<< HEAD
=======
        socket.emit('public:error', {
          code: 'VALIDATION_EMPTY',
          message: '[SOCKET VALIDATION_EMPTY] Message cannot be empty.'
        });
        return; // ⛔
      }
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef

        console.log(
          '✅ [public_message:update] marked read → room:%s by:%s',
          public_conversation_id,
          role
        );

        socket.emit('public_message:updated', { action: 'mark_read', public_conversation_id });
        if (role === 'admin') {
          const total = await computeAdminGlobalUnread(prisma);
          io.to('admins').emit('public_unread:updated', { scope: 'admin', total });
        } else {
          const total = await computeUserUnread(prisma, public_conversation_id);
          socket.emit('public_unread:updated', { scope: 'user', public_conversation_id, total });
        }

        await prisma.publicLiveChatConversation.update({
          where: { public_conversation_id },
          data: { read: true }
        });
      } else {
        console.warn('🛑 [public_message:update] unknown action:', action);
        return socket.emit('public_error', { code: 'INVALID_ID' });
      }
    } catch (err) {
      console.error('[public_message:update] DB_FAILURE →', err);
      socket.emit('public_error', { code: 'DB_FAILURE' });
    }
  });

  /* ======================= 🗑️ DELETE ======================= */
  socket.on('public_message:delete', async ({ public_message_id } = {}) => {
    console.log('📥 [public_message:delete]', public_message_id);
    try {
      if (!isUuid(public_message_id)) return socket.emit('public_error', { code: 'INVALID_ID' });

      const existing = await prisma.publicLiveChatMessage.findUnique({
        where: { public_message_id },
        select: {
          public_message_id: true,
          public_conversation_id: true,
          sender_user_id: true,
<<<<<<< HEAD
=======
          sender_guest_id: true
        }
      });

      // ❌ Message not found
      if (!existing) {
        console.error('[SOCKET NOT_FOUND][PublicMessage] edit refused: message missing', {
          public_message_id,
          user: socket.userData?.user_id
        });
        socket.emit('public:error', {
          code: 'NOT_FOUND',
          message: '[SOCKET NOT_FOUND] Message not found.'
        });
        return; // ⛔
      }

      // 🔐 Permission: allow admin, or the original author (user or guest)
      const canModify = makeCanModifyChecker(socket);
      // ❌ Forbidden to edit
      if (!canModify(existing)) {
        console.error('[SOCKET FORBIDDEN][PublicMessage] edit refused: not author/admin', {
          public_message_id,
          user: socket.userData?.user_id
        });
        socket.emit('public:error', {
          code: 'FORBIDDEN',
          message: '[SOCKET FORBIDDEN] Forbidden to edit this message.'
        });
        return; // ⛔
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
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef
          sender_guest_id: true,
          sender_is_admin: true
        }
      });
      if (!existing) return socket.emit('public_error', { code: 'NOT_FOUND' });

<<<<<<< HEAD
=======
      // 📣 Broadcast edit to the room
      io.to(updated.public_conversation_id).emit('public:message_edited', {
        public_conversation_id: updated.public_conversation_id,
        public_message_id: updated.public_message_id,
        message: displayMessage(updated)
      });

      // 📝 Log the event
      console.log(`✏️ [SOCKET PublicMessage] Edited ${public_message_id}`);
    } catch (error) {
      // ❌ Catch (DB or unknown)
      console.error('[SOCKET DB_FAILURE][PublicMessage] edit failed:', error);
      socket.emit('public:error', {
        code: 'DB_FAILURE',
        message: '[SOCKET DB_FAILURE] Failed to edit message.'
      });
      return; // ⛔
    }
  });

  /* =========================================================
   * 🗑️ DELETE
   * =======================================================*/
  socket.on('public:delete_message', async ({ public_message_id } = {}) => {
    try {
      // 🧠 Check UUID of the public_message_id
      if (!isUuid(public_message_id)) {
        console.error('[SOCKET INVALID_ID][PublicMessage] delete refused: bad message id', {
          public_message_id,
          user: socket.userData?.user_id
        });
        socket.emit('public:error', {
          code: 'INVALID_ID',
          message: '[SOCKET INVALID_ID] Invalid message id.'
        });
        return; // ⛔
      }

      // 🔎 Load to check permissions + grab convo id before delete
      const existing = await prisma.publicLiveChatMessage.findUnique({
        where: { public_message_id },
        select: {
          public_message_id: true,
          public_conversation_id: true,
          sender_user_id: true,
          sender_guest_id: true
        }
      });

      // ❌ Message not found
      if (!existing) {
        console.error('[SOCKET NOT_FOUND][PublicMessage] delete refused: message missing', {
          public_message_id,
          user: socket.userData?.user_id
        });
        socket.emit('public:error', {
          code: 'NOT_FOUND',
          message: '[SOCKET NOT_FOUND] Message not found.'
        });
        return; // ⛔
      }

      // 🔐 Permission: allow admin, or the original author (user or guest)
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef
      const canModify = makeCanModifyChecker(socket);
      if (!canModify(existing)) return socket.emit('public_error', { code: 'FORBIDDEN' });

<<<<<<< HEAD
      await prisma.publicLiveChatMessage.delete({ where: { public_message_id } });

      console.log('🗑️ [public_message:delete] deleted %s', public_message_id);

      io.to(existing.public_conversation_id).emit('public_message:deleted', {
=======
      if (!canModify(existing)) {
        // ❌ Forbidden to delete
        console.error('[SOCKET FORBIDDEN][PublicMessage] delete refused: not author/admin', {
          public_message_id,
          user: socket.userData?.user_id
        });
        socket.emit('public:error', {
          code: 'FORBIDDEN',
          message: '[SOCKET FORBIDDEN] Not allowed to delete this message.'
        });
        return; // ⛔
      }
      // ❌ Now we Delete the message after all checks
      await prisma.publicLiveChatMessage.delete({ where: { public_message_id } });

      // 📣 Broadcast deletion to the room
      io.to(existing.public_conversation_id).emit('public:message_deleted', {
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef
        public_conversation_id: existing.public_conversation_id,
        public_message_id
      });

<<<<<<< HEAD
      if (!existing.sender_is_admin) {
        const total = await computeAdminGlobalUnread(prisma);
        io.to('admins').emit('public_unread:updated', { scope: 'admin', total });
      }
    } catch (err) {
      console.error('[public_message:delete] DB_FAILURE →', err);
      socket.emit('public_error', { code: 'DB_FAILURE' });
    }
  });

  /* ======================= 📜 LIST ======================== */
  socket.on('public_message:list', async ({ public_conversation_id, limit = 50 } = {}) => {
    console.log('📥 [public_message:list] room:%s limit:%s', public_conversation_id, limit);
=======
      // 📝 Log the event
      console.log(`🗑️ [SOCKET PublicMessage] Deleted ${public_message_id}`);
    } catch (error) {
      // ❌ Catch (DB or unknown)
      console.error('[SOCKET DB_FAILURE][PublicMessage] delete failed:', error);
      socket.emit('public:error', {
        code: 'DB_FAILURE',
        message: '[SOCKET DB_FAILURE] Failed to delete message.'
      });
      return; // ⛔
    }
  });

  /* =========================================================
   * 🔄 REFRESH (fetch recent)
   * =======================================================*/
  socket.on('public:refresh_messages', async ({ public_conversation_id } = {}) => {
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef
    try {
      if (!isUuid(public_conversation_id)) {
<<<<<<< HEAD
        console.warn('🛑 [public_message:list] invalid room');
        return socket.emit('public_error', { code: 'INVALID_ID' });
=======
        console.error('[SOCKET INVALID_ID][PublicMessage] refresh refused: bad conversation id', {
          public_conversation_id,
          user: socket.userData?.user_id
        });
        socket.emit('public:error', {
          code: 'INVALID_ID',
          message: '[SOCKET INVALID_ID] Invalid conversation id.'
        });
        return; // ⛔
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef
      }

      const rows = await prisma.publicLiveChatMessage.findMany({
        where: { public_conversation_id },
        orderBy: { createdAt: 'asc' },
        take: Math.max(10, Math.min(200, Number(limit) || 50))
      });

      console.log('📤 [public_message:list] returning %d rows', rows.length);

<<<<<<< HEAD
      socket.emit('public_message:list', {
        public_conversation_id,
        messages: rows.map(displayMessage)
=======
      // 🎯 Direct reply to requester only
      socket.emit('public:messages_refreshed', { public_conversation_id, messages });

      // 📝 Log the refresh event
      console.log(
        `🔄 [PublicMessage] Refreshed ${messages.length} messages in ${public_conversation_id}`
      );
    } catch (error) {
      // ❌ Catch (DB or unknown)
      console.error('[SOCKET DB_FAILURE][PublicMessage] refresh failed:', error);
      socket.emit('public:error', {
        code: 'DB_FAILURE',
        message: '[SOCKET DB_FAILURE] Failed to refresh messages.'
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef
      });
    } catch (err) {
      console.error('[public_message:list] DB_FAILURE →', err);
      socket.emit('public_error', { code: 'DB_FAILURE' });
    }
  });

<<<<<<< HEAD
  /* ======================= ⌨️ TYPING ====================== */
  socket.on('public_message:typing', ({ public_conversation_id, isTyping = true } = {}) => {
    console.log(
      '⌨️ [public_message:typing] room:%s isTyping:%s',
=======
  /* =========================================================
   * ✅ MARK READ (conversation)
   * =======================================================*/
  socket.on('public:mark_read', async ({ public_conversation_id } = {}) => {
    try {
      // ❌ Invalid conversation id
      if (!isUuid(public_conversation_id)) {
        console.error('[SOCKET INVALID_ID][PublicMessage] mark_read refused: bad conversation id', {
          public_conversation_id,
          user: socket.userData?.user_id
        });
        socket.emit('public:error', {
          code: 'INVALID_ID',
          message: '[SOCKET INVALID_ID] Invalid conversation id.'
        });
      }

      const role = socket.userData?.role || 'guest';
      await prisma.publicLiveChatMessage.updateMany({
        where: { public_conversation_id, ...whereForMarkReadByRole(role) },
        data: { readAt: new Date() }
      });

      // 🎯 Ack only to caller
      socket.emit('public:marked_read', { public_conversation_id, ok: true });

      // ⚡ Compute unread messages for admin & user
      if (role === 'admin') {
        const total = await computeAdminGlobalUnread(prisma);
        io.to('admins').emit('public:unread_admin', { total });
      } else {
        const total = await computeUserUnread(prisma, public_conversation_id);
        socket.emit('public:unread_user', { public_conversation_id, total });
      }

      // 🏷️ Simple boolean on conversation (public side)
      await prisma.publicLiveChatConversation.update({
        where: { public_conversation_id },
        data: { read: true }
      });

      // 📝 Log
      console.log(`✅ [PublicMessage] Marked read: ${public_conversation_id}`);
    } catch (error) {
      // ❌ Catch (DB or unknown)
      console.error('[SOCKET DB_FAILURE][PublicMessage] mark_read failed:', error);
      socket.emit('public:error', {
        code: 'DB_FAILURE',
        message: '[SOCKET DB_FAILURE] Failed to mark conversation as read.'
      });
      return; // ⛔
    }
  });

  /* =========================================================
   * ⌨️ Request initial unread counters
   * =======================================================*/
  socket.on('public:count_unread', async ({ public_conversation_id, adminGlobal = false } = {}) => {
    try {
      const role = socket.userData?.role || 'guest';
      if (adminGlobal && role === 'admin') {
        const total = await computeAdminGlobalUnread(prisma);
        socket.emit('public:unread_admin', { total });
      }
      if (public_conversation_id) {
        const total = await computeUserUnread(prisma, public_conversation_id);
        socket.emit('public:unread_user', { public_conversation_id, total });
      }
    } catch (e) {
      socket.emit('public:error', { code: 'DB_FAILURE' });
    }
  });

  /* =========================================================
   * ⌨️ TYPING INDICATOR
   * =======================================================*/
  socket.on('public_typing', ({ public_conversation_id, isTyping = true } = {}) => {
    // 🧪 Guard room id
    if (!isUuid(public_conversation_id)) return;

    // 📣 Let room know (no DB writes)
    io.to(public_conversation_id).emit('public_user_typing', {
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef
      public_conversation_id,
      !!isTyping
    );
    if (!isUuid(public_conversation_id)) return;
    socket.to(public_conversation_id).emit('public_message:typing', {
      public_conversation_id,
      user: { id: socket.userData?.user_id || socket.userData?.public_identity_id || 'anon' },
      isTyping: !!isTyping
    });
  });

  /* ======================= 🔔 UNREAD ====================== */
  socket.on('public_unread:count', async ({ scope, public_conversation_id } = {}) => {
    console.log(
      '📥 [public_unread:count] scope:%s room:%s',
      scope,
      public_conversation_id || '(none)'
    );
    try {
      if (scope === 'admin' && socket.userData?.role === 'admin') {
        const total = await computeAdminGlobalUnread(prisma);
        socket.emit('public_unread:updated', { scope: 'admin', total });
      } else if (scope === 'user' && isUuid(public_conversation_id)) {
        const total = await computeUserUnread(prisma, public_conversation_id);
        socket.emit('public_unread:updated', { scope: 'user', public_conversation_id, total });
      } else {
        console.warn('🛑 [public_unread:count] invalid scope/room');
        return socket.emit('public_error', { code: 'INVALID_ID' });
      }
    } catch (err) {
      console.error('[public_unread:count] DB_FAILURE →', err);
      socket.emit('public_error', { code: 'DB_FAILURE' });
    }
  });
}
