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
  //    • publicLobby: Set of socket IDs
  //    • activeUsersInPublicRoom: { [roomId]: Set<socketId> }
  //    • activeUsersInLiveRoom: keep your existing array-of-snapshots model for private chat
  globalState.onlineUsers = Array.isArray(globalState.onlineUsers) ? globalState.onlineUsers : [];

  globalState.publicLobby = ensureSet(globalState.publicLobby);

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
  globalState.onlineUsers = globalState.onlineUsers.filter(
    (existing) => getPresenceIdentityKey(existing) !== getPresenceIdentityKey(socket.userData)
  );
  globalState.onlineUsers.push({ ...socket.userData }); // ➕ add snapshot

  // 📝 Log presence after add
  logOnlineUsers('onlineUsers (after connect)', globalState.onlineUsers);

  // 🛎️ Join per-user room for targeted emits
  socket.join(user_id);

  // 👑 Admins join a shared room for broadcasts
  if (socket.userData.role === 'admin') {
    socket.join('admins');
    console.log(`👑 Admin joined 'admins': ${socket.userData.name} (${socket.userData.user_id})`);

    // 🔄 AUTO-JOIN ALL EXISTING PUBLIC ROOMS (critical for admin to see conversations)
    (async () => {
      try {
        const activeRooms = await prisma.publicLiveChatConversation.findMany({
          where: { read: false },
          select: {
            public_conversation_id: true,
            subject: true,
            owner_id: true,
            owner_guest_id: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' }
        });

        for (const room of activeRooms) {
          const roomId = room.public_conversation_id;

          // Join Socket.IO room
          socket.join(roomId);

          // Add to tracking
          if (!globalState.activeUsersInPublicRoom[roomId]) {
            globalState.activeUsersInPublicRoom[roomId] = new Set();
          }
          globalState.activeUsersInPublicRoom[roomId].add(socket.id);

          // Fetch recent messages for this room (last 50)
          const messages = await prisma.publicLiveChatMessage.findMany({
            where: { public_conversation_id: roomId },
            orderBy: { createdAt: 'asc' },
            take: 50,
            include: {
              user: {
                select: { name: true, username: true }
              }
            }
          });

          // Notify admin about this existing conversation WITH messages
          socket.emit('public_room:new_conversation', {
            public_conversation_id: roomId,
            subject: room.subject || 'Public Chat',
            owner_name: 'User', // Will be enriched by client
            owner_role: room.owner_id ? 'user' : 'guest',
            createdAt: room.createdAt,
            messages: messages.map((msg) => ({
              public_message_id: msg.public_message_id,
              public_conversation_id: msg.public_conversation_id,
              message: msg.message,
              sender_user_id: msg.sender_user_id || null,
              sender_guest_id: msg.sender_guest_id || null,
              sender_is_admin: !!msg.sender_is_admin,
              sender_is_bot: !!msg.sender_is_bot,
              createdAt: msg.createdAt,
              updatedAt: msg.updatedAt
            }))
          });
        }

        console.log(`👑 Admin auto-joined ${activeRooms.length} existing rooms with messages`);
      } catch (error) {
        console.error('❌ Failed to auto-join admin to existing rooms:', error.message);
      }
    })();
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
    // 1) 👥 Remove from onlineUsers (by identity key) and broadcast
    const identityToRemove = getPresenceIdentityKey(socket.userData);
    globalState.onlineUsers = globalState.onlineUsers.filter(
      (user) => getPresenceIdentityKey(user) !== identityToRemove
    );
    io.emit('online_users_update', globalState.onlineUsers);
    logOnlineUsers('onlineUsers (after disconnect)', globalState.onlineUsers);

    // 2) 🏢 Remove from PUBLIC lobby Set (by socket.id) and broadcast presence
    if (globalState.publicLobby instanceof Set) {
      const beforeSize = globalState.publicLobby.size;
      globalState.publicLobby.delete(socket.id); // ➖ remove this socket
      if (globalState.publicLobby.size !== beforeSize) {
        io.to('PUBLIC_LOBBY').emit('public_presence:update', {
          room_id: 'PUBLIC_LOBBY',
          users: usersFromSet(io, globalState.publicLobby)
        });
      }
    } else {
      // 🧯 fallback if someone mutated it elsewhere
      globalState.publicLobby = ensureSet(globalState.publicLobby);
    }

    // 3) 💬 Remove from each PUBLIC room Set (by socket.id) and broadcast
    for (const roomId of Object.keys(globalState.activeUsersInPublicRoom)) {
      const set = ensureSet(globalState.activeUsersInPublicRoom[roomId]);
      const beforeSize = set.size;
      set.delete(socket.id);
      globalState.activeUsersInPublicRoom[roomId] = set;
      if (set.size !== beforeSize) {
        io.to(roomId).emit('public_presence:update', {
          room_id: roomId,
          users: usersFromSet(io, set)
        });
      }
    }

    // 4) 🎈 PRIVATE live chat presence (keep array-of-snapshots model)
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
