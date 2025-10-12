/**
 * ================== publicRoomEvents.js ==================
 * 🏠 Public Live Chat — Lobby + per-room presence (Set-based, socket.id)
 * ---------------------------------------------------------
 * Inbound:
 *   • public_lobby:join
 *   • public_lobby:leave
 *   • public_room:create     { subject?: string, owner_user_id?: string | null }
 *   • public_room:join       { public_conversation_id: string }
 *   • public_room:leave      { public_conversation_id: string }
 *
 * Outbound (compat):
 *   • public_presence:update { room_id, users }            ← ✅ what your Hub listens to
 *   • public_lobby:users_update / public_room:users_update ← (kept for fallback)
 *   • public_room:created, public_room:ready, public_room:error
 */
import prisma from '../lib/core/prisma.js'; // 🧱 Prisma

const isUuid = (v) => typeof v === 'string' && /^[0-9a-fA-F-]{36}$/.test(v);
const PUBLIC_LOBBY_ROOM = 'public_live_chat_lobby'; // 🛋️ room name used for lobby

// 🧰 Ensure value is a Set
const ensureSet = (maybe) =>
  maybe instanceof Set ? maybe : new Set(Array.isArray(maybe) ? maybe : []);

// 👥 Convert Set<socketId> → Array<userData> (current snapshots)
const usersFromSet = (io, set) =>
  Array.from(ensureSet(set))
    .map((sid) => io.sockets.sockets.get(sid)?.userData)
    .filter(Boolean);

export default function registerPublicRoomEvents(io, socket, globalState) {
  // 🗃️ Shared registries (Set-based)
  globalState.publicLobby = ensureSet(globalState.publicLobby); // 👥 Set<socketId> in lobby
  globalState.activeUsersInPublicRoom ||= Object.create(null); // { [roomId]: Set<socketId> }

  // 🔁 emit lobby roster (both the new canonical + legacy topic)
  const emitLobby = () => {
    const users = usersFromSet(io, globalState.publicLobby);
    io.to(PUBLIC_LOBBY_ROOM).emit('public_presence:update', { room_id: PUBLIC_LOBBY_ROOM, users });
    io.to(PUBLIC_LOBBY_ROOM).emit('public_lobby:users_update', {
      room_id: PUBLIC_LOBBY_ROOM,
      users
    });
    // Also broadcast to 'PUBLIC_LOBBY' for older code paths (index.js uses it in disconnect)
    io.to('PUBLIC_LOBBY').emit('public_presence:update', { room_id: PUBLIC_LOBBY_ROOM, users });
  };

  // 🔁 emit room roster (both canonical + legacy)
  const emitRoom = (public_conversation_id) => {
    const set = ensureSet(globalState.activeUsersInPublicRoom[public_conversation_id]);
    const users = usersFromSet(io, set);
    io.to(public_conversation_id).emit('public_presence:update', {
      room_id: public_conversation_id,
      users
    });
    io.to(public_conversation_id).emit('public_room:users_update', {
      public_conversation_id,
      users
    });
  };

  /* ----------------------- LOBBY ------------------------ */
  socket.on('public_lobby:join', () => {
    console.log('[Public] 🛋️ Lobby joined:', socket.id);
    // ➕ add this socket to the lobby Set
    globalState.publicLobby.add(socket.id);
    socket.join(PUBLIC_LOBBY_ROOM);
    emitLobby(); // 📣 broadcast
  });

  socket.on('public_lobby:leave', () => {
    console.log('[Public] 🛋️ Lobby left:', socket.id);
    // ➖ remove this socket from the lobby Set
    globalState.publicLobby.delete(socket.id);
    socket.leave(PUBLIC_LOBBY_ROOM);
    emitLobby();
  });

  /* ----------------------- CREATE ----------------------- */
  socket.on('public_room:create', async ({ subject, owner_user_id } = {}) => {
    console.log('[Public] 🏠 Room create requested:', { subject, owner_user_id });

    try {
      const data = { subject: subject || 'Public Live Chat' };
      if (owner_user_id && isUuid(owner_user_id)) {
        const owner = await prisma.user.findUnique({
          where: { user_id: owner_user_id },
          select: { user_id: true, role: true }
        });
        if (owner && owner.role !== 'guest') data.owner = { connect: { user_id: owner_user_id } };
      }
      if (!data.owner && socket.userData.role === 'guest') {
        data.owner_guest_id = socket.userData.public_identity_id;
      }
      const conversation = await prisma.publicLiveChatConversation.create({
        data,
        select: { public_conversation_id: true, owner_id: true }
      });
      const public_conversation_id = conversation.public_conversation_id;

      // 🧾 Ensure Set exists and add self (socket.id)
      const set = ensureSet(globalState.activeUsersInPublicRoom[public_conversation_id]);
      set.add(socket.id);
      globalState.activeUsersInPublicRoom[public_conversation_id] = set;

      socket.join(public_conversation_id);

      console.log('[Public] 🏠 Room created:', public_conversation_id);

      io.emit('public_room:created', {
        public_conversation_id,
        owner_id: conversation.owner_id || null
      });

      socket.emit('public_room:ready', { public_conversation_id });

      emitRoom(public_conversation_id);
    } catch (e) {
      socket.emit('public_room:error', { error: 'Failed to create public conversation.' });
    }
  });

  /* ----------------------- JOIN/LEAVE ROOM -------------- */
  socket.on('public_room:join', ({ public_conversation_id } = {}) => {
    console.log('[Public] 🚪 Room joined:', public_conversation_id, 'socket:', socket.id);
    if (!isUuid(public_conversation_id)) return;
    const set = ensureSet(globalState.activeUsersInPublicRoom[public_conversation_id]);
    set.add(socket.id);
    globalState.activeUsersInPublicRoom[public_conversation_id] = set;
    socket.join(public_conversation_id);
    emitRoom(public_conversation_id);
  });

  socket.on('public_room:leave', ({ public_conversation_id } = {}) => {
    console.log('[Public] 🚪 Room left:', public_conversation_id, 'socket:', socket.id);
    if (!isUuid(public_conversation_id)) return;
    const set = ensureSet(globalState.activeUsersInPublicRoom[public_conversation_id]);
    set.delete(socket.id);
    globalState.activeUsersInPublicRoom[public_conversation_id] = set;
    socket.leave(public_conversation_id);
    emitRoom(public_conversation_id);
  });

  /* ----------------------- DISCONNECT ------------------- */
  socket.on('disconnect', () => {
    console.log('[Public] 🔌 Disconnected:', socket.id);
    // 🚪 lobby
    globalState.publicLobby.delete(socket.id);
    emitLobby();

    // 🚪 every room
    for (const roomId of Object.keys(globalState.activeUsersInPublicRoom)) {
      const set = ensureSet(globalState.activeUsersInPublicRoom[roomId]);
      set.delete(socket.id);
      globalState.activeUsersInPublicRoom[roomId] = set;
      emitRoom(roomId);
    }
  });
}
