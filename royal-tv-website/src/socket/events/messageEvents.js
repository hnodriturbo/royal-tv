// 💬 messageEvents.js – Real-time LiveChat & BubbleChat (Royal-TV)
// -----------------------------------------------------------
// Handles send, edit, delete, and read for BOTH chat types (live/bubble)
// All chat mutations are performed via Prisma here for real-time socket chat.

export default function registerMessageEvents(io, socket, prisma) {
  // Helper to get the correct Prisma model
  const getModel = (type) =>
    type === 'bubble'
      ? { convo: prisma.bubbleChatConversation, msg: prisma.bubbleChatMessage }
      : { convo: prisma.liveChatConversation, msg: prisma.liveChatMessage };

  // 1️⃣ Send message (type, conversation_id, message)
  socket.on('send_message', async ({ type = 'live', conversation_id, message }) => {
    if (!conversation_id || !message?.trim()) return;
    const { msg, convo } = getModel(type);
    const isAdmin = socket.userData.role === 'admin';
    const isGuest = socket.userData.role === 'guest';
    const senderId = socket.userData.user_id;

    // Find the conversation's owner/recipient
    const conversation = await convo.findUnique({
      where: { conversation_id },
      select: { user_id: true }
    });

    // Use both sender_id (who sent it) and recipient_id (who owns conversation)
    const data = {
      conversation_id,
      sender_id: senderId,
      recipient_id: conversation.user_id, // always the owner/user of the conversation
      message: message.trim(),
      sender_is_admin: isAdmin,
      status: 'sent',
      guest_id: isGuest ? senderId : null
    };

    try {
      const saved = await msg.create({ data });
      io.to(conversation_id).emit('receive_message', {
        ...saved,
        name: socket.userData.name,
        role: socket.userData.role,
        type
      });
      // Add unread badge updates, mark read, etc. as needed
      console.log(
        `[${type}] message sent (admin: ${isAdmin}, guest: ${isGuest}) → ${saved.message_id}`
      );
    } catch (err) {
      console.error(`❌ [${type}] send_message failed`, err);
    }
  });

  // 2️⃣ Edit message (type, conversation_id, message_id, message)
  socket.on('edit_message', async ({ type = 'live', conversation_id, message_id, message }) => {
    if (!message?.trim()) return;
    const { msg } = getModel(type);
    const senderId = socket.userData.user_id;
    try {
      const orig = await msg.findUnique({ where: { message_id }, select: { sender_id: true } });
      if (!orig) return;
      // Only sender or admin can edit
      const isSender = orig.sender_id === senderId;
      const isAdmin = socket.userData.role === 'admin';
      if (!isSender && !isAdmin) return;
      const updated = await msg.update({
        where: { message_id },
        data: { message: message.trim(), status: 'edited', updatedAt: new Date() }
      });
      io.to(conversation_id).emit('message_edited', { ...updated, type });
      console.log(`[${type}] message edited → ${message_id}`);
    } catch (err) {
      console.error(`❌ [${type}] edit_message failed`, err);
    }
  });

  // 3️⃣ Delete message (type, conversation_id, message_id)
  socket.on('delete_message', async ({ type = 'live', conversation_id, message_id }) => {
    const { msg } = getModel(type);
    const senderId = socket.userData.user_id;
    try {
      const orig = await msg.findUnique({ where: { message_id }, select: { sender_id: true } });
      if (!orig) return;
      const isSender = orig.sender_id === senderId;
      const isAdmin = socket.userData.role === 'admin';
      if (!isSender && !isAdmin) return;
      await msg.delete({ where: { message_id } });
      io.to(conversation_id).emit('message_deleted', { message_id, type });
      console.log(`[${type}] message deleted → ${message_id}`);
    } catch (err) {
      console.error(`❌ [${type}] delete_message failed`, err);
    }
  });

  // 4️⃣ Mark read (type, id) – can be for messages or conversations
  socket.on('mark_read', async ({ type = 'message', id }) => {
    // This part can use Prisma to mark messages/convos as read if you need real-time badges
    try {
      if (!id) return;
      // ... (Your mark read logic as needed)
    } catch (err) {
      console.error('❌ mark_read failed', err);
    }
  });
}
