/**
 * ========== src/server/index.js ==========
 * 🔌 Socket.IO connection entrypoint (clear & minimal)
 * ---------------------------------------------------
 * 🧠 Purpose:
 *   • Attach a stable "public identity" to each socket (public_identity_id) 🪪
 *   • Keep current presence keyed by user_id (no breaking change) 🌐
 *   • Register all event modules and clean up on disconnect 🧹
 *   • Initialize ALL shared registries here (single source of truth) 🗺️
 * ---------------------------------------------------
 * 📦 Shape on socket.userData:
 *   { user_id, public_identity_id, role, name, locale, socket_id, connectedAt }
 * ---------------------------------------------------
 * 🧭 Lifecycle:
 *   1) Read handshake (user_id/role/name/locale/public_identity_id)
 *   2) Stamp socket.userData + socket.data.currentLocale
 *   3) Join per-user room (and 'admins' if admin)
 *   4) Register modules → emit presence
 *   5) Cleanup on disconnect
 */

import registerMessageEvents from './messageEvents.js';
import registerRoomEvents from './roomEvents.js';
import registerUserEvents from './userEvents.js';
import registerNotificationEvents from './notificationEvents.js';
import registerAccountEvents from './accountEvents.js';
import registerLogEvents from './logEvents.js'; // 🪵 activity logging
import registerLocaleEvents from './localeEvents.js'; // 🌍 locale handshake + live updates

// 🆕 Public live chat (multi-room) modules
import registerPublicRoomEvents from './publicRoomEvents.js';
import registerPublicMessageEvents from './publicMessageEvents.js';

const connectionHandler = (io, socket, globalState) => {
  // 🧭 Ensure global state containers exist (maps, not arrays) 🗺️
  globalState.onlineUsers ||= {}; // 🌐 presence by user_id (current session identity)
  globalState.activeUsersInLiveRoom ||= {}; // 💬 legacy live room presence

  // 🆕 Public live chat registries (SINGLE source of truth, initialized here)
  globalState.publicLobby ||= []; // 🏠 lobby presence list (array of snapshots)
  globalState.activeUsersInPublicRoom ||= {}; // 🗺️ { [public_conversation_id]: userData[] }

  // 🧰 Coerce empty-like values to null for easier defaults 🧼
  const pickValue = (value) => {
    if (value == null || value === '' || value === 'null' || value === 'undefined') return null;
    return value;
  };

  // 📥 Read handshake query (client forwards cookie public_identity_id here) 📩
  const query = socket.handshake?.query || {};

  // 🧱 Basic, readable defaults (no typeof noise)
  const userId = pickValue(query.user_id) || `guest-${socket.id}`; // 🆔
  const userRole = pickValue(query.role) || 'guest'; // 👤 User Role
  const userName = pickValue(query.name) || userId; // 🏷️ User Name
  const userLocale = pickValue(query.locale) || 'en'; // 🌍 initial locale
  const publicIdentity = pickValue(query.public_identity_id) || userId; // 🪪 Public Identity (for persistence)

  // 📦 Canonical per-connection user data (the source of truth on the socket)
  socket.userData = {
    user_id: userId, // 🆔 session identity (changes when user logs in/out)
    public_identity_id: publicIdentity, // 🪪 stable widget identity (should NOT change on auth)
    role: userRole, // 👤 permissions & rooms
    name: userName, // 🏷️ label for logs/UI
    locale: userLocale, // 🌍 current UI language (client may update later)
    socket_id: socket.id, // 🔗 connection id
    connectedAt: new Date().toISOString() // ⏰ timestamp
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

  registerPublicRoomEvents(io, socket, globalState); // 🏠 Public live chat rooms
  registerPublicMessageEvents(io, socket, globalState); // 💬 Public chat events

  registerLogEvents(io, socket); // 🪵 activity logging

  // 🔌 Cleanup on disconnect (single handler — centralized) 🌬️
  socket.on('disconnect', (reason) => {
    const isGuest = socket.userData.role === 'guest';
    const currentKey = isGuest ? socket.userData.public_identity_id : socket.userData.user_id;

    // 1️⃣  Remove global online presence
    if (globalState.onlineUsers[socket.userData.user_id]) {
      delete globalState.onlineUsers[socket.userData.user_id];
    }

    // 📡 Broadcast updated presence
    io.emit('online_users_update', Object.values(globalState.onlineUsers));

    // 2️⃣  Remove from legacy live rooms
    for (const roomId of Object.keys(globalState.activeUsersInLiveRoom)) {
      const before = globalState.activeUsersInLiveRoom[roomId] || [];
      const after = before.filter((u) =>
        isGuest ? u.public_identity_id !== currentKey : u.user_id !== currentKey
      );
      if (after.length !== before.length) {
        globalState.activeUsersInLiveRoom[roomId] = after;
        io.to(roomId).emit('room_users_update', {
          conversation_id: roomId,
          users: after
        });
      }
    }

    // 3️⃣  Remove from public lobby
    if (Array.isArray(globalState.publicLobby) && globalState.publicLobby.length) {
      const before = globalState.publicLobby;
      const after = before.filter((u) =>
        isGuest ? u.public_identity_id !== currentKey : u.user_id !== currentKey
      );
      if (after.length !== before.length) {
        globalState.publicLobby = after;
        io.to('public_live_chat_lobby').emit('public_room_users_update', {
          room_id: 'public_live_chat_lobby',
          users: after
        });
      }
    }

    // 4️⃣  Remove from public conversation rooms
    for (const convoId of Object.keys(globalState.activeUsersInPublicRoom)) {
      const before = globalState.activeUsersInPublicRoom[convoId] || [];
      const after = before.filter((u) =>
        isGuest ? u.public_identity_id !== currentKey : u.user_id !== currentKey
      );
      if (after.length !== before.length) {
        globalState.activeUsersInPublicRoom[convoId] = after;
        io.to(convoId).emit('public_room_users_update', {
          public_conversation_id: convoId,
          users: after
        });
      }
    }

    // 🧾 Disconnect log
    console.log(
      `🔻 Disconnected: ${socket.userData.name} (${socket.userData.role}) ` +
        `uid:${socket.userData.user_id} sid:${socket.userData.socket_id} ` +
        `reason:${reason}`
    );
  });
};

export default connectionHandler;
