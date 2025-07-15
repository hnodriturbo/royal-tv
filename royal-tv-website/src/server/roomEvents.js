// 🚪 roomEvents.js – LiveChat Only (bubble logic removed, dev-friendly multi-join allowed)
/**
 * Handles joining and creating conversation rooms for liveChat only.
 * Allows ANY number of admins and ANY number of users per room!
 */

import prisma from '../lib/prisma.js';

export default function registerRoomEvents(io, socket, globalState) {
  // 1️⃣ Room join handler: allow anyone to join, multiple times (dev-friendly)
  socket.on('join_room', async ({ conversation_id }) => {
    if (!conversation_id) return;
    const roomRegistry = globalState.activeUsersInLiveRoom;
    roomRegistry[conversation_id] ||= [];

    // Remove any previous entries for this user_id (to prevent duplicates on reload)
    roomRegistry[conversation_id] = roomRegistry[conversation_id].filter(
      (user) => user.user_id !== socket.userData.user_id
    );

    // Add this user (each join is idempotent)
    roomRegistry[conversation_id].push({ ...socket.userData });

    socket.join(conversation_id); // 🚪 Join the socket.io room

    // Emit room update to all in the room
    io.to(conversation_id).emit('room_users_update', {
      conversation_id,
      users: roomRegistry[conversation_id]
    });

    // 📝 Log join event (no more chatType distinction)
    console.log(`🚪 [LiveRoom] ${socket.userData.name} joined room: ${conversation_id}`);
  });

  // 2️⃣ Conversation creation (admin/user triggers for user as owner)
  socket.on('create_chat_room', async ({ subject, user_id }) => {
    try {
      const conversationModel = prisma.liveChatConversation;
      const roomRegistry = globalState.activeUsersInLiveRoom;

      // 🛡️ Always require user_id (recipient, the real owner!)
      if (!user_id) {
        socket.emit('room_creation_error', { error: 'Missing user_id for conversation owner.' });
        return;
      }

      // 🛡️ Only allow real users as conversation owners!
      const ownerUser = await prisma.user.findUnique({
        where: { user_id },
        select: { role: true }
      });
      if (!ownerUser || ownerUser.role !== 'user') {
        socket.emit('room_creation_error', { error: 'Conversation owner must be a real user.' });
        return;
      }

      // 📝 Prepare conversation data: owner is always the recipient
      const data = {
        subject: subject || 'Live Chat',
        owner: { connect: { user_id } }
      };

      const convo = await conversationModel.create({ data });
      const convo_id = convo.conversation_id;

      // Register the creator (admin or user) as present in the room
      roomRegistry[convo_id] = [{ ...socket.userData }];
      socket.join(convo_id);

      io.emit('live_chat_room_created', {
        conversation_id: convo_id,
        owner_id: user_id,
        chatType: 'live'
      });
      socket.emit('live_chat_room_ready', { conversation_id: convo_id, chatType: 'live' });

      console.log(
        `➕ [LiveChatRoom Created]: ${convo_id} by ${socket.userData.name} for user ${user_id}`
      );
    } catch (err) {
      console.error(`❌ [LiveChatRoom creation error]`, err);
      socket.emit('room_creation_error', { error: 'Internal server error' });
    }
  });
}
