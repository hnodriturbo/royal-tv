/**
 * ========== src/server/index.js ==========
 * 🔌 Socket.IO connection entrypoint (clear & minimal, beginner-friendly)
 * -----------------------------------------------------------------------------
 * 📦 What this file does (big picture):
 *   • Read identity + locale from the socket handshake (query + cookies) 🍪
 *   • Create a stable "public identity" for guests (public_identity_id) 🪪
 *   • Keep a single presence snapshot per person (guest → cookie id, user → user_id) 👥
 *   • Auto-reopen the last public room after refresh/redirect (cookie) 🔁
 *   • Register all event modules for private & public live chat 🧩
 *   • Clean up presence lists on disconnect 🧹
 *
 * 🧭 Connection lifecycle (step-by-step):
 *   1) Guard globalState shapes (Set vs Object vs Array) 🛡️
 *   2) Bind cookie helpers to this socket (reads HttpOnly & normal cookies) 🍪
 *   3) Build socket.userData from query + cookies (human-friendly defaults) 👤
 *   4) De-dupe presence by a stable identity key, then add fresh snapshot 👥
 *   5) Join personal room (and 'admins' if admin) 🔔
 *   6) Register all event modules (locale, users, rooms, messages…) 🧩
 *   7) If a “last room” cookie exists → auto-join and notify room users 🔁
 *   8) Emit the online users to everyone + seed this socket 🌍
 *   9) On disconnect: remove from all presence lists + broadcast updates 🌬️
 */

// ---------------------------------------------------------
// 👇  Events Registration For The Handshake
// ---------------------------------------------------------
// 🌍 locale handshake + live updates
import registerLocaleEvents from './localeEvents.js';

// 💬 Live Chat Event Modules (private/live chat)
import registerMessageEvents from './messageEvents.js';
import registerRoomEvents from './roomEvents.js';

// 👥 User & Account Events Modules
import registerUserEvents from './userEvents.js';
import registerAccountEvents from './accountEvents.js';

// 🏷️ Notification & Activity Logging Events Modules
import registerNotificationEvents from './notificationEvents.js';
import registerLogEvents from './logEvents.js';

// 🆕 Public live chat (multi-room) modules
import registerPublicRoomEvents from './publicRoomEvents.js';
import registerPublicMessageEvents from './publicMessageEvents.js';

// 🧁 Cookie helpers
import createCookieUtils from './cookieEvents.js';

// 💾 Prisma for database queries
import prisma from '../lib/core/prisma.js';
import { get } from 'node:http';

// ---------------------------------------------------------
// 🧩 Small helpers (keep it beginner-friendly)
// ----------------------------------------------------------

// 🧰 Coerce empty-like values to null for easier defaults
const pickValue = (value) => {
  if (value == null || value === '' || value === 'null' || value === 'undefined') return null;
  return value;
};

// 📝 Log online users (human-friendly, no IDs)
const logOnlineUsers = (label, users = []) => {
  const names = users.map(
    (user) => user?.name || user?.username || (user?.role === 'guest' ? 'Guest' : user?.user_id)
  );

  console.log(`👥 ${label} → count:${users.length} → names: ${names.join(', ') || '—'}`);
};

// 🔑 Stable identity (guest => public_identity_id, user/admin => user_id)
const getPresenceIdentityKey = (snapshot) => {
  return snapshot?.role === 'guest' ? snapshot?.public_identity_id : snapshot?.user_id;
};

// 🛡️ Ensure a value is a Set (convert arrays/objects defensively)
const ensureSet = (maybe) =>
  maybe instanceof Set ? maybe : new Set(Array.isArray(maybe) ? maybe : []);

// 👥 Map socketId Set → array of userData snapshots
const usersFromSet = (io, set) =>
  Array.from(ensureSet(set))
    .map((sId) => io.sockets.sockets.get(sId)?.userData)
    .filter(Boolean);

