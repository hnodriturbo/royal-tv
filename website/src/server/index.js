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
/* 
// 🧩 Helper: stable presence key (guest ⇒ cookie id, user ⇒ user_id)
const presenceKeyFor = (userData) =>
  userData.role === 'guest' ? userData.public_identity_id : userData.user_id;
 */
// 🧰 Coerce empty-like values to null for easier defaults 🧼
const pickValue = (value) => {
  if (value == null || value === '' || value === 'null' || value === 'undefined') return null;
  return value;
};

const connectionHandler = (io, socket, globalState) => {
  // 🗺️ Ensure Room Existance
  globalState.onlineUsers ||= []; // 👥 list of user snapshots
  globalState.publicLobby ||= []; // 🏠 list of lobby snapshots
  globalState.activeUsersInPublicRoom ||= {}; // 💬 { [convoId]: userData[] }
  globalState.activeUsersInLiveRoom ||= {}; // 🎈 { [convoId]: userData[] } (roomEvents.js uses arrays)

  // 📥 Read handshake query (client forwards cookie public_identity_id here) 📩
  const query = socket.handshake?.query || {};

  // 🧱 Basic, readable defaults (no typeof noise)
  const user_id = pickValue(query.user_id) || `guest-${socket.id}`; // 🆔
  const role = pickValue(query.role) || 'guest'; // 👤 User Role
  const name = pickValue(query.name) || user_id; // 🏷️ User Name
  const locale = pickValue(query.locale) || 'en'; // 🌍 initial locale
  const public_identity_id = pickValue(query.public_identity_id) || user_id; // 🪪 Public Identity (for persistence)

  // 📦 Canonical per-connection user data (the source of truth on the socket)
  socket.userData = {
    user_id, // 🆔 session identity (changes when user logs in/out)
    public_identity_id, // 🪪 stable widget identity (should NOT change on auth)
    role, // 👤 permissions & rooms
    name, // 🏷️ label for logs/UI
    locale, // 🌍 current UI language (client may update later)
    socket_id: socket.id, // 🔗 connection id
    connectedAt: new Date().toISOString() // ⏰ timestamp
  };
  console.log(
    '[state shapes]',
    'onlineUsers:',
    Array.isArray(globalState.onlineUsers),
    'publicLobby:',
    Array.isArray(globalState.publicLobby),
    'publicRooms:',
    typeof globalState.activeUsersInPublicRoom,
    'liveRooms:',
    typeof globalState.activeUsersInLiveRoom
  );
  // 🌍 Keep live locale here for notifications/emails
  socket.data.currentLocale = socket.userData.locale;

  // 👥 Online list (ARRAY): de-dupe by user_id, then add
  // 🧽 remove old entry for same user_id (multi-tab / reconnect safe)
  globalState.onlineUsers = globalState.onlineUsers.filter((user) => user.user_id !== user_id); // 🧹
  globalState.onlineUsers.push({ ...socket.userData });

  // 🛎️ Join per-user room for targeted emits
  socket.join(user_id);

  // 👑 Admins join a shared room for broadcasts
  if (socket.userData.role === 'admin') {
    socket.join('admins');
    console.log(`👑 Admin joined 'admins': ${socket.userData.name} (${socket.userData.user_id})`);
  }

  // 🌍 Register locale events (seed from handshake auth/query + allow live updates)
  registerLocaleEvents(io, socket, globalState);

  // 🧩 Register all event modules (once per socket)
  registerNotificationEvents(io, socket, globalState); // 🔔 notifications
  registerUserEvents(io, socket, globalState); // 👤 user profile / presence ops
  registerRoomEvents(io, socket, globalState); // 🏠 room join/leave (LiveChat only)
  registerAccountEvents(io, socket); // 💳 account & billing
  registerMessageEvents(io, socket); // 💬 chat events

  //👤 NEW - Public Live Chat Rooms and events
  registerPublicRoomEvents(io, socket, globalState); // 🏠 Public live chat rooms
  registerPublicMessageEvents(io, socket, globalState); // 💬 Public chat events

  registerLogEvents(io, socket); // 🪵 activity logging

  // 📡 Broadcast full online list (array)
  io.emit('online_users_update', globalState.onlineUsers);

  // ✅ Connection log
  console.log(
    `✅ Connected: ${socket.userData.name} (${socket.userData.role}) ` +
      `user_id/guest_id:${socket.userData.user_id} sid:${socket.userData.socket_id} ` +
      `lang:${socket.userData.locale}`
  );

  // 🔌 Cleanup on disconnect (single handler — centralized) 🌬️
  // 🌬️ Disconnect → remove from ALL arrays
  socket.on('disconnect', (reason) => {
    // 1) 👥 Remove from online List
    globalState.onlineUsers = globalState.onlineUsers.filter((user) => user.user_id !== user_id); // 🧹
    // 📡 Broadcast new users updated presence
    io.emit('online_users_update', globalState.onlineUsers);

    // 2) 🏠 Remove from Public lobby
    globalState.publicLobby = globalState.publicLobby.filter((user) => user.user_id !== user_id); // 🧹
    io.to('public_live_chat_lobby').emit('public_room_users_update', {
      room_id: 'public_live_chat_lobby',
      users: globalState.publicLobby
    });

    // 3) 💬 Public rooms (each value is a userData[]; filter by user_id)
    for (const convoId of Object.keys(globalState.activeUsersInPublicRoom)) {
      // ✨ Set the before list and after list
      const before = globalState.activeUsersInPublicRoom[convoId] || [];
      const after = before.filter((user) => user.user_id !== user_id);
      // ⚙️ Check if the lenght of the list (room) has changed and broadcast
      if (after.length !== before.length) {
        globalState.activeUsersInPublicRoom[convoId] = after;
        io.to(convoId).emit('public_room_users_update', {
          public_conversation_id: convoId,
          users: after
        });
      }
    }

    // 4) 🎈 LiveChat rooms (each value is a userData[]; filter by user_id)
    for (const convoId of Object.keys(globalState.activeUsersInLiveRoom)) {
      // ✨ Set the before list and after list
      const before = globalState.activeUsersInLiveRoom[convoId] || [];
      const after = before.filter((user) => user.user_id !== user_id);
      // ⚙️ Check if the lenght of the list (room) has changed and broadcast
      if (after.length !== before.length) {
        globalState.activeUsersInLiveRoom[convoId] = after;
        io.to(convoId).emit('room_users_update', {
          conversation_id: convoId,
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
