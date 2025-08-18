/**
 * ========== src/server/index.js ==========
 * 🔌 Socket.IO connection entrypoint (simple & clear)
 * - Tracks presence keyed by user_id → globalState.onlineUsers[user_id]
 * - Uses socket.userData with: user_id, role, name, locale, socket_id, connectedAt
 * - Joins per-user room and optional 'admins' room
 * - Registers event modules and cleans up on disconnect
 * =========================================
 */

import registerMessageEvents from './messageEvents.js';
import registerRoomEvents from './roomEvents.js';
import registerUserEvents from './userEvents.js';
import registerNotificationEvents from './notificationEvents.js';
import registerAccountEvents from './accountEvents.js';
import registerLogEvents from './logEvents.js'; // 🪵 activity logging
import registerLocaleEvents from './localeEvents.js'; // 🌍 locale handshake + live updates

const connectionHandler = (io, socket, globalState) => {
  // 🧭 Ensure global state objects exist (objects, not arrays)
  globalState.onlineUsers ||= {}; // 🌐 presence keyed by user_id
  globalState.activeUsersInLiveRoom ||= {}; // 💬 live chat participation map

  // 📥 handshake sources
  const query = socket.handshake?.query || {};
  /*   const auth = socket.handshake?.auth || {};
  const hdrs = socket.handshake?.headers || socket.request?.headers || {}; */

  // 🧱 Basic, readable defaults (no typeof noise)
  const userId = (query.user_id && String(query.user_id).trim()) || `guest-${socket.id}`; // 🆔
  const userRole = (query.role && String(query.role).trim()) || 'guest'; // 👤
  const userName = (query.name && String(query.name).trim()) || userId; // 🏷️
  const userLocale = (query.locale && String(query.locale).trim()) || 'en'; // 🌍 initial locale

  // 📦 Canonical per-connection user data (the source of truth on the socket)
  socket.userData = {
    user_id: userId, // 🆔 who this connection represents
    role: userRole, // 👤 role for permissions & rooms
    name: userName, // 🏷️ display name
    locale: userLocale, // 🌍 current UI language (client may update later)
    socket_id: socket.id, // 🔗 this connection id
    connectedAt: new Date().toISOString() // ⏰ when the socket came online
  };

  // 🌍 Keep live locale here for notifications/emails
  socket.data.currentLocale = userLocale;

  // 🌐 Store presence snapshot keyed by user_id (exact shape wanted)
  globalState.onlineUsers[userId] = socket.userData;

  // 🛎️ Join per-user room for targeted emits
  socket.join(userId);

  // 👑 Admins join a shared room for broadcasts
  if (socket.userData.role === 'admin') {
    socket.join('admins');
    console.log(`👑 Admin joined 'admins': ${socket.userData.name} (${socket.userData.user_id})`);
  }

  // 🌍 Register locale events (seed from handshake auth/query + allow live updates)
  registerLocaleEvents(io, socket, globalState);

  // 📡 Tell everyone who’s online (array of userData objects)
  io.emit('online_users_update', Object.values(globalState.onlineUsers));

  // ✅ Connection log
  console.log(
    `✅ Connected: ${socket.userData.name} (${socket.userData.role}) ` +
      `uid:${socket.userData.user_id} sid:${socket.userData.socket_id} ` +
      `lang:${socket.userData.locale}`
  );

  // 🧩 Register all event modules (once per socket)
  registerNotificationEvents(io, socket, globalState); // 🔔 notifications
  registerUserEvents(io, socket, globalState); // 👤 user profile / presence ops
  registerRoomEvents(io, socket, globalState); // 🏠 room join/leave (LiveChat only)
  registerAccountEvents(io, socket); // 💳 account & billing
  registerMessageEvents(io, socket); // 💬 chat events

  registerLogEvents(io, socket); // 🪵 activity logging

  // 🔌 Clean up on disconnect
  socket.on('disconnect', (reason) => {
    // 🧹 Remove from presence (keyed by user_id)
    if (globalState.onlineUsers[userId]) {
      delete globalState.onlineUsers[userId];
    }

    // 📡 Broadcast updated presence
    io.emit('online_users_update', Object.values(globalState.onlineUsers));

    // 🧾 Disconnect log
    console.log(
      `🔻 Disconnected: ${socket.userData.name} (${socket.userData.role}) ` +
        `uid:${socket.userData.user_id} sid:${socket.userData.socket_id} ` +
        `reason:${reason}`
    );
  });
};

export default connectionHandler;