// ---------------------------------------------------------
// 👇  Official Connection Handler
// ---------------------------------------------------------
const connectionHandler = (io, socket, globalState) => {
  // 🛡️ Make sure globalState exists
  globalState ||= {};

  // 🗺️ Ensure shapes:
  //    • onlineUsers: array of snapshots
  //    • activeUsersInPublicRoom: { [roomId]: Set<socketId> }
  //    • activeUsersInLiveRoom: keep your existing array-of-snapshots model for private chat

  globalState.onlineUsers = Array.isArray(globalState.onlineUsers) ? globalState.onlineUsers : [];

  globalState.activeUsersInPublicRoom =
    globalState.activeUsersInPublicRoom && typeof globalState.activeUsersInPublicRoom === 'object'
      ? globalState.activeUsersInPublicRoom
      : Object.create(null);

  globalState.activeUsersInLiveRoom =
    globalState.activeUsersInLiveRoom && typeof globalState.activeUsersInLiveRoom === 'object'
      ? globalState.activeUsersInLiveRoom
      : Object.create(null);

  // 🍪 Bind helpers to this socket
  const cookieUtils = createCookieUtils({
    cookieHeader: socket.handshake?.headers?.cookie || '',
    socket
  });

  // ---------------------------------------------------------
  // 👤  Read the handshake and create socket.userData
  // ---------------------------------------------------------
  // 📥 Read handshake query/auth (client may forward public_identity_id here)
  const query = socket.handshake?.query || {};
  const auth = socket.handshake?.auth || {};

  // 🧱 Basic readable values (prefer auth > query; cookies are the truth for identity)
  const rawUserId = pickValue(auth.user_id) || pickValue(query.user_id);
  const rawRole = pickValue(auth.role) || pickValue(query.role);
  const rawName = pickValue(auth.name) || pickValue(query.name);
  const rawLocale = pickValue(auth.locale) || pickValue(query.locale);
  const rawPublicId = pickValue(auth.public_identity_id) || pickValue(query.public_identity_id);

  // 🧠 Resolve final values (guest ids are socket-based; stable guest identity uses cookie)
  const user_id = rawUserId || `guest-${socket.id}`; // 🆔 unique per socket when guest
  const role = rawRole || 'guest'; // 👤 'guest' | 'user' | 'admin'
  const name = rawName || user_id; // 🏷️ label for logs/UI
  const locale = rawLocale || cookieUtils.getLocaleOrDefault('en'); // 🌍 NEXT_LOCALE or 'en'
  const public_identity_id = cookieUtils.getPublicIdentityId(rawPublicId) || user_id; // 🪪 stable widget id

  // 📦 Canonical per-connection user data
  socket.userData = {
    user_id, // 🆔 session identity
    public_identity_id, // 🪪 stable widget identity
    role, // 👤 permissions
    name, // 🏷️ label
    locale, // 🌍 current UI language
    socket_id: socket.id, // 🔗 connection id
    connectedAt: new Date().toISOString() // ⏰ timestamp
  };

  // 🌍 Keep live locale here for notifications/emails
  socket.data.currentLocale = socket.userData.locale;

  // ---------------------------------------------------------
  // 👥 Add the user — de-dupe by identity key (guest cookie or user_id)
  // ---------------------------------------------------------
  // ✅ CONNECT: de-dupe by identity only
  globalState.onlineUsers = globalState.onlineUsers.filter(
    (existing) => getPresenceIdentityKey(existing) !== getPresenceIdentityKey(socket.userData)
  );
  // ➕ Push new snapshot of the userData to onlineUsers
  globalState.onlineUsers.push({ ...socket.userData });

  // 📝 Log presence after add
  logOnlineUsers('onlineUsers (after connect)', globalState.onlineUsers);

  // 🛎️ Join per-user room for targeted emits
  socket.join(user_id);

  // ---------------------------------------------------------
  // 👑 Admin special handling
  // ---------------------------------------------------------
  if (socket.userData.role === 'admin') {
    console.log(`👑 Admin connected: ${socket.userData.name} (${socket.userData.role})`);

    socket.join('admins');

    console.log(`👑 Admin joined 'admins': ${socket.userData.name} (${socket.userData.role})`);
  }

  // ---------------------------------------------------------
  // ✨ Register all events
  // ---------------------------------------------------------
  registerLocaleEvents(io, socket, globalState); // 🌍 locale
  registerNotificationEvents(io, socket, globalState); // 🔔 notifications
  registerUserEvents(io, socket, globalState); // 👤 user profile / presence ops
  registerRoomEvents(io, socket, globalState); // 🏠 private/live rooms (unchanged)
  registerAccountEvents(io, socket); // 💳 account & billing
  registerMessageEvents(io, socket); // 💬 private/live messages

  // 👤 Public Live Chat Rooms and messages
  registerPublicRoomEvents(io, socket, globalState); // 🏠 Public live chat rooms
  registerPublicMessageEvents(io, socket, globalState); // 💬 Public chat events

  registerLogEvents(io, socket); // 🪵 activity logging

  // ---------------------------------------------------------
  // 🔁 Auto-join last public room (cookie set previously)
  // ---------------------------------------------------------
  const lastPublicRoomId = cookieUtils.getLastPublicRoomId();
  if (lastPublicRoomId && typeof lastPublicRoomId === 'string') {
    // 🧩 ensure presence Set exists
    const current = ensureSet(globalState.activeUsersInPublicRoom[lastPublicRoomId]);
    globalState.activeUsersInPublicRoom[lastPublicRoomId] = current;

    // 🚪 actually join the Socket.IO room
    socket.join(lastPublicRoomId);

    // ➕ add this socket to the Set
    current.add(socket.id);

    // 📣 emit presence roster for that room
    io.to(lastPublicRoomId).emit('public_presence:update', {
      room_id: lastPublicRoomId,
      users: usersFromSet(io, current)
    });

    console.log(`[SOCKET] 🔁 Auto-joined last public room: ${lastPublicRoomId} (cookie)`);
  }

  // 🌍 Presence broadcast (everyone) + seed this socket (nice for first paint)
  io.emit('online_users_update', globalState.onlineUsers); // 🌍 broadcast
  socket.emit('online_users_update', globalState.onlineUsers); // 🎯 direct seed

  // ✅ Connection log
  console.log(`✅ Connected: ${name} (${role}) uid:${user_id} sid:${socket.id} lang:${locale}`);

  // ---------------------------------------------------------
  // 🔌 Cleanup on disconnect (single handler — centralized)
  // ---------------------------------------------------------
  socket.on('disconnect', (reason) => {
    // 👥 Remove from onlineUsers (by identity key) and broadcast
    const identityToRemove = getPresenceIdentityKey(socket.userData);
    globalState.onlineUsers = globalState.onlineUsers.filter(
      (user) => getPresenceIdentityKey(user) !== identityToRemove
    );

    io.emit('online_users_update', globalState.onlineUsers);
    logOnlineUsers('onlineUsers (after disconnect)', globalState.onlineUsers);

    // 💬 Remove from each PUBLIC room Set (by socket.id) and broadcast updates
    for (const publicRoomId of Object.keys(globalState.activeUsersInPublicRoom)) {
      const socketIdSet = ensureSet(globalState.activeUsersInPublicRoom[publicRoomId]); // 🛡️ Always a Set
      const hadSocket = socketIdSet.delete(socket.id); // ➖ Remove this connection from room presence

      globalState.activeUsersInPublicRoom[publicRoomId] = socketIdSet; // 🧷 Store back (normalized)

      if (!hadSocket) continue; // ⏩ No change, skip broadcast

      io.to(publicRoomId).emit('public_presence:update', {
        room_id: publicRoomId, // 🏷️ Room identity
        users: usersFromSet(io, socketIdSet) // 👥 Current members as user snapshots
      });
    }

    // 🎈 PRIVATE live chat presence (keep array-of-snapshots model)
    for (const roomId of Object.keys(globalState.activeUsersInLiveRoom)) {
      const before = Array.isArray(globalState.activeUsersInLiveRoom[roomId])
        ? globalState.activeUsersInLiveRoom[roomId]
        : [];
      const after = before.filter((u) => u.user_id !== user_id);
      if (after.length !== before.length) {
        globalState.activeUsersInLiveRoom[roomId] = after;
        io.to(roomId).emit('room_users_update', {
          conversation_id: roomId,
          users: after
        });
      }
    }

    // 🧾 Disconnect log
    console.log(
      `🔻 Disconnected: ${name} (${role}) uid:${user_id} sid:${socket.id} reason:${reason}`
    );
  });
};

export default connectionHandler;
