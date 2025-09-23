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

import prisma from '../lib/core/prisma.js'; // 📦 Prisma

// 🧪 UUID verification
const isUuid = (value) => typeof value === 'string' && /^[0-9a-fA-F-]{36}$/.test(value);

// 🏠 Consistent lobby room name
const PUBLIC_LOBBY_ROOM = 'public_live_chat_lobby';

export default function registerPublicRoomEvents(io, socket, globalState) {
  /* --------------------------------------------------------------------------------------- */
  // 🗂️ Helper: ensure a room map exists (create the room map if it doesnt already exist)
  const ensureRoomMap = (id) => {
    if (!globalState.activeUersInPublicRoom[id]) {
      globalState.activeUersInPublicRoom[id] = {};
    }
    return globalState.activeUersInPublicRoom[id];
  };

  /* --------------------------------------------------------------------------------------- */

  // 🚪 Join the public lobby (widget opened)
  socket.on('public_join_lobby', () => {
    // 🔁 Remove any previous snapshot for this user_id (multi-tab safe)
    const filteredLobby = globalState.publicLobby.filter(
      (existingUser) => existingUser.user_id !== socket.userData.user_id
    );
    filteredLobby.push({ ...socket.userData }); // ➕ Add fresh user to the lobby

    // ⚡Merge filteredLobby with the publicLobby (no duplicates)
    globalState.publicLobby = filteredLobby;

    // 🚪 Join lobby room
    socket.join(PUBLIC_LOBBY_ROOM); // ✅ Join the publicLobby

    // 📣 Broadcast current lobby
    io.to(PUBLIC_LOBBY_ROOM).emit('public_room_users_update', {
      room_id: PUBLIC_LOBBY_ROOM, // ✅ Use room_id for lobby
      users: globalState.publicLobby
    });

    // 📝 log the event
    console.log(
      `🏠 [PublicRoom] Lobby join: ${socket.userData.user_id} Role: ${socket.userData.role}`
    );
  });

  // 🚪 Leave the public lobby (widget closed)
  socket.on('public_leave_lobby', () => {
    const filteredLobby = globalState.publicLobby.filer(
      (existingUser) => existingUser.user_id !== socket.userData.user_id
    );
    // ⚡Merge filteredLobby with the publicLobby (no duplicates)
    globalState.publicLobby = filteredLobby;

    socket.leave(PUBLIC_LOBBY_ROOM); // 🚪 Leave lobby room

    // 📣 Broadcast current lobby roster (LOBBY PAYLOAD)
    io.to(PUBLIC_LOBBY_ROOM).emit('public_room_users_update', {
      room_id: PUBLIC_LOBBY_ROOM, // ✅ Use room_id for lobby
      users: globalState.publicLobby
    });

    // 📝 Log the event
    console.log(`🏠 [PublicRoom] Lobby leave: ${socket.userData.user_id}`);
  });

  /* --------------------------------------------------------------------------------------- */

  // ➕ Create a new public conversation (owner optional for logged-in user
  socket.on('public_create_chat_room', async ({ subject, owner_user_id } = {}) => {
    try {
      // 📝 Prepare conversation data (owner connect only when provided)
    } catch (error) {
      console.error('[ERROR][PublicRoom] create failed:', error?.message || error);
      socket.emit('public_room_error', { error: 'Failed to create public conversation.' });
    }
  });

  // TO BE CONTINUED !!!!
}
