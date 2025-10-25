/**
 * ================== publicMessageEvents.js ==================
 * 💬 Public Live Chat — Message Management (SIMPLIFIED)
 * -----------------------------------------------------------
 * Purpose: Handle creating, editing, deleting, and reading messages
 *
 * Key Events:
 *   IN:  public_message:create, edit, delete, refresh, mark_read, typing
 *   OUT: public_message:created, edited, deleted, refreshed, marked_read
 *        public_message:user_typing, unread_user, unread_admin, error
 */
import prisma from '../lib/core/prisma.js';
import { createCookieUtils } from './cookieEvents.js';

// 🧰 HELPERS (keep at top for easy reference)
const isUuid = (value) => typeof value === 'string' && /^[0-9a-fA-F-]{36}$/.test(value);
const cleanMessage = (value) => (typeof value === 'string' ? value.trim() : '');

// 🎁 Format message for client (consistent shape)
function formatMessage(dbMessage) {
  return {
    public_message_id: dbMessage.public_message_id,
    public_conversation_id: dbMessage.public_conversation_id,
    message: dbMessage.message,
    sender_user_id: dbMessage.sender_user_id || null,
    sender_guest_id: dbMessage.sender_guest_id || null,
    sender_is_admin: !!dbMessage.sender_is_admin,
    sender_is_bot: !!dbMessage.sender_is_bot,
    createdAt: dbMessage.createdAt,
    updatedAt: dbMessage.updatedAt
  };
}

