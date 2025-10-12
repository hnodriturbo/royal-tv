// src/server/events/publicRoomEvents.js
import prisma from '../lib/core/prisma.js';
import createCookieUtils from './cookieEvents.js';

export default function registerPublicRoomEvents(io, socket, globalState) {
  // 🧭 state guards
  globalState.publicLobby ||= new Set();
  globalState.activeUsersInPublicRoom ||= {}; // { [roomId]: Set<socketId> }

  // 🍪 cookie helpers bound to this socket
  const cookieUtils = createCookieUtils({
    cookieHeader: socket?.handshake?.headers?.cookie || '',
    socket
  });

  const _usersFromSet = (set) =>
    Array.from(set || [])
      .map((sId) => io.sockets.sockets.get(sId)?.userData)
      .filter(Boolean);

  const _ensureRoom = (roomId) => (globalState.activeUsersInPublicRoom[roomId] ||= new Set());

  const _emitPresence = (room_id) => {
    const users =
      room_id === 'PUBLIC_LOBBY'
        ? _usersFromSet(globalState.publicLobby)
        : _usersFromSet(globalState.activeUsersInPublicRoom[room_id]);
    console.log('📣 [public_presence:update] room:%s users:%d', room_id, users.length);
    io.to(room_id).emit('public_presence:update', { room_id, users });
  };

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

  // 🚪 ROOM: join
  socket.on('public_room:join', async ({ public_conversation_id } = {}) => {
    console.log(
      '🚪 [public_room:join] user:%s room:%s',
      socket.userData?.user_id,
      public_conversation_id
    );
    if (typeof public_conversation_id !== 'string')
      return socket.emit('public_error', { code: 'INVALID_ID' });

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

  // 🧹 disconnect
  socket.on('disconnect', (reason) => {
    globalState.publicLobby.delete(socket.id);
    for (const set of Object.values(globalState.activeUsersInPublicRoom)) set.delete(socket.id);
    console.log('🔻 [disconnect] user:%s reason:%s', socket.userData?.user_id, reason);
  });
}
