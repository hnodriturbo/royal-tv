// 🚪 src/server/events/roomEvents.js
/**
 * registerRoomEvents
 * -----------------
 * 1️⃣ Live‐chat rooms (dashboard users):
 *    • join_room           → track & broadcast liveChat participants
 *    • delete_conversation → owner/admin only, cascades via Prisma
 *
 * 2️⃣ Bubble‐chat rooms (support widget):
 *    • create_support_room → user spins up a support convo
 *    • join_bubble_room    → track & broadcast bubbleChat participants
 */
export default function registerRoomEvents(io, socket, prisma, globalState) {
  // ─── 1️⃣ LIVE CHAT ───────────────────────────────────────────────
  socket.on('join_room', (conversation_id) => {
    if (!conversation_id) return;
    socket.join(conversation_id);

    globalState.activeUsersInRoom[conversation_id] ||= [];
    const isAlreadyInRoom = globalState.activeUsersInRoom[conversation_id].some(
      (u) => u.user_id === socket.userData.user_id,
    );

    if (!isAlreadyInRoom) {
      globalState.activeUsersInRoom[conversation_id].push({
        ...socket.userData,
      });
    }

    io.to(conversation_id).emit('room_users_update', {
      conversation_id,
      users: globalState.activeUsersInRoom[conversation_id],
    });

    // ✅ Server log when joining live room
    console.log(
      `🚪 [LiveRoom] ${socket.userData.name} joined room: ${conversation_id}`,
    );
  });

  socket.on('delete_conversation', async ({ conversation_id }) => {
    try {
      // Allow owner OR admin to delete
      const convo = await prisma.liveChatConversation.findUnique({
        where: { conversation_id },
        select: { user_id: true },
      });
      const isOwner = convo?.user_id === socket.userData.user_id;
      const isAdmin = socket.userData.role === 'admin';
      if (!isOwner && !isAdmin) return;

      // Single call: conversation deletion cascades messages
      await prisma.liveChatConversation.delete({
        where: { conversation_id },
      });

      io.to(conversation_id).emit('conversation_deleted', { conversation_id });
      io.emit('refresh_conversation_lists');

      // ✅ Server log when deleting conversation
      console.log(`🗑️ [DeleteConversation]: ${conversation_id}`);
    } catch (err) {
      console.error('❌ LiveChat delete convo failed', err);
    }
  });

  // ─── 2️⃣ NORMAL ROOM (Bubble Chat) ──────────────────────────────
  socket.on('create_support_room', async () => {
    try {
      const { user_id, role, name } = socket.userData;
      const convo = await prisma.bubbleChatConversation.create({
        data: {
          subject: 'Bubble Chat Support Request',
          ...(role !== 'guest' ? { user_id } : {}),
        },
      });
      const cid = convo.conversation_id;

      socket.join(cid);
      globalState.activeUsersInBubbleRoom[cid] = [{ ...socket.userData }];

      io.emit('support_room_created', {
        conversation_id: cid,
        user_id,
        name,
        role,
      });
      socket.emit('support_room_ready', { conversation_id: cid });

      // ✅ Server log for support room creation
      console.log(`➕ [BubbleRoom Created]: ${cid} by ${name}`);
    } catch (err) {
      console.error('❌ Support room creation error', err);
    }
  });

  socket.on('join_bubble_room', (conversation_id) => {
    if (!conversation_id) return;
    socket.join(conversation_id);

    globalState.activeUsersInBubbleRoom[conversation_id] ||= [];
    const isAlreadyInRoom = globalState.activeUsersInBubbleRoom[
      conversation_id
    ].some((u) => u.user_id === socket.userData.user_id);

    if (!isAlreadyInRoom) {
      globalState.activeUsersInBubbleRoom[conversation_id].push({
        ...socket.userData,
      });
    }

    io.to(conversation_id).emit('room_users_update', {
      conversation_id,
      users: globalState.activeUsersInBubbleRoom[conversation_id],
    });

    // ✅ Server log for bubble room join
    console.log(
      `🧊 [BubbleRoom] ${socket.userData.name} joined room: ${conversation_id}`,
    );
  });
}
