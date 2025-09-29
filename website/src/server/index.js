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
 *   1) Guard globalState shapes (arrays vs object-of-arrays) 🛡️
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

// 💬 Live Chat Event Modules
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

// ---------------------------------------------------------
// 🧩 Small helpers (keep it beginner-friendly)
// ----------------------------------------------------------
// 🧰 Coerce empty-like values to null for easier defaults
const pickValue = (value) => {
  if (value == null || value === '' || value === 'null' || value === 'undefined') return null;
  return value;
};

// 🔑 Stable presence key (guest ⇒ cookie public_identity_id, user/admin ⇒ user_id)
const getPresenceIdentityKey = (snapshot) =>
  snapshot?.role === 'guest' ? snapshot.public_identity_id : snapshot.user_id;

// 📝 Pretty presence log (count + ids only)
const logOnlineUsers = (label, list) => {
  const ids = (list || []).map((user) => getPresenceIdentityKey(user));
  console.log(`👥 ${label} → count:${ids.length} ids:${ids.join(', ') || '—'}`);
};

// ---------------------------------------------------------
// 👇  Official Connection Handler
// ---------------------------------------------------------
const connectionHandler = (io, socket, globalState) => {
  // 🛡️ Make sure globalState exists
  globalState ||= {};

  // 🗺️ Ensure Room Existance (2 arrays + 2 object-of-arrays)
  globalState.onlineUsers ||= []; // 👥 list of user snapshots
  globalState.publicLobby ||= []; // 🏠 list of lobby snapshots
  globalState.activeUsersInPublicRoom ||= {}; // 💬 { [convoId]: userData[] }
  globalState.activeUsersInLiveRoom ||= {}; // 🎈 { [convoId]: userData[] }

  // 🧯 Safety: Make sure array's are array's and object are objects
  if (!Array.isArray(globalState.onlineUsers)) globalState.onlineUsers = []; // 🚑
  if (!Array.isArray(globalState.publicLobby)) globalState.publicLobby = []; // 🚑
  if (
    typeof globalState.activeUsersInPublicRoom !== 'object' ||
    Array.isArray(globalState.activeUsersInPublicRoom)
  ) {
    globalState.activeUsersInPublicRoom = {}; // 🚑
  }
  if (
    typeof globalState.activeUsersInLiveRoom !== 'object' ||
    Array.isArray(globalState.activeUsersInLiveRoom)
  ) {
    globalState.activeUsersInLiveRoom = {}; // 🚑
  }

  // 🍪 Bind helpers to this socket
  const cookieUtils = createCookieUtils({
    cookieHeader: socket.handshake?.headers?.cookie || '',
    socket
  });
  // ---------------------------------------------------------
  // 👤  Read the handshake and create socket.userData
  // ---------------------------------------------------------
  // 📥 Read handshake query (client forwards cookie public_identity_id here) 📩
  const query = socket.handshake?.query || {}; // 📨 what you sent in `query: { … }`
  const auth = socket.handshake?.auth || {}; // 🔐 what you sent in `auth:  { … }`

  // 🧱 Basic readable values (prefer auth > query for hints; cookies are the truth for identity)
  const rawUserId = pickValue(auth.user_id) || pickValue(query.user_id);
  const rawRole = pickValue(auth.role) || pickValue(query.role);
  const rawName = pickValue(auth.name) || pickValue(query.name);
  const rawLocale = pickValue(auth.locale) || pickValue(query.locale);
  const rawPublicId = pickValue(auth.public_identity_id) || pickValue(query.public_identity_id);

  // 🧠 Resolve final values (guest ids are socket-based; stable guest identity uses cookie)
  const user_id = rawUserId || `guest-${socket.id}`; // 🆔 unique per socket when guest
  const role = rawRole || 'guest'; // 👤 'guest' | 'user' | 'admin'
  const name = rawName || user_id; // 🏷️ label for logs/UI
  const locale = rawLocale || cookieUtils.getLocaleOrDefault('en'); // 🌍 use NEXT_LOCALE cookie or 'en'
  const public_identity_id = cookieUtils.getPublicIdentityId(rawPublicId) || user_id; // 🪪 stable guest identity

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

  // 🌍 Keep live locale here for notifications/emails
  socket.data.currentLocale = socket.userData.locale;

  // ---------------------------------------------------------
  // 👥 Add the guest/user/admin — de-dupe by identity key (guest cookie or user_id)
  // ---------------------------------------------------------
  globalState.onlineUsers = globalState.onlineUsers.filter(
    (existing) => getPresenceIdentityKey(existing) !== getPresenceIdentityKey(socket.userData)
  );
  // 👥 Push the user into the onlineUsers array
  globalState.onlineUsers.push({ ...socket.userData }); // ➕ last snapshot wins

  // 📝 Log presence after add
  logOnlineUsers('onlineUsers (after connect)', globalState.onlineUsers);

  // 🛎️ Join per-user room for targeted emits
  socket.join(user_id);

  // 👑 Admins join a shared room for broadcasts
  if (socket.userData.role === 'admin') {
    socket.join('admins');
    console.log(`👑 Admin joined 'admins': ${socket.userData.name} (${socket.userData.user_id})`);
  }

  // ---------------------------------------------------------
  // ✨ Register all events
  // ---------------------------------------------------------
  // 🌍 Register locale events (seed from handshake auth/query + allow live updates)
  registerLocaleEvents(io, socket, globalState);

  // 🧩 Register all event modules (once per socket)
  registerNotificationEvents(io, socket, globalState); // 🔔 notifications
  registerUserEvents(io, socket, globalState); // 👤 user profile / presence ops
  registerRoomEvents(io, socket, globalState); // 🏠 room join/leave (LiveChat only)
  registerAccountEvents(io, socket); // 💳 account & billing
  registerMessageEvents(io, socket); // 💬 chat events

  //👤 Public Live Chat Rooms and events
  registerPublicRoomEvents(io, socket, globalState); // 🏠 Public live chat rooms
  registerPublicMessageEvents(io, socket, globalState); // 💬 Public chat events

  registerLogEvents(io, socket); // 🪵 activity logging

  // ---------------------------------------------------------
  // ✅ Auto join last room, broa
  // ---------------------------------------------------------
  // 🔁 Auto-join last public room (cookie set by client on previous session)
  const lastPublicRoomId = cookieUtils.getLastPublicRoomId();
  if (lastPublicRoomId && typeof lastPublicRoomId === 'string') {
    // 🗂️ ensure presence list exists & de-dupe by user_id inside that room
    const currentList = (globalState.activeUsersInPublicRoom[lastPublicRoomId] ||= []);
    const withoutMe = currentList.filter((user) => user.user_id !== user_id);
    globalState.activeUsersInPublicRoom[lastPublicRoomId] = [...withoutMe, { ...socket.userData }];

    // 🚪 join last public room id for this user
    socket.join(lastPublicRoomId);

    socket.emit('public_live_chat_room_ready', { public_conversation_id: lastPublicRoomId });
    io.to(lastPublicRoomId).emit('public_room_users_update', {
      public_conversation_id: lastPublicRoomId,
      users: globalState.activeUsersInPublicRoom[lastPublicRoomId]
    });

    // ✅ Log the auto join of last public room id
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

  // 🌬️ Disconnect → remove from ALL arrays
  socket.on('disconnect', (reason) => {
    // 1) 👥 Remove from onlineUsers (by identity key) and broadcast
    const identityToRemove = getPresenceIdentityKey(socket.userData);
    globalState.onlineUsers = globalState.onlineUsers.filter(
      (user) => getPresenceIdentityKey(user) !== identityToRemove
    ); // 🧹

    // 📡 Broadcast new users updated presence
    io.emit('online_users_update', globalState.onlineUsers);
    logOnlineUsers('onlineUsers (after disconnect)', globalState.onlineUsers);

    // 2) 🏠 Remove from public lobby list (by user_id)
    globalState.publicLobby = globalState.publicLobby.filter((u) => u.user_id !== user_id);
    io.to('public_live_chat_lobby').emit('public_room_users_update', {
      room_id: 'public_live_chat_lobby',
      users: globalState.publicLobby
    });

    // 3) 💬 Remove from each PUBLIC room presence (by user_id)
    for (const roomId of Object.keys(globalState.activeUsersInPublicRoom)) {
      const before = globalState.activeUsersInPublicRoom[roomId] || [];
      const after = before.filter((u) => u.user_id !== user_id);
      if (after.length !== before.length) {
        globalState.activeUsersInPublicRoom[roomId] = after;
        io.to(roomId).emit('public_room_users_update', {
          public_conversation_id: roomId,
          users: after
        });
      }
    }

    // 4) 🎈 Remove from each PRIVATE LiveChat room presence (by user_id)
    for (const roomId of Object.keys(globalState.activeUsersInLiveRoom)) {
      const before = globalState.activeUsersInLiveRoom[roomId] || [];
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
