/**
 * ================== publicMessageEvents.js ==================
 * 💬 Public Live Chat — Message Management (SIMPLIFIED)
 * -----------------------------------------------------------
 * Purpose: Handle creating, editing, deleting, and reading messages
 *
 * Key Events (simplified, messageEvents-style):
 *   IN:  public_message:create, edit, delete, refresh, mark_read, mark_all_read, typing
 *   OUT: public_message:created, edited, deleted, refreshed,
 *        public_message:marked_read, public_message:all_marked_read,
 *        public_message:user_typing, public_message:unread_admin, public_message:error
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

  // 🔔 Calculate total unread for admin (all unread non-admin messages)
  const countAdminUnread = async () => {
    return await prisma.publicLiveChatMessage.count({
      where: {
        sender_is_admin: false, // Admin cares about user/guest messages
        readAt: null
      }
    });
  };

  // 📣 Broadcast admin global unread (for widget badge)
  const broadcastAdminUnread = async () => {
    try {
      const adminUnread = await countAdminUnread();
      io.to('admins').emit('public_message:unread_admin', {
        total: adminUnread
      });
    } catch (error) {
      console.error('[Public Messages] ❌ Admin unread count failed:', error.message);
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

      // 🔔 Update admin unread badge immediately (admin cares about user/guest messages)
      if (socket.userData.role !== 'admin') {
        await broadcastAdminUnread();
      }

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
    console.log('[Public Messages] ✏️ Incoming edit request:', {
      public_message_id,
      hasMessage: typeof message === 'string',
      socketUser: {
        role: socket.userData?.role,
        user_id: socket.userData?.user_id,
        public_identity_id: socket.userData?.public_identity_id
      }
    });

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
        console.warn('[Public Messages] ⛔ Edit denied by canModifyMessage:', {
          public_message_id,
          existing,
          socketUser: socket.userData
        });
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

      // 🔔 If this was a user/guest message, refresh admin unread badge
      if (!existing.sender_is_admin) {
        await broadcastAdminUnread();
      }
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
      // - admin: mark all unread non-admin messages in this room
      // - user/guest: mark all unread admin messages in this room
      const whereClause =
        role === 'admin'
          ? { sender_is_admin: false, readAt: null }
          : { sender_is_admin: true, readAt: null };

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

      // 🧑‍⚖️ If admin reads this room, also mark the conversation as read
      if (role === 'admin') {
        await prisma.publicLiveChatConversation.updateMany({
          where: {
            public_conversation_id,
            read: false
          },
          data: { read: true }
        });
      }

      // 📣 Confirm to sender
      socket.emit('public_message:marked_read', {
        public_conversation_id,
        ok: true,
        count: updated.count
      });

      // 🔔 Update admin unread badge after any read operation
      await broadcastAdminUnread();
    } catch (error) {
      console.error('[Public Messages] ❌ Mark read failed:', error.message);
      socket.emit('public_message:error', {
        code: 'DB_FAILURE',
        message: 'Failed to mark messages as read'
      });
    }
  });

  /* =========================================================
   * 🧹 MARK ALL AS READ (ADMIN ONLY - Bulk operation)
   * =======================================================*/
  socket.on('public_message:mark_all_read', async () => {
    // 🔐 Only admins can bulk mark all messages as read
    if (socket.userData.role !== 'admin') {
      return socket.emit('public_message:error', {
        code: 'PERMISSION_DENIED',
        message: 'Only admins can mark all messages as read'
      });
    }

    try {
      const now = new Date();

      // 📝 Mark ALL unread non-admin messages as read
      const updated = await prisma.publicLiveChatMessage.updateMany({
        where: {
          sender_is_admin: false,
          readAt: null
        },
        data: { readAt: now }
      });

      console.log(`[Public Messages] 🧹 Admin marked ${updated.count} messages as read globally`);

      // 📣 Confirm to admin
      socket.emit('public_message:all_marked_read', {
        ok: true,
        count: updated.count
      });

      // 🔔 Refresh admin unread badge (should now be zero)
      await broadcastAdminUnread();
    } catch (error) {
      console.error('[Public Messages] ❌ Mark all read failed:', error.message);
      socket.emit('public_message:error', {
        code: 'DB_FAILURE',
        message: 'Failed to mark all messages as read'
      });
    }
  });

  /* =========================================================
   * ✅ MARK ALL CONVERSATIONS + MESSAGES AS READ (USER / GUEST)
   * =======================================================*/
  socket.on('public_message:mark_all_conversations_read_user', async () => {
    const { user_id, public_identity_id, role } = socket.userData;

    // 🔐 Must be authenticated user or guest
    if (role === 'guest' && !public_identity_id) {
      return socket.emit('public_message:error', {
        code: 'UNAUTHORIZED',
        message: 'Guest ID required'
      });
    }

    if (role !== 'guest' && !user_id) {
      return socket.emit('public_message:error', {
        code: 'UNAUTHORIZED',
        message: 'User must be authenticated'
      });
    }

    try {
      // 🔍 Build query based on user type (owner of the conversations)
      const ownerQuery =
        role === 'guest' ? { owner_guest_id: public_identity_id } : { owner_id: user_id };

      // 📋 Get all user's conversations
      const conversations = await prisma.publicLiveChatConversation.findMany({
        where: ownerQuery,
        select: { public_conversation_id: true }
      });

      const conversationIds = conversations.map(
        (conversation) => conversation.public_conversation_id
      );

      if (conversationIds.length === 0) {
        return socket.emit('public_message:all_conversations_marked_read', {
          updated_conversations: 0,
          updated_messages: 0
        });
      }

      // 💾 Mark ALL admin messages in user's conversations as read
      const messagesResult = await prisma.publicLiveChatMessage.updateMany({
        where: {
          public_conversation_id: { in: conversationIds },
          sender_is_admin: true, // 🙋 user/guest only cares about admin messages
          readAt: null
        },
        data: { readAt: new Date() }
      });

      console.log(
        `[Public Messages] ✅ User/guest marked all conversations' admin messages read: ${messagesResult.count} messages`
      );

      // 📣 Emit success to user
      socket.emit('public_message:all_conversations_marked_read', {
        updated_conversations: 0, // 🎯 only messages affected
        updated_messages: messagesResult.count
      });

      // 🔔 User-side unread badges are handled in UI logic; admin badge unaffected here
    } catch (error) {
      console.error(
        '[Public Messages] ❌ Mark all conversations read (user) failed:',
        error.message
      );
      socket.emit('public_message:error', {
        code: 'DB_FAILURE',
        message: 'Failed to mark conversations as read'
      });
    }
  });

  /* =========================================================
   * ✅ MARK ALL CONVERSATIONS + MESSAGES AS READ (ADMIN)
   * =======================================================*/
  socket.on('public_message:mark_all_conversations_read_admin', async () => {
    // 🔐 Only admins can mark everything globally
    if (socket.userData.role !== 'admin') {
      return socket.emit('public_message:error', {
        code: 'UNAUTHORIZED',
        message: 'Admin only'
      });
    }

    try {
      // 💾 Mark ALL messages globally as read (non-admin messages only)
      const messagesResult = await prisma.publicLiveChatMessage.updateMany({
        where: {
          sender_is_admin: false, // Admin cares about user/guest messages
          readAt: null
        },
        data: {
          readAt: new Date(),
          status: 'read'
        }
      });

      // 💾 Mark ALL conversations globally as read
      const conversationsResult = await prisma.publicLiveChatConversation.updateMany({
        where: { read: false },
        data: { read: true }
      });

      console.log(
        `[Public Messages] ✅ Admin marked ALL conversations read: ${conversationsResult.count} convos, ${messagesResult.count} messages`
      );

      // 📣 Emit success to admin
      socket.emit('public_message:all_conversations_marked_read', {
        updated_conversations: conversationsResult.count,
        updated_messages: messagesResult.count
      });

      // 🔔 Refresh admin unread badge (should now be zero)
      await broadcastAdminUnread();
    } catch (error) {
      console.error(
        '[Public Messages] ❌ Mark all conversations read (admin) failed:',
        error.message
      );
      socket.emit('public_message:error', {
        code: 'DB_FAILURE',
        message: 'Failed to mark all conversations as read'
      });
    }
  });
}
