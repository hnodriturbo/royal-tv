/**
 * ================== publicRoomEvents.js ==================
 * 🏠 Public Live Chat — Room management (lobby + per-conversation)
 * --------------------------------------------------------------
 * Inbound events:
 *   • public_join_lobby
 *   • public_leave_lobby
 *   • public_create_chat_room  { subject?: string, owner_user_id?: string | null }
 *   • public_join_room         { public_conversation_id: string }
 *   • public_leave_room        { public_conversation_id: string }
 *
 * Outbound emits:
 *   • public_room_users_update
 *       - LOBBY: { room_id, users }
 *       - CONVERSATION: { public_conversation_id, users }
 *   • public_live_chat_room_created { public_conversation_id, owner_id }
 *   • public_live_chat_room_ready   { public_conversation_id }
 *
 * Notes:
 *   • Presence registry lives in globalState.activeUsersInPublicRoom (shared room).
 *   • Lobby presence lives in globalState.publicLobby (shared room array).
 *   • Per-user room already exists from the connection handler (join(user_id)).
 *   • Admin-online gating will be handled later in UI/hooks (not here).
 */

import prisma from '../lib/core/prisma.js'; // 🧱 Prisma client

// 🧪 UUID verification checker
const isUuid = (value) => typeof value === 'string' && /^[0-9a-fA-F-]{36}$/.test(value);

// 🏠 Consistent lobby room name
const PUBLIC_LOBBY_ROOM = 'public_live_chat_lobby';

export default function registerPublicRoomEvents(io, socket, globalState) {
  /* --------------------------------------------------------------------------------------- */
  // 🗂️ Helper: 🗺️ Ensure shared rooms exist (arrays for lists; object-of-arrays for rooms)
  globalState.publicLobby ||= []; // 🏠 array of user snapshots
  globalState.activeUsersInPublicRoom ||= {}; // 💬 { [convoId]: userData[] }

  /* --------------------------------------------------------------------------------------- */

  // 🚪 Join the public lobby (widget opened)
  socket.on('public_join_lobby', () => {
    // 🧹 Remove any previous snapshot for this user_id (multi-tab/reconnect safe)
    globalState.publicLobby = globalState.publicLobby.filter(
      (existingUser) => existingUser.user_id !== socket.userData.user_id
    );
    // ➕ Add fresh user to the lobby
    globalState.publicLobby.push({ ...socket.userData });

    // 🚪 Join lobby room
    socket.join(PUBLIC_LOBBY_ROOM); // ✅ Join the publicLobby

    // 📣 Broadcast current lobby
    io.to(PUBLIC_LOBBY_ROOM).emit('public_room_users_update', {
      room_id: PUBLIC_LOBBY_ROOM, // ✅ Use room_id for lobby
      users: globalState.publicLobby
    });

    // 📝 log the event
    console.log(
      `🏠 [SOCKET PublicRoom] Lobby join: ${socket.userData.user_id} Role: ${socket.userData.role}`
    );
  });

  // 🚪 Leave the public lobby (widget closed)
  socket.on('public_leave_lobby', () => {
    // 🧹 Remove user with filtering
    globalState.publicLobby = globalState.publicLobby.filter(
      (existingUser) => existingUser.user_id !== socket.userData.user_id
    );

    // 🚪 Leave lobby room
    socket.leave(PUBLIC_LOBBY_ROOM);

    // 📣 Broadcast current lobby roster (LOBBY PAYLOAD)
    io.to(PUBLIC_LOBBY_ROOM).emit('public_room_users_update', {
      room_id: PUBLIC_LOBBY_ROOM,
      users: globalState.publicLobby
    });

    // 📝 Log the event
    console.log(
      `🏠 [SOCKET PublicRoom] Lobby leave: ${socket.userData.name} (${socket.userData.role}) ` +
        `user_id/guest_id: ${socket.userData.user_id}`
    );
  });

  /* --------------------------------------------------------------------------------------- */

  // ➕ Create a new public conversation (owner optional for logged-in user
  socket.on('public_create_chat_room', async ({ subject, owner_user_id } = {}) => {
    try {
      // 📝 Prepare conversation data (owner connect only when provided)
      const createdData = {
        subject: subject || 'Public Live Chat' // 📌 Subject of the conversation fallbacks to english
      };

      // 🔐 If owner_user_id is provided, ensure it's a real User (not a guest)
      if (owner_user_id && isUuid(owner_user_id)) {
        const owner = await prisma.user.findUnique({
          where: { user_id: owner_user_id },
          select: { user_id: true, role: true }
        });

        // ✅ If Real user: connect relation
        if (owner && owner.role !== 'guest') {
          createdData.owner = { connect: { user_id: owner_user_id } };
        } else {
          // 🚫 Provided id is guest or not found → ignore owner_user_id
          console.warn(`[SOCKET PublicRoom] Ignoring invalid owner_user_id: ${owner_user_id}`);
        }
      }
      // 👤 If the creator is a guest, optionally stamp guest ownership for auditing
      //    (owner is optional — keep or remove this block based on your needs)
      if (!createdData.owner && socket.userData.role === 'guest') {
        // 🪪 Use stable cookie identity (better than socket-scoped guest-uid)
        createdData.owner_guest_id = socket.userData.public_identity_id;
      }

      // 💾 Create conversation (DB generates public_conversation_id)
      const conversation = await prisma.publicLiveChatConversation.create({
        createdData,
        select: { public_conversation_id: true, owner_id: true }
      });

      // 🧠 Extract the public_conversation_id from created conversation
      const public_conversation_id = conversation.public_conversation_id;

      // 🗂️ Ensure room list exists & add this user (de-duped)
      const list = (globalState.activeUsersInPublicRoom[public_conversation_id] ||= []);
      const filteredList = list.filter((user) => user.user_id !== socket.userData.user_id);
      filteredList.push({ ...socket.userData });
      globalState.activeUsersInPublicRoom[public_conversation_id] = filteredList;

      // 🚪 Join the new room
      socket.join(public_conversation_id);

      // 📣 Broadvast and notify creator
      io.emit('public_live_chat_room_created', {
        public_conversation_id,
        owner_id: conversation.owner_id || null
      });
      socket.emit('public_live_chat_room_ready', { public_conversation_id });

      io.to(public_conversation_id).emit('public_room_users_update', {
        public_conversation_id,
        users: globalState.activeUsersInPublicRoom[public_conversation_id]
      });

      // 📝 log Creation of room
      console.log(`➕ [SOCKET PublicRoom] Created: ${public_conversation_id}`);
    } catch (error) {
      console.error('[SOCKET ERROR] [PublicRoom] create failed:', error?.message || error);
      socket.emit('public_room_error', { error: 'Failed to create public conversation.' });
    }
  });
}
