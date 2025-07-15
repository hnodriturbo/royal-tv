/**
 *   ========== src/server/index.js ==========
 * 🛠️
 * MODULAR SOCKET.IO EVENT REGISTRATION ENTRYPOINT
 * - Identifies and seeds user
 * - Registers all socket event modules (chat, room, user, account, etc)
 * ===========================================
 */

import registerMessageEvents from './messageEvents.js';
import registerRoomEvents from './roomEvents.js';
import registerUserEvents from './userEvents.js';
import registerNotificationEvents from './notificationEvents.js';
import registerAccountEvents from './accountEvents.js';

const connectionHandler = (io, socket, globalState) => {
  // 1️⃣ Initialize global state (bubble removed)
  globalState.onlineUsers ||= {};
  globalState.activeUsersInLiveRoom ||= {};

  // 2️⃣ Identify user
  let { user_id, role, name } = socket.handshake.query;
  role = role || 'guest';
  if (role === 'guest' || !user_id) user_id = `guest-${socket.id}`;

  // Attach to socket & broadcast online users
  socket.userData = { user_id, role, name };
  globalState.onlineUsers[user_id] = socket.userData;

  // 3️⃣ JOIN PER-USER ROOM
  socket.join(user_id);

  // 👑 If admin, also join the global 'admins' room
  if (role === 'admin') {
    socket.join('admins');
    console.log(`👑 Admin joined global 'admins' room: ${name} (${user_id})`);
  }

  // 🌐 Print online users (one per line)
  console.log('🌐 Online Users:');
  Object.values(globalState.onlineUsers).forEach((user) => {
    console.log(`  - ${user.name} (${user.role}) [${user.user_id}]`);
  });

  // 🔄 Then broadcast updated online list as before
  io.emit('online_users_update', Object.values(globalState.onlineUsers));

  console.log(`✅ Connected: ${name} (${role}) uid:${user_id}`);

  // 4️⃣ Register events ONCE per socket
  registerUserEvents(io, socket, globalState);
  registerRoomEvents(io, socket, globalState);
  registerAccountEvents(io, socket);
  registerMessageEvents(io, socket);
  registerNotificationEvents(io, socket);
};

export default connectionHandler;