export default function registerPublicMessageEvents(io, socket) {
  // 🍪 Bind cookie helpers
  const cookieUtils = createCookieUtils({
    cookieHeader: socket.handshake?.headers?.cookie || '',
    socket
  });

  // 🔐 Check if user can modify a message (author or admin)
  const canModifyMessage = (message) => {
    const { role, user_id, public_identity_id } = socket.userData;

    // Admin can modify anything
    if (role === 'admin') return true;

    // User can modify their own messages
    if (message.sender_user_id && message.sender_user_id === user_id) return true;

    // Guest can modify their own messages
    if (message.sender_guest_id && message.sender_guest_id === public_identity_id) return true;

    return false;
  };

  // 🔔 Calculate unread count for a user in a room
  const countUserUnread = async (roomId) => {
    return await prisma.publicLiveChatMessage.count({
      where: {
        public_conversation_id: roomId,
        sender_is_admin: true, // User only cares about admin messages
        readAt: null
      }
    });
  };

  // 🔔 Calculate total unread for admin (all unread non-admin messages)
  const countAdminUnread = async () => {
    return await prisma.publicLiveChatMessage.count({
      where: {
        sender_is_admin: false, // Admin cares about user/guest messages
        readAt: null
      }
    });
  };

  // 📣 Broadcast unread counts
  const broadcastUnreadCounts = async (roomId) => {
    try {
      // User unread for this room
      const userUnread = await countUserUnread(roomId);
      io.to(roomId).emit('public_message:unread_user', {
        public_conversation_id: roomId,
        total: userUnread
      });

      // Admin global unread
      const adminUnread = await countAdminUnread();
      io.to('admins').emit('public_message:unread_admin', {
        total: adminUnread
      });
    } catch (error) {
      console.error('[Public Messages] ❌ Unread count failed:', error.message);
    }
  };

  /* =========================================================
   * ✉️ CREATE MESSAGE
   * =======================================================*/
  socket.on('public_message:create', async ({ public_conversation_id, message } = {}) => {
    const messageText = cleanMessage(message);

    // ❌ Validation
    if (!isUuid(public_conversation_id)) {
      return socket.emit('public_message:error', {
        code: 'INVALID_ROOM',
        message: 'Invalid room ID'
      });
    }

    if (!messageText) {
      return socket.emit('public_message:error', {
        code: 'EMPTY_MESSAGE',
        message: 'Message cannot be empty'
      });
    }

    try {
      // ✅ Verify room exists
      const roomExists = await prisma.publicLiveChatConversation.findUnique({
        where: { public_conversation_id },
        select: { public_conversation_id: true }
      });

      if (!roomExists) {
        return socket.emit('public_message:error', {
          code: 'ROOM_NOT_FOUND',
          message: 'Room does not exist'
        });
      }

      // 👤 Determine sender (user or guest)
      const senderData =
        socket.userData.role !== 'guest' && isUuid(socket.userData.user_id)
          ? { sender_user_id: socket.userData.user_id }
          : { sender_guest_id: socket.userData.public_identity_id };

      // 💾 Create message in database
      const created = await prisma.publicLiveChatMessage.create({
        data: {
          public_conversation_id,
          message: messageText,
          ...senderData,
          sender_is_admin: socket.userData.role === 'admin',
          sender_is_bot: false
        },
        include: {
          user: {
            select: { name: true, username: true }
          }
        }
      });

      console.log(`[Public Messages] ✅ Message created: ${created.public_message_id}`);

      // 📣 Broadcast to everyone in room
      io.to(public_conversation_id).emit('public_message:created', {
        public_conversation_id,
        message: formatMessage(created)
      });

      // 🔔 Update unread counts
      await broadcastUnreadCounts(public_conversation_id);

      // 🍪 Remember this room
      cookieUtils.rememberLastRoom(public_conversation_id);
    } catch (error) {
      console.error('[Public Messages] ❌ Create failed:', error.message);
      socket.emit('public_message:error', {
        code: 'DB_FAILURE',
        message: 'Failed to create message'
      });
    }
  });

  /* =========================================================
   * ✏️ EDIT MESSAGE
   * =======================================================*/
  socket.on('public_message:edit', async ({ public_message_id, message } = {}) => {
    const messageText = cleanMessage(message);

    // ❌ Validation
    if (!isUuid(public_message_id)) {
      return socket.emit('public_message:error', {
        code: 'INVALID_MESSAGE_ID',
        message: 'Invalid message ID'
      });
    }

    if (!messageText) {
      return socket.emit('public_message:error', {
        code: 'EMPTY_MESSAGE',
        message: 'Message cannot be empty'
      });
    }

    try {
      // 🔍 Find existing message
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
        return socket.emit('public_message:error', {
          code: 'MESSAGE_NOT_FOUND',
          message: 'Message not found'
        });
      }

      // 🔐 Check permissions
      if (!canModifyMessage(existing)) {
        return socket.emit('public_message:error', {
          code: 'PERMISSION_DENIED',
          message: 'You can only edit your own messages'
        });
      }

      // 💾 Update message
      const updated = await prisma.publicLiveChatMessage.update({
        where: { public_message_id },
        data: { message: messageText }
      });

      console.log(`[Public Messages] ✏️ Message edited: ${updated.public_message_id}`);

      // 📣 Broadcast update
      io.to(updated.public_conversation_id).emit('public_message:edited', {
        public_conversation_id: updated.public_conversation_id,
        public_message_id: updated.public_message_id,
        message: formatMessage(updated)
      });
    } catch (error) {
      console.error('[Public Messages] ❌ Edit failed:', error.message);
      socket.emit('public_message:error', {
        code: 'DB_FAILURE',
        message: 'Failed to edit message'
      });
    }
  });

  /* =========================================================
   * 🗑️ DELETE MESSAGE
   * =======================================================*/
  socket.on('public_message:delete', async ({ public_message_id } = {}) => {
    if (!isUuid(public_message_id)) {
      return socket.emit('public_message:error', {
        code: 'INVALID_MESSAGE_ID',
        message: 'Invalid message ID'
      });
    }

    try {
      // 🔍 Find existing message
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
        return socket.emit('public_message:error', {
          code: 'MESSAGE_NOT_FOUND',
          message: 'Message not found'
        });
      }

      // 🔐 Check permissions
      if (!canModifyMessage(existing)) {
        return socket.emit('public_message:error', {
          code: 'PERMISSION_DENIED',
          message: 'You can only delete your own messages'
        });
      }

      // 💾 Delete message
      await prisma.publicLiveChatMessage.delete({
        where: { public_message_id }
      });

      console.log(`[Public Messages] 🗑️ Message deleted: ${public_message_id}`);

      // 📣 Broadcast deletion
      io.to(existing.public_conversation_id).emit('public_message:deleted', {
        public_conversation_id: existing.public_conversation_id,
        public_message_id
      });

      // 🔔 Update unread counts (if was unread admin message)
      await broadcastUnreadCounts(existing.public_conversation_id);
    } catch (error) {
      console.error('[Public Messages] ❌ Delete failed:', error.message);
      socket.emit('public_message:error', {
        code: 'DB_FAILURE',
        message: 'Failed to delete message'
      });
    }
  });

  /* =========================================================
   * 🔄 REFRESH MESSAGES
   * =======================================================*/
  socket.on('public_message:refresh', async ({ public_conversation_id, limit = 50 } = {}) => {
    if (!isUuid(public_conversation_id)) {
      return socket.emit('public_message:error', {
        code: 'INVALID_ROOM',
        message: 'Invalid room ID'
      });
    }

    try {
      // 📥 Fetch recent messages
      const messages = await prisma.publicLiveChatMessage.findMany({
        where: { public_conversation_id },
        orderBy: { createdAt: 'asc' },
        take: Math.min(limit, 100), // Cap at 100
        include: {
          user: {
            select: { name: true, username: true }
          }
        }
      });

      console.log(
        `[Public Messages] 🔄 Refreshed ${messages.length} messages for room ${public_conversation_id}`
      );

      // 📣 Send to requester only
      socket.emit('public_message:refreshed', {
        public_conversation_id,
        messages: messages.map(formatMessage)
      });
    } catch (error) {
      console.error('[Public Messages] ❌ Refresh failed:', error.message);
      socket.emit('public_message:error', {
        code: 'DB_FAILURE',
        message: 'Failed to refresh messages'
      });
    }
  });

  /* =========================================================
   * ✅ MARK AS READ
   * =======================================================*/
  socket.on('public_message:mark_read', async ({ public_conversation_id } = {}) => {
    if (!isUuid(public_conversation_id)) {
      return socket.emit('public_message:error', {
        code: 'INVALID_ROOM',
        message: 'Invalid room ID'
      });
    }

    try {
      const { role } = socket.userData;
      const now = new Date();

      // 📝 Mark messages as read based on role
      const whereClause =
        role === 'admin'
          ? { sender_is_admin: false, readAt: null } // Admin marks user messages
          : { sender_is_admin: true, readAt: null }; // User marks admin messages

      const updated = await prisma.publicLiveChatMessage.updateMany({
        where: {
          public_conversation_id,
          ...whereClause
        },
        data: { readAt: now }
      });

      console.log(
        `[Public Messages] ✅ Marked ${updated.count} messages as read in room ${public_conversation_id}`
      );

      // 📣 Confirm to sender
      socket.emit('public_message:marked_read', {
        public_conversation_id,
        ok: true,
        count: updated.count
      });

      // 🔔 Update unread counts
      await broadcastUnreadCounts(public_conversation_id);
    } catch (error) {
      console.error('[Public Messages] ❌ Mark read failed:', error.message);
      socket.emit('public_message:error', {
        code: 'DB_FAILURE',
        message: 'Failed to mark messages as read'
      });
    }
  });

  /* =========================================================
   * ⌨️ TYPING INDICATOR
   * =======================================================*/
  socket.on('public_message:typing', ({ public_conversation_id, isTyping = true } = {}) => {
    if (!isUuid(public_conversation_id)) return;

    // 📣 Broadcast typing status to room (except sender)
    socket.to(public_conversation_id).emit('public_message:user_typing', {
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
