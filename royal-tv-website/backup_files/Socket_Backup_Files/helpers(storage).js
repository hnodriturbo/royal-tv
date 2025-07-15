/**
 *   ==================== helpers.js ====================
 * 🧰
 * SOCKET UTILITY FUNCTIONS:
 * - Used only by socket event handlers (backend/server-side)
 * ======================================================
 */

import prisma from '../prisma.js';

// 🔒 Make a unique room name for a conversation
export function getConversationRoomName(conversation_id, chatType = 'live') {
  // Helper for correct Prisma model
  const getModel = (chatType) =>
    type === 'bubble'
      ? { convo: prisma.bubbleChatConversation, msg: prisma.bubbleChatMessage }
      : { convo: prisma.liveChatConversation, msg: prisma.liveChatMessage };

  // 👥 Ensures unique room name per chat/convo
  return `${chatType}_conversation_${conversation_id}`;
}

// 🕵️ Check if user is admin
export function isAdminUser(user) {
  return !!user && user.is_admin === true;
}
// 🧹 Normalize socket user data
export function normalizeSocketUser(user) {
  // 🚿 Strips sensitive fields and normalizes shape
  return {
    user_id: user.user_id,
    name: user.name,
    isAdmin: !!user.is_admin,
    avatar: user.avatar_url
    // ...other public fields
  };
}

// 🔄 Refresh conversation (after add/edit/delete)
socket.on('refresh_message', async ({ conversation_id }) => {
  try {
    // 🗂️ Fetch latest conversation with all messages
    const conversation = await conversationModel.findUnique({
      where: { conversation_id },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      }
    });
    // 🚀 Emit updated conversation
    io.to(conversation_id).emit('conversation_updated', conversation);
  } catch (error) {
    // ⚠️ Handle error
    socket.emit('error', { message: 'Failed to refresh conversation', error });
  }
});

// 🟢 Emit wrapper (with ack/callback support)
export function safeEmit(socket, event, data, callback) {
  try {
    socket.emit(event, data);
    if (callback) callback(null, data);
  } catch (err) {
    if (callback) callback(err);
  }
}
