// src/server/events/publicRoomEvents.js
import prisma from '../lib/core/prisma.js';
import createCookieUtils from './cookieEvents.js';

export default function registerPublicRoomEvents(io, socket, globalState) {
  // 🧭 state guards
  globalState.publicLobby ||= new Set();
  globalState.activeUsersInPublicRoom ||= {}; // { [roomId]: Set<socketId> }

<<<<<<< HEAD
  // 🍪 cookie helpers bound to this socket
  const cookieUtils = createCookieUtils({
    cookieHeader: socket?.handshake?.headers?.cookie || '',
    socket
  });

  const _usersFromSet = (set) =>
    Array.from(set || [])
      .map((sId) => io.sockets.sockets.get(sId)?.userData)
      .filter(Boolean);
=======
  /* --------------------------------------------------------------------------------------- */

  // 🚪 Join the public lobby (widget opened)
  socket.on('public:join_lobby', () => {
    // 🧹 Remove any previous snapshot for this user_id (multi-tab/reconnect safe)
    globalState.publicLobby = globalState.publicLobby.filter(
      (existingUser) => existingUser.user_id !== socket.userData.user_id
    );
    // ➕ Add fresh user to the lobby
    globalState.publicLobby.push({ ...socket.userData });

    // 🚪 Join lobby room
    socket.join(PUBLIC_LOBBY_ROOM); // ✅ Join the publicLobby

    // 📣 Broadcast current lobby
    io.to(PUBLIC_LOBBY_ROOM).emit('public:room_users_update', {
      room_id: PUBLIC_LOBBY_ROOM, // ✅ Use room_id for lobby
      users: globalState.publicLobby
    });

    // 📝 log the event
    console.log(
      `🏠 [SOCKET PublicRoom] Lobby join: ${socket.userData.user_id} Role: ${socket.userData.role}`
    );
  });

  // 🚪 Leave the public lobby (widget closed)
  socket.on('public:leave_lobby', () => {
    // 🧹 Remove user with filtering
    globalState.publicLobby = globalState.publicLobby.filter(
      (existingUser) => existingUser.user_id !== socket.userData.user_id
    );
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef

  const _ensureRoom = (roomId) => (globalState.activeUsersInPublicRoom[roomId] ||= new Set());

<<<<<<< HEAD
  const _emitPresence = (room_id) => {
    const users =
      room_id === 'PUBLIC_LOBBY'
        ? _usersFromSet(globalState.publicLobby)
        : _usersFromSet(globalState.activeUsersInPublicRoom[room_id]);
    console.log('📣 [public_presence:update] room:%s users:%d', room_id, users.length);
    io.to(room_id).emit('public_presence:update', { room_id, users });
  };
=======
    // 📣 Broadcast current lobby roster (LOBBY PAYLOAD)
    io.to(PUBLIC_LOBBY_ROOM).emit('public:room_users_update', {
      room_id: PUBLIC_LOBBY_ROOM,
      users: globalState.publicLobby
    });
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef

  // 🏢 LOBBY: join
  socket.on('public_lobby:join', () => {
    console.log('🏠 [public_lobby:join] user:%s', socket.userData?.user_id);
    socket.join('PUBLIC_LOBBY');
    globalState.publicLobby.add(socket.id);
    _emitPresence('PUBLIC_LOBBY');
  });

  // 🏢 LOBBY: leave
  socket.on('public_lobby:leave', () => {
    console.log('🏠 [public_lobby:leave] user:%s', socket.userData?.user_id);
    socket.leave('PUBLIC_LOBBY');
    globalState.publicLobby.delete(socket.id);
    _emitPresence('PUBLIC_LOBBY');
  });

<<<<<<< HEAD
  // 🚪 ROOM: join
  socket.on('public_room:join', async ({ public_conversation_id } = {}) => {
    console.log(
      '🚪 [public_room:join] user:%s room:%s',
      socket.userData?.user_id,
      public_conversation_id
    );
    if (typeof public_conversation_id !== 'string')
      return socket.emit('public_error', { code: 'INVALID_ID' });
=======
  // ➕ Create a new public conversation (owner optional for logged-in user
  socket.on('public:create_chat_room', async ({ subject, owner_user_id } = {}) => {
    try {
      // 📝 Prepare conversation data (owner connect only when provided)
      const createdData = {
        subject: subject || 'Public Live Chat' // 📌 Subject of the conversation fallbacks to english
      };
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef

    const set = _ensureRoom(public_conversation_id);
    socket.join(public_conversation_id);
    set.add(socket.id);
    cookieUtils.rememberLastRoom(public_conversation_id);
    _emitPresence(public_conversation_id);
  });

  // 🚪 ROOM: leave
  socket.on('public_room:leave', async ({ public_conversation_id } = {}) => {
    console.log(
      '🚪 [public_room:leave] user:%s room:%s',
      socket.userData?.user_id,
      public_conversation_id
    );
    if (typeof public_conversation_id !== 'string')
      return socket.emit('public_error', { code: 'INVALID_ID' });

    const set = _ensureRoom(public_conversation_id);
    socket.leave(public_conversation_id);
    set.delete(socket.id);
    cookieUtils.forgetLastRoom();
    _emitPresence(public_conversation_id);
  });

<<<<<<< HEAD
  // 🧹 disconnect
  socket.on('disconnect', (reason) => {
    globalState.publicLobby.delete(socket.id);
    for (const set of Object.values(globalState.activeUsersInPublicRoom)) set.delete(socket.id);
    console.log('🔻 [disconnect] user:%s reason:%s', socket.userData?.user_id, reason);
=======
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
      io.emit('public:live_chat_room_created', {
        public_conversation_id,
        owner_id: conversation.owner_id || null
      });
      socket.emit('public_live_chat_room_ready', { public_conversation_id });

      io.to(public_conversation_id).emit('public:room_users_update', {
        public_conversation_id,
        users: globalState.activeUsersInPublicRoom[public_conversation_id]
      });

      // 📝 log Creation of room
      console.log(`➕ [SOCKET PublicRoom] Created: ${public_conversation_id}`);
    } catch (error) {
      console.error('[SOCKET ERROR] [PublicRoom] create failed:', error?.message || error);
      socket.emit('public_room_error', { error: 'Failed to create public conversation.' });
    }
>>>>>>> 87a68ee8a521616354a6b882422fede0d0c041ef
  });
}
