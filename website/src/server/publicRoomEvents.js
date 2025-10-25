/**
 * ================== publicRoomEvents.js ==================
 * 🏠 Public Live Chat — Lobby + Room Management (SIMPLIFIED)
 * ---------------------------------------------------------
 * Purpose: Handle users joining/leaving the lobby and chat rooms
 *
 * Key Events:
 *   IN:  public_lobby:join, public_lobby:leave
 *        public_room:create, public_room:join, public_room:leave
 *   OUT: public_presence:update (unified presence broadcast)
 */
import prisma from '../lib/core/prisma.js';
import { createCookieUtils } from './cookieEvents.js';

// 🧰 Helper: Check if string is valid UUID
const isUuid = (v) => typeof v === 'string' && /^[0-9a-fA-F-]{36}$/.test(v);

// 🛋️ Lobby room name (constant)
const PUBLIC_LOBBY_ROOM = 'public_live_chat_lobby';

export default function registerPublicRoomEvents(io, socket, globalState) {
  // 🍪 Bind cookie helpers to this socket
  const cookieUtils = createCookieUtils({
    cookieHeader: socket.handshake?.headers?.cookie || '',
    socket
  });

  // 📦 Initialize global state (ensure objects exist)
  globalState.publicLobby = globalState.publicLobby || new Set();
  globalState.activeUsersInPublicRoom = globalState.activeUsersInPublicRoom || {};

  // 🔧 HELPER: Convert Set of socket IDs → array of user data
  const getUsersInRoom = (socketIds) => {
    if (!socketIds) return [];
    return Array.from(socketIds)
      .map((sid) => io.sockets.sockets.get(sid)?.userData)
      .filter(Boolean); // Remove undefined entries
  };

  // 📣 HELPER: Broadcast presence update for lobby
  const broadcastLobbyPresence = () => {
    const users = getUsersInRoom(globalState.publicLobby);
    console.log(`[Public Lobby] 👥 Broadcasting presence: ${users.length} users`);
    io.to(PUBLIC_LOBBY_ROOM).emit('public_presence:update', {
      room_id: PUBLIC_LOBBY_ROOM,
      users
    });
  };

  // 📣 HELPER: Broadcast presence update for specific room
  const broadcastRoomPresence = (roomId) => {
    const socketIds = globalState.activeUsersInPublicRoom[roomId];
    const users = getUsersInRoom(socketIds);
    console.log(`[Public Room ${roomId}] 👥 Broadcasting presence: ${users.length} users`);
    io.to(roomId).emit('public_presence:update', {
      room_id: roomId,
      users
    });
  };

  /* =========================================================
   * 🛋️ LOBBY EVENTS
   * =======================================================*/
  socket.on('public_lobby:join', () => {
    console.log(`[Public Lobby] ✅ User joined: ${socket.userData.name}`);

    // Add socket to lobby tracking
    globalState.publicLobby.add(socket.id);

    // Join Socket.IO room
    socket.join(PUBLIC_LOBBY_ROOM);

    // Tell everyone who's in the lobby now
    broadcastLobbyPresence();
  });

  socket.on('public_lobby:leave', () => {
    console.log(`[Public Lobby] 👋 User left: ${socket.userData.name}`);

    // Remove socket from lobby tracking
    globalState.publicLobby.delete(socket.id);

    // Leave Socket.IO room
    socket.leave(PUBLIC_LOBBY_ROOM);

    // Tell everyone who's left
    broadcastLobbyPresence();
  });

  /* =========================================================
   * 🏠 ROOM CREATE
   * =======================================================*/
  socket.on('public_room:create', async ({ subject, owner_user_id } = {}) => {
    console.log(`[Public Room] 🆕 Creating room: "${subject || 'Public Live Chat'}"`);

    try {
      // 🧱 Build data for database
      const data = {
        subject: subject || 'Public Live Chat',
        read: false
      };

      // 👤 Link owner if authenticated user
      if (owner_user_id && isUuid(owner_user_id)) {
        const owner = await prisma.user.findUnique({
          where: { user_id: owner_user_id },
          select: { user_id: true, role: true }
        });

        if (owner && owner.role !== 'guest') {
          data.owner_id = owner_user_id;
        }
      }

      // 🪪 Use guest ID if no authenticated owner
      if (!data.owner_id && socket.userData.role === 'guest') {
        data.owner_guest_id = socket.userData.public_identity_id;
      }

      // 💾 Create conversation in database
      const conversation = await prisma.publicLiveChatConversation.create({
        data,
        select: {
          public_conversation_id: true,
          owner_id: true,
          owner_guest_id: true,
          subject: true
        }
      });

      const roomId = conversation.public_conversation_id;

      // 📦 Initialize room tracking
      if (!globalState.activeUsersInPublicRoom[roomId]) {
        globalState.activeUsersInPublicRoom[roomId] = new Set();
      }

      // ➕ Add creator to room
      globalState.activeUsersInPublicRoom[roomId].add(socket.id);

      // 🚪 Join Socket.IO room
      socket.join(roomId);

      // 🍪 Remember this room (survives refresh/redirect)
      cookieUtils.rememberLastRoom(roomId);

      console.log(`[Public Room] ✅ Room created: ${roomId}`);

      // 📣 Tell creator their room is ready
      socket.emit('public_room:ready', {
        public_conversation_id: roomId,
        subject: conversation.subject
      });

      // 📣 Tell everyone a new room was created
      io.emit('public_room:created', {
        public_conversation_id: roomId,
        owner_id: conversation.owner_id,
        owner_guest_id: conversation.owner_guest_id,
        subject: conversation.subject
      });

      // 📣 Broadcast presence in new room
      broadcastRoomPresence(roomId);
    } catch (error) {
      console.error('[Public Room] ❌ Create failed:', error.message);
      socket.emit('public_room:error', {
        code: 'CREATE_FAILED',
        message: 'Failed to create public conversation.'
      });
    }
  });

  /* =========================================================
   * 🚪 ROOM JOIN
   * =======================================================*/
  socket.on('public_room:join', ({ public_conversation_id } = {}) => {
    if (!isUuid(public_conversation_id)) {
      console.warn(`[Public Room] ⚠️ Invalid room ID: ${public_conversation_id}`);
      return;
    }

    console.log(
      `[Public Room] ✅ User joining: ${socket.userData.name} → ${public_conversation_id}`
    );

    // 📦 Initialize room tracking if needed
    if (!globalState.activeUsersInPublicRoom[public_conversation_id]) {
      globalState.activeUsersInPublicRoom[public_conversation_id] = new Set();
    }

    // ➕ Add user to room tracking
    globalState.activeUsersInPublicRoom[public_conversation_id].add(socket.id);

    // 🚪 Join Socket.IO room
    socket.join(public_conversation_id);

    // 🍪 Remember this room (survives refresh/redirect)
    cookieUtils.rememberLastRoom(public_conversation_id);

    // 📣 Broadcast updated presence
    broadcastRoomPresence(public_conversation_id);
  });

  /* =========================================================
   * 🚪 ROOM LEAVE
   * =======================================================*/
  socket.on('public_room:leave', ({ public_conversation_id } = {}) => {
    if (!isUuid(public_conversation_id)) {
      console.warn(`[Public Room] ⚠️ Invalid room ID: ${public_conversation_id}`);
      return;
    }

    console.log(
      `[Public Room] 👋 User leaving: ${socket.userData.name} ← ${public_conversation_id}`
    );

    // ➖ Remove user from room tracking
    const roomSet = globalState.activeUsersInPublicRoom[public_conversation_id];
    if (roomSet) {
      roomSet.delete(socket.id);
    }

    // 🚪 Leave Socket.IO room
    socket.leave(public_conversation_id);

    // 🍪 Forget this room
    cookieUtils.forgetLastRoom();

    // 📣 Broadcast updated presence
    broadcastRoomPresence(public_conversation_id);
  });

  /* =========================================================
   * 🔌 DISCONNECT CLEANUP
   * =======================================================*/
  socket.on('disconnect', () => {
    console.log(`[Public] 🔌 User disconnected: ${socket.userData.name}`);

    // 🧹 Remove from lobby
    globalState.publicLobby.delete(socket.id);
    broadcastLobbyPresence();

    // 🧹 Remove from all rooms
    for (const roomId in globalState.activeUsersInPublicRoom) {
      const roomSet = globalState.activeUsersInPublicRoom[roomId];
      if (roomSet && roomSet.has(socket.id)) {
        roomSet.delete(socket.id);
        broadcastRoomPresence(roomId);
      }
    }
  });
}
