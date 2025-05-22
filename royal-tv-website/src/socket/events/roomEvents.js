// 🚪 roomEvents.js – Unified for LiveChat and BubbleChat (Royal-TV)
/**
 * -------------------------------------------------------------
 * Handles joining, creating, deleting conversation rooms for:
 *   • liveChat ('live')     – authenticated support chat
 *   • bubbleChat ('bubble') – public support widget
 *
 * EVENTS:
 *   • join_room                // User joins any conversation (bubble/live)
 *   • create_support_room      // Create a bubble chat (public widget)
 *   • delete_conversation      // Delete a conversation (owner/admin)
 *   • room_users_update        // Broadcasts updated user list for a room
 */

export default function registerRoomEvents(io, socket, prisma, globalState) {
  // 🧱 Get correct registry for live/bubble chat
  const getRoomRegistry = (type) =>
    type === 'bubble' ? globalState.activeUsersInBubbleRoom : globalState.activeUsersInRoom;

  // 1️⃣ Unified room join handler (used for both live & bubble)
  socket.on('join_room', ({ type = 'live', conversation_id }) => {
    // 🚦 Ignore bad IDs
    if (!conversation_id) return;

    // 🏷️ Find registry for this chat type
    const roomRegistry = getRoomRegistry(type);

    // 📋 Register or fetch the user list for this conversation
    roomRegistry[conversation_id] ||= [];

    // 🔎 Check if user is already in this room
    const alreadyInRoom = roomRegistry[conversation_id].some(
      (u) => u.user_id === socket.userData.user_id
    );

    // ➕ If not, add user to the room registry
    if (!alreadyInRoom) {
      roomRegistry[conversation_id].push({ ...socket.userData });
    }

    // 👋 Join the actual socket.io room for broadcasts
    socket.join(conversation_id);

    // 📡 Notify all clients in the room about the user list
    io.to(conversation_id).emit('room_users_update', {
      conversation_id,
      users: roomRegistry[conversation_id]
    });

    // 📝 Debug log
    console.log(
      `🚪 [${type === 'bubble' ? 'BubbleRoom' : 'LiveRoom'}] ${socket.userData.name} joined room: ${conversation_id}`
    );
  });

  // 2️⃣ Create a new bubble chat support room (public chat widget)
  socket.on('create_support_room', async () => {
    try {
      const { user_id, role, name } = socket.userData;
      // 🟢 Guests have no user_id
      const data = {
        subject: 'Bubble Chat Support Request',
        ...(role !== 'guest' ? { user_id } : {})
      };
      // 🏗️ Create conversation in DB
      const convo = await prisma.bubbleChatConversation.create({ data });
      const cid = convo.conversation_id;

      // ➕ Register user in room & join socket.io room
      globalState.activeUsersInBubbleRoom[cid] = [{ ...socket.userData }];
      socket.join(cid);

      // 📡 Notify all clients that a new support room exists
      io.emit('support_room_created', {
        conversation_id: cid,
        user_id,
        name,
        role
      });

      // ✅ Tell this client the room is ready (to start chatting)
      socket.emit('support_room_ready', { conversation_id: cid });

      // 📝 Debug log
      console.log(`➕ [BubbleRoom Created]: ${cid} by ${name}`);
    } catch (err) {
      console.error('❌ Support room creation error', err);
    }
  });

  // 3️⃣ Unified conversation delete (live or bubble)
  socket.on('delete_conversation', async ({ conversation_id, chatType = 'live' }) => {
    try {
      // 📦 Choose correct model by type
      const model =
        chatType === 'bubble' ? prisma.bubbleChatConversation : prisma.liveChatConversation;

      // 🧑‍⚖️ Only owner or admin can delete
      const convo = await model.findUnique({
        where: { conversation_id },
        select: { user_id: true }
      });

      const isOwner = convo?.user_id === socket.userData.user_id;
      const isAdmin = socket.userData.role === 'admin';
      if (!isOwner && !isAdmin) return;

      // 🗑️ Delete the conversation (cascade deletes messages)
      await model.delete({ where: { conversation_id } });

      // 📡 Notify all clients in the room
      io.to(conversation_id).emit('conversation_deleted', { conversation_id });
      // 📡 Notify all clients to refresh conversation lists
      io.emit('refresh_conversation_lists');

      // 📝 Debug log
      console.log(`🗑️ [DeleteConversation]: ${conversation_id} (type: ${chatType})`);
    } catch (err) {
      console.error('❌ Conversation delete failed', err);
    }
  });
}
