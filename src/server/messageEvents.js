/**
 *   ============= messageEvents.js =============
 * 💬
 * SOCKET.IO EVENT HANDLERS FOR CHAT MESSAGES (LIVE ONLY)
 * - Handles sending, editing, deleting, and marking messages as read.
 * - Uses Prisma liveChat models directly (bubble & getChatModel removed)
 * ==============================================
 */

import logger from '../lib/core/logger.js';
import dayjs from 'dayjs'; // 🗓️ For consistent dates (optional)
import prisma from '../lib/core/prisma.js'; // 📦 Prisma client singleton

// 🧪 UUID checker – always validate IDs from the outside!
const isUuid = (val) => typeof val === 'string' && /^[0-9a-fA-F-]{36}$/.test(val);

export default function registerMessageEvents(io, socket) {
  // 📨 1️⃣ New message sent from client!
  socket.on('send_message', async ({ conversation_id, message }) => {
    // 🕵️‍♂️ Debug incoming payload – see what's really coming in!
    logger.log('[DEBUG] send_message payload:', { conversation_id, message });

    // 🛡️ Never trust: Validate UUID!
    if (!isUuid(conversation_id)) {
      logger.error('[ERROR] Invalid conversation_id (not a UUID):', conversation_id);
      socket.emit('send_message_error', { error: 'Invalid conversation ID!' });
      return;
    }
    if (!message?.trim()) return; // 🚦 Don't allow empty messages

    // 💬 Insert the new message into the liveChatMessage model
    const messageModel = prisma.liveChatMessage;
    const senderId = socket.userData.user_id; // 👤 Who is sending?
    const isAdmin = socket.userData.role === 'admin'; // 👑 Admin check

    const data = {
      conversation_id,
      sender_id: senderId,
      message: message.trim(),
      sender_is_admin: isAdmin,
      status: 'sent',
      createdAt: dayjs().toDate()
    };

    try {
      const saved = await messageModel.create({ data }); // 📦 Store in DB!
      io.to(conversation_id).emit('receive_message', {
        ...saved,
        name: socket.userData.name,
        role: socket.userData.role
      });
      logger.log(`[live] 📨 Message sent: ${saved.message_id}`); // 🟢 Confirm send!
    } catch (err) {
      logger.error(`[live] ❌ send_message failed`, err); // 🔥 Show any DB error
      socket.emit('send_message_error', { error: 'Failed to send message' }); // 🔴 Notify UI
    }
  });

  // 📝 2️⃣ Edit message event (admin/user can edit own messages)
  socket.on('edit_message', async ({ conversation_id, message_id, message }) => {
    // 🛡️ Make sure UUID is valid!
    if (!isUuid(conversation_id)) {
      logger.error('[ERROR] Invalid conversation_id (edit_message):', conversation_id);
      return;
    }
    if (!message?.trim()) return; // 🛑 Don't edit to empty string!
    const messageModel = prisma.liveChatMessage;
    const senderId = socket.userData.user_id;
    const isAdmin = socket.userData.role === 'admin';

    try {
      const orig = await messageModel.findUnique({ where: { message_id } }); // 🔍 Find orig msg
      if (!orig || (orig.sender_id !== senderId && !isAdmin)) {
        logger.warn(`⛔ Edit denied: ${message_id}`); // ❌ Not allowed!
        return;
      }

      // ✏️ Actually update the message in DB
      const updated = await messageModel.update({
        where: { message_id },
        data: { message: message.trim(), status: 'edited', updatedAt: dayjs().toDate() }
      });
      io.to(conversation_id).emit('message_edited', { ...updated }); // 🔄 Notify all
      logger.log(`[live] ✏️ Message edited: ${message_id}`);
    } catch (err) {
      logger.error(`[live] ❌ edit_message failed`, err);
    }
  });

  // 🗑️ 3️⃣ Delete a message (only own, or admin can!)
  socket.on('delete_message', async ({ conversation_id, message_id }) => {
    if (!isUuid(conversation_id)) {
      logger.error('[ERROR] Invalid conversation_id (delete_message):', conversation_id);
      return;
    }
    const messageModel = prisma.liveChatMessage;
    const senderUserId = socket.userData.user_id;
    const isAdmin = socket.userData.role === 'admin';

    try {
      const originalMessage = await messageModel.findUnique({ where: { message_id } });

      // 🛑 Only sender or admin can delete
      if (!originalMessage || (originalMessage.sender_id !== senderUserId && !isAdmin)) {
        logger.warn(`⛔ Delete denied: ${message_id}`);
        return;
      }

      await messageModel.delete({ where: { message_id } }); // 💣 Remove from DB

      io.to(conversation_id).emit('message_deleted', {
        message_id,
        conversation_id
      });

      logger.log(`[live] 🗑️ Message deleted: ${message_id}`); // ✅ Log it
    } catch (error) {
      logger.error(`[live] ❌ delete_message failed`, error);
    }
  });

  // 📖 4️⃣ Mark all messages as read for this user
  socket.on('mark_read', async ({ conversation_id }) => {
    if (!isUuid(conversation_id)) {
      logger.error('[ERROR] Invalid conversation_id (mark_read):', conversation_id);
      return;
    }
    const conversationModel = prisma.liveChatConversation;
    const messageModel = prisma.liveChatMessage;

    try {
      const userId = socket.userData.user_id;

      // ✅ Mark all unread as "read"
      await messageModel.updateMany({
        where: {
          conversation_id,
          sender_id: { not: userId },
          status: 'sent'
        },
        data: {
          status: 'read',
          readAt: dayjs().toDate()
        }
      });

      // ✅ Update conversation for read badge
      await conversationModel.update({
        where: { conversation_id },
        data: { read: true }
      });

      // 🟦 Count remaining unread
      const unreadCount = await messageModel.count({
        where: {
          conversation_id,
          sender_id: { not: userId },
          status: 'sent'
        }
      });

      // 🔔 Send new unread count just for this socket
      socket.emit('unread_count_update', { conversation_id, unreadCount });

      logger.log(
        `[live] 📖 All messages marked read for user ${userId} in conversation: ${conversation_id}`
      );
    } catch (err) {
      logger.error('❌ mark_read failed', err);
    }
  });

  // 👀 5️⃣ Typing indicator for real-time feedback
  socket.on('typing', ({ conversation_id, isTyping }) => {
    if (!isUuid(conversation_id)) {
      logger.error('[ERROR] Invalid conversation_id (typing):', conversation_id);
      return;
    }
    const { name, user_id, role } = socket.userData;

    // 🟡 Tell everyone else in the room that someone is typing!
    socket.to(conversation_id).emit('user_typing', {
      conversation_id,
      isTyping,
      name,
      user_id,
      role
    });
  });

  // 🔄 6️⃣ Refresh all messages for a room
  socket.on('refresh_messages', async ({ conversation_id }) => {
    if (!isUuid(conversation_id)) {
      logger.error('[ERROR] Invalid conversation_id (refresh_messages):', conversation_id);
      return;
    }
    const messageModel = prisma.liveChatMessage;

    try {
      const messages = await messageModel.findMany({
        where: { conversation_id },
        orderBy: { createdAt: 'asc' }
      });

      // 📬 Return the whole new list just for the socket requesting
      socket.emit('messages_refreshed', {
        conversation_id,
        messages
      });

      logger.log(`[live] 🔄 Messages refreshed for conversation: ${conversation_id}`);
    } catch (err) {
      logger.error(`[live] ❌ refresh_messages failed`, err);
    }
  });
}
