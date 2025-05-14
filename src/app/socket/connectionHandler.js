// 🔗 src/server/connectionHandler.js
/**
 * connectionHandler
 * -----------------
 * Entrypoint for each new socket connection:
 * - Parses user identity from handshake (real or guest)
 * - Seeds in-memory tracking structures
 * - Registers all feature modules below
 */

import registerMessageEvents from './events/messageEvents.js';
import registerRoomEvents from './events/roomEvents.js';
import registerSubscriptionEvents from './events/subscriptionEvents.js';
import registerFreeTrialEvents from './events/freeTrialEvents.js';
import registerUserEvents from './events/userEvents.js';

const connectionHandler = (io, socket, prisma, globalState) => {
  // Ensure in-memory stores exist
  globalState.onlineUsers ||= {};
  globalState.activeUsersInRoom ||= {};
  globalState.activeUsersInBubbleRoom ||= {};

  // ─── Identify user (real or guest) ───────────────────────────────
  let { user_id, role, name } = socket.handshake.query;
  role = role || 'guest';

  // Guests get a synthetic ID based on socket ID
  if (role === 'guest' || !user_id) {
    user_id = `guest-${socket.id}`;
  }

  // Friendly “Guest 1, Guest 2, …”
  if (role === 'guest') {
    const existing = Object.values(globalState.onlineUsers)
      .filter((u) => u.role === 'guest' && u.name?.startsWith('Guest'))
      .map((u) => Number(u.name.replace('Guest ', '')))
      .filter((n) => !isNaN(n));
    const next = existing.length ? Math.max(...existing) + 1 : 1;
    name = `Guest ${next}`;
  }

  // Attach to socket + broadcast initial online list
  socket.userData = { user_id, role, name };
  globalState.onlineUsers[user_id] = socket.userData;
  io.emit('online_users_update', Object.values(globalState.onlineUsers));

  console.log(`✅ Connected: ${name} (${role}) uid:${user_id}`);

  // ─── Register all event modules ───────────────────────────────────

  registerSubscriptionEvents(io, socket, prisma);
  registerFreeTrialEvents(io, socket, prisma);
  registerUserEvents(io, socket, globalState);
  registerMessageEvents(io, socket, prisma); // handles live & bubble
  registerRoomEvents(io, socket, prisma, globalState); // handles live & bubble
};

export default connectionHandler;
