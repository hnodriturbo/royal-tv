/**
 * ================== publicMessageEvents.js ==================
 * 💬 Public Live Chat — Message lifecycle (create/update/delete/list/typing)
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

        public_conversation_id = conv.public_conversation_id;
        console.log('🆕 [public_message:create] created conversation %s', public_conversation_id);

        const set = ensureRoomSet(public_conversation_id);
        socket.join(public_conversation_id);
        set.add(socket.id);
        cookieUtils.rememberLastRoom(public_conversation_id);

        io.to(public_conversation_id).emit('public_presence:update', {
          room_id: public_conversation_id,
          users: usersFromSet(io, set)
        });
      }

      // ✍️ Author fields
      const authorFields =
        socket.userData?.role !== 'guest' && isUuid(socket.userData?.user_id)
          ? { sender_user_id: socket.userData.user_id }
          : { sender_guest_id: socket.userData?.public_identity_id || null };

      // 💾 Insert message
      const created = await prisma.publicLiveChatMessage.create({
        data: {
          public_conversation_id,
          message: clean,
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

      console.log(
        '📤 [public_message:create] emit created → room:%s id:%s',
        public_conversation_id,
        created.public_message_id
      );

      io.to(public_conversation_id).emit('public_message:created', {
        public_conversation_id,
        message: displayMessage(created)
      });

      // 🔔 Unread bump (other side)
      try {
        if (socket.userData?.role === 'admin') {
          const total = await computeUserUnread(prisma, public_conversation_id);
          io.to(public_conversation_id).emit('public_unread:updated', {
            scope: 'user',
            public_conversation_id,
            total
          });
        } else {
          const total = await computeAdminGlobalUnread(prisma);
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
      } else if (action === 'mark_read') {
        const { public_conversation_id } = payload;
        if (!isUuid(public_conversation_id)) {
          console.warn('🛑 [public_message:update] mark_read invalid room');
          return socket.emit('public_error', { code: 'INVALID_ID' });
        }

        const role = socket.userData?.role || 'guest';
        await prisma.publicLiveChatMessage.updateMany({
          where: { public_conversation_id, ...whereForMarkReadByRole(role) },
          data: { readAt: new Date() }
        });

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
          sender_guest_id: true,
          sender_is_admin: true
        }
      });
      if (!existing) return socket.emit('public_error', { code: 'NOT_FOUND' });

      const canModify = makeCanModifyChecker(socket);
      if (!canModify(existing)) return socket.emit('public_error', { code: 'FORBIDDEN' });

      await prisma.publicLiveChatMessage.delete({ where: { public_message_id } });

      console.log('🗑️ [public_message:delete] deleted %s', public_message_id);

      io.to(existing.public_conversation_id).emit('public_message:deleted', {
        public_conversation_id: existing.public_conversation_id,
        public_message_id
      });

      if (!existing.sender_is_admin) {
        const total = await computeAdminGlobalUnread(prisma);
        io.to('admins').emit('public_unread:updated', { scope: 'admin', total });
      }
    } catch (err) {
      console.error('[public_message:delete] DB_FAILURE →', err);
      socket.emit('public_error', { code: 'DB_FAILURE' });
    }
  });

<<<<<<< HEAD
  /* ======================= 📜 LIST ======================== */
  socket.on('public_message:list', async ({ public_conversation_id, limit = 50 } = {}) => {
    console.log('📥 [public_message:list] room:%s limit:%s', public_conversation_id, limit);
=======
  /* =========================================================
   * 🔄 REFRESH (fetch recent)
   * =======================================================*/

  socket.on('public_refresh_messages', async ({ public_conversation_id } = {}) => {
>>>>>>> 5e5901d (small update to publicMessageEvents.js)
    try {
      if (!isUuid(public_conversation_id)) {
        console.warn('🛑 [public_message:list] invalid room');
        return socket.emit('public_error', { code: 'INVALID_ID' });
      }

      const rows = await prisma.publicLiveChatMessage.findMany({
        where: { public_conversation_id },
        orderBy: { createdAt: 'asc' },
        take: Math.max(10, Math.min(200, Number(limit) || 50))
      });

      console.log('📤 [public_message:list] returning %d rows', rows.length);

      socket.emit('public_message:list', {
        public_conversation_id,
        messages: rows.map(displayMessage)
      });
    } catch (err) {
      console.error('[public_message:list] DB_FAILURE →', err);
      socket.emit('public_error', { code: 'DB_FAILURE' });
    }
  });

  /* ======================= ⌨️ TYPING ====================== */
  socket.on('public_message:typing', ({ public_conversation_id, isTyping = true } = {}) => {
    console.log(
      '⌨️ [public_message:typing] room:%s isTyping:%s',
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
