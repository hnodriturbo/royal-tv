// 💬 src/server/events/messageEvents.js
/**
 * registerMessageEvents
 * ---------------------
 * Live-chat messages:
 *   • send_message    → create & broadcast, update unread
 *   • edit_message    → owner/admin
 *   • delete_message  → owner/admin (soft delete)
 *
 * Bubble-chat messages:
 *   • send_bubble_message → create & broadcast support-widget chat
 *
 * Both flows include full sender tracking (user_id or guest_id).
 */

export default function registerMessageEvents(io, socket, prisma) {
  // ─── 1️⃣ LIVE-CHAT: SEND ────────────────────────────────────────
  socket.on('send_message', async ({ conversation_id, message }) => {
    if (!conversation_id || !message?.trim()) return;

    const isAdmin = socket.userData.role === 'admin';
    const isGuest = socket.userData.role === 'guest';
    const senderId = socket.userData.user_id;

    const data = {
      conversation_id,
      message: message.trim(),
      sender_is_admin: isAdmin,
      status: 'sent',
      // exactly one of these:
      user_id: isGuest ? null : senderId,
      guest_id: isGuest ? senderId : null
    };

    let saved;
    try {
      saved = await prisma.chatType.create({ data });
    } catch (err) {
      console.error('❌ LiveChat create failed', err);
      return;
    }

    // broadcast to everyone in room
    io.to(conversation_id).emit('receive_message', {
      ...saved,
      name: socket.userData.name,
      role: socket.userData.role
    });

    // if admin sent it, update that user’s unread badge
    if (isAdmin) {
      try {
        const userUnread = await prisma.message.count({
          where: { conversation_id, sender_is_admin: true, status: 'sent' }
        });
        io.to(senderId).emit('unread_count', { unreadCount: userUnread });
      } catch (e) {
        console.error('❌ live unread count failed', e);
      }
    }

    // always update global admin unread badge
    try {
      const adminUnread = await prisma.liveChatMessage.count({
        where: { status: 'sent', sender_is_admin: false }
      });
      io.emit('admin_unread_count', adminUnread);
    } catch (e) {
      console.error('❌ admin unread count failed', e);
    }
    console.log(`[isAdmin: ${isAdmin}]: received message and updated the adminUnreadCount`);
  });

  // ─── 2️⃣ LIVE-CHAT: EDIT ─────────────────────────────────────────
  socket.on('edit_message', async ({ message_id, conversation_id, message }) => {
    if (!message?.trim()) return;
    try {
      const orig = await prisma.liveChatMessage.findUnique({
        where: { message_id },
        select: { user_id: true }
      });
      const isOwner = orig?.user_id === socket.userData.user_id;
      const isAdmin = socket.userData.role === 'admin';
      if (!isOwner && !isAdmin) return;

      const updated = await prisma.liveChatMessage.update({
        where: { message_id },
        data: {
          message: message.trim(),
          status: 'edited',
          updatedAt: new Date()
        }
      });
      io.to(conversation_id).emit('message_edited', updated);
    } catch (err) {
      console.error('❌ LiveChat edit failed', err);
    }
  });

  // ─── 3️⃣ LIVE-CHAT: DELETE ───────────────────────────────────────
  socket.on('delete_message', async ({ message_id, conversation_id }) => {
    try {
      const orig = await prisma.liveChatMessage.findUnique({
        where: { message_id },
        select: { user_id: true }
      });
      const isOwner = orig?.user_id === socket.userData.user_id;
      const isAdmin = socket.userData.role === 'admin';
      if (!isOwner && !isAdmin) return;

      await prisma.liveChatMessage.update({
        where: { message_id },
        data: { status: 'deleted', updatedAt: new Date() }
      });
      io.to(conversation_id).emit('message_deleted', { message_id });
    } catch (err) {
      console.error('❌ LiveChat delete failed', err);
    }
  });

  // ─── 4️⃣ BUBBLE-CHAT: SEND ───────────────────────────────────────
  socket.on('send_bubble_message', async ({ conversation_id, message }) => {
    if (!conversation_id || !message?.trim()) return;

    const isAdmin = socket.userData.role === 'admin';
    const isGuest = socket.userData.role === 'guest';
    const senderId = socket.userData.user_id;

    const data = {
      conversation_id,
      message: message.trim(),
      sender_is_admin: isAdmin,
      status: 'sent',
      user_id: isGuest ? null : senderId,
      guest_id: isGuest ? senderId : null
    };

    let saved;
    try {
      saved = await prisma.bubbleChatMessage.create({ data });
    } catch (err) {
      console.error('❌ BubbleChat create failed', err);
      return;
    }

    io.to(conversation_id).emit('receive_bubble_message', {
      ...saved,
      name: socket.userData.name,
      role: socket.userData.role
    });
  });

  /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🆕 ADD THIS INSTEAD  – place anywhere after the DELETE handler
   Handles client → 'mark_read' to clear unread flags in a conversation
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
  socket.on('mark_read', async ({ conversation_id }) => {
    try {
      if (!conversation_id) return;

      // 1) Mark all USER‑sent messages in this convo as read
      await prisma.liveChatMessage.updateMany({
        where: {
          conversation_id,
          sender_is_admin: false,
          status: 'sent'
        },
        data: { status: 'read', readAt: new Date() }
      });

      // 2) Tell *this* admin how many unread remain for that user
      const unreadCount = await prisma.liveChatMessage.count({
        where: { conversation_id, sender_is_admin: true, status: 'sent' }
      });
      socket.emit('unread_count', { unreadCount });

      // 3) Re‑calculate global admin badge
      const adminUnread = await prisma.liveChatMessage.count({
        where: { status: 'sent', sender_is_admin: false }
      });
      io.emit('admin_unread_count', adminUnread);

      console.log(`📖 Marked read for ${conversation_id}`);
    } catch (err) {
      console.error('❌ mark_read failed', err);
    }
  });
}
