/**
 * ================== publicRoomEvents.js ==================
 * 🏠 Public Live Chat — Room Management
 * ---------------------------------------------------------
 * Purpose: Wire up all Socket.IO handlers for the public live chat area.
 *
 * Responsibilities:
 *   • Creates new conversations on demand and remembers the creator’s last room via cookies.
 *   • Manages room membership using stable identity keys (guest cookie or user UUID) so presence
 *     tracking survives reconnects and multiple tabs.
 *   • Emits unified presence snapshots (`public_presence:update`) whenever participants join,
 *     leave, or rooms close, keeping widgets in sync.
 *   • Supports admin-only workflows: closing rooms, listing conversations, and broadcasting
 *     lifecycle updates to the admin hub without auto-joining every room.
 *
 * Key Events:
 *   IN:  public_room:create, public_room:join, public_room:leave, public_room:close,
 *        public_room:admin_list_request
 *   OUT: public_room:ready, public_room:created, public_room:closed, public_room:closed_admin,
 *        public_room:user_left, public_room:admin_list_snapshot, public_room:error,
 *        public_presence:update
 */
import prisma from '../lib/core/prisma.js';
import { createCookieUtils } from './cookieEvents.js';

// 🧰 Helper: Check if string is valid UUID
const isUuid = (v) => typeof v === 'string' && /^[0-9a-fA-F-]{36}$/.test(v);

export default function registerPublicRoomEvents(io, socket, globalState) {
  /* =========================================================
   * 🔧 HELPERS FOR ROOM EVENT FILE
   * =======================================================*/
  // 🍪 Bind cookie helpers to this socket
  const cookieUtils = createCookieUtils({
    cookieHeader: socket.handshake?.headers?.cookie || '',
    socket
  });

  // 📦 Initialize global state (ensure objects exist)
  globalState.activeUsersInPublicRoom = globalState.activeUsersInPublicRoom || {};

  // 🧭 Stable identity for presence tracking (guest cookie vs user UUID)
  const getPublicPresenceKey = (userData = {}) => {
    if (userData.role === 'guest') return userData.public_identity_id;
    return userData.user_id;
  };

  // 🛡️ Ensure room presence map exists (identity → snapshot)
  const ensureRoomPresence = (state, roomId) => {
    const current = state[roomId];
    if (current instanceof Map) return current;
    const next = new Map();
    state[roomId] = next;
    return next;
  };

  // 📣 Broadcast helpers use identity snapshots
  const formatPresenceSnapshot = (presenceEntry) => ({
    identity: presenceEntry.identity,
    name: presenceEntry.name,
    role: presenceEntry.role,
    joinedAt: presenceEntry.joinedAt
  });

  // 👥 Collect a room's current presence list without mutating state
  const collectRoomPresence = (roomId) => {
    const roomPresence = globalState.activeUsersInPublicRoom[roomId];
    if (!roomPresence || !(roomPresence instanceof Map)) return [];
    return Array.from(roomPresence.values()).map(formatPresenceSnapshot);
  };

  // 📣 HELPER: Broadcast presence update for specific room
  const broadcastRoomPresence = (roomId) => {
    const users = collectRoomPresence(roomId);
    console.log(
      `[Public Presence] Broadcasting ${users.length} member(s) in ${roomId}: ${
        users.map((u) => u.identity).join(', ') || 'none'
      }`
    );
    io.to(roomId).emit('public_presence:update', { room_id: roomId, users });
  };

  /* =========================================================
   * 🏠 ROOM CREATE
   * =======================================================*/
  socket.on('public_room:create', async ({ subject, owner_user_id } = {}) => {
    console.log(`[Public Room] 🆕 Creating room: "${subject || 'Public Live Chat'}"`);

    try {
      // 🧱 Build data for database
      const data = {
        subject: subject || 'Public Live Chat',
        read: false
      };

      // 👤 Link owner if authenticated user
      if (owner_user_id && isUuid(owner_user_id)) {
        const owner = await prisma.user.findUnique({
          where: { user_id: owner_user_id },
          select: { user_id: true, role: true }
        });

        if (owner && owner.role !== 'guest') {
          data.owner_id = owner_user_id;
        }
      }

      // 🪪 Use guest ID if no authenticated owner
      if (!data.owner_id && socket.userData.role === 'guest') {
        data.owner_guest_id = socket.userData.public_identity_id;
      }

      // 💾 Create conversation in database
      const conversation = await prisma.publicLiveChatConversation.create({
        data,
        select: {
          public_conversation_id: true,
          owner_id: true,
          owner_guest_id: true,
          subject: true
        }
      });

      const roomId = conversation.public_conversation_id;

      // 🧭 Track presence by stable identity
      const roomPresence = ensureRoomPresence(globalState.activeUsersInPublicRoom, roomId);
      const identityKey = getPublicPresenceKey(socket.userData);
      roomPresence.set(identityKey, {
        identity: identityKey,
        name: socket.userData.name,
        role: socket.userData.role,
        joinedAt: new Date().toISOString()
      });

      // 🚪 Join Socket.IO room
      socket.join(roomId);

      // 🧠 Persist creator’s room so reconnects land back here
      // 🍪 Remember this room (survives refresh/redirect)
      cookieUtils.rememberLastRoom(roomId);

      console.log(`[Public Room] ✅ Room created: ${roomId}`);

      // 📣 Tell creator their room is ready
      socket.emit('public_room:ready', {
        public_conversation_id: roomId,
        subject: conversation.subject
      });

      // 📣 Tell everyone in the room it was created
      io.to(roomId).emit('public_room:created', {
        public_conversation_id: roomId,
        owner_id: conversation.owner_id,
        owner_guest_id: conversation.owner_guest_id,
        subject: conversation.subject,
        is_closed: false
      });

      // 📡 Broadcast presence snapshot
      broadcastRoomPresence(roomId);
    } catch (error) {
      console.error('[Public Room] ❌ Create failed:', error.message);
      socket.emit('public_room:error', {
        code: 'CREATE_FAILED',
        message: 'Failed to create public conversation.'
      });
    }
  });

  /* =========================================================
   * 🚪 ROOM JOIN
   * =======================================================*/
  socket.on('public_room:join', async ({ public_conversation_id } = {}) => {
    if (!isUuid(public_conversation_id)) {
      console.warn(`[Public Room] ⚠️ Invalid room ID: ${public_conversation_id}`);
      return;
    }

    try {
      // 🔍 Ensure the room still exists before letting the user in
      const conversation = await prisma.publicLiveChatConversation.findUnique({
        where: { public_conversation_id },
        select: {
          public_conversation_id: true,
          is_closed: true
        }
      });

      if (!conversation) {
        console.warn(`[Public Room] ⚠️ Tried to join non-existing room: ${public_conversation_id}`);
        socket.emit('public_room:error', {
          code: 'ROOM_NOT_FOUND',
          message: 'Public conversation no longer exists.'
        });
        cookieUtils.forgetLastRoom();
        return;
      }

      console.log(
        `[Public Room] ✅ User joining: ${socket.userData.name} → ${public_conversation_id}`
      );

      const identityKey = getPublicPresenceKey(socket.userData);
      const roomPresence = ensureRoomPresence(
        globalState.activeUsersInPublicRoom,
        public_conversation_id
      );

      roomPresence.set(identityKey, {
        identity: identityKey,
        name: socket.userData.name,
        role: socket.userData.role,
        joinedAt: new Date().toISOString()
      });

      // 🚪 Join Socket.IO room
      socket.join(public_conversation_id);

      // 🧠 Persist visitor’s last active room for seamless refresh resume
      cookieUtils.rememberLastRoom(public_conversation_id);

      broadcastRoomPresence(public_conversation_id);
    } catch (error) {
      console.error('[Public Room] ❌ Join failed:', error.message);
      socket.emit('public_room:error', {
        code: 'JOIN_FAILED',
        message: 'Could not join public conversation.'
      });
    }
  });

  /* =========================================================
   * 🚪 ROOM LEAVE
   * =======================================================*/
  socket.on('public_room:leave', ({ public_conversation_id } = {}) => {
    if (!isUuid(public_conversation_id)) {
      console.warn(`[Public Room] ⚠️ Invalid room ID: ${public_conversation_id}`);
      return;
    }

    console.log(
      `[Public Room] 👋 User leaving: ${socket.userData.name} ← ${public_conversation_id}`
    );

    // ➖ Remove user from room tracking
    const identityKey = getPublicPresenceKey(socket.userData);
    const roomPresence = ensureRoomPresence(
      globalState.activeUsersInPublicRoom,
      public_conversation_id
    );

    // ❌ Delete the presence of the guest/user or admin
    roomPresence.delete(identityKey);

    // 🚪 Leave Socket.IO room
    socket.leave(public_conversation_id);

    // 🍪 Forget this room
    cookieUtils.forgetLastRoom();

    // 📣 Broadcast updated presence
    broadcastRoomPresence(public_conversation_id);

    const leftPayload = {
      public_conversation_id,
      user_name: socket.userData?.name || 'Guest',
      role: socket.userData?.role || 'guest',
      occurredAt: new Date().toISOString()
    };

    // 📤 Let everyone (room + admins) know the participant stepped away
    io.to(public_conversation_id).emit('public_room:user_left', leftPayload);
    io.to('admins').emit('public_room:user_left', leftPayload);
  });

  /* =========================================================
   * 🧹 ROOM CLOSE (SOFT DELETE / ARCHIVE)
   * =======================================================*/
  socket.on('public_room:close', async ({ public_conversation_id } = {}) => {
    if (!isUuid(public_conversation_id)) {
      console.warn(`[Public Room] ⚠️ Invalid room ID for close: ${public_conversation_id}`);
      return;
    }

    if (socket.userData?.role !== 'admin') {
      console.warn('[Public Room] ⛔ Non-admin attempted to close conversation');
      socket.emit('public_room:error', {
        code: 'NOT_ALLOWED',
        message: 'Only admins can close public conversations.'
      });
      return;
    }

    try {
      const existing = await prisma.publicLiveChatConversation.findUnique({
        where: { public_conversation_id },
        select: {
          public_conversation_id: true,
          is_closed: true,
          subject: true
        }
      });

      if (!existing) {
        console.warn(
          `[Public Room] ⚠️ Tried to close non-existing room: ${public_conversation_id}`
        );
        return;
      }

      if (!existing.is_closed) {
        await prisma.publicLiveChatConversation.update({
          where: { public_conversation_id },
          data: { is_closed: true }
        });
      }

      console.log(`[Public Room] 🧹 Closing room: ${public_conversation_id}`);

      const closedPayload = {
        public_conversation_id,
        is_closed: true,
        closedAt: new Date().toISOString()
      };

      io.to(public_conversation_id).emit('public_room:closed', closedPayload);

      io.to('admins').emit('public_room:closed_admin', {
        ...closedPayload,
        subject: existing.subject || 'Public Chat'
      });

      const roomPresence = globalState.activeUsersInPublicRoom[public_conversation_id];
      if (roomPresence instanceof Map) {
        roomPresence.clear();
      }

      const adapterRoom = io.sockets.adapter.rooms.get(public_conversation_id);
      if (adapterRoom) {
        for (const socketId of adapterRoom) {
          io.sockets.sockets.get(socketId)?.leave(public_conversation_id);
        }
      }

      // 🛰️ Emit an empty presence snapshot so UI clears lingering avatars
      broadcastRoomPresence(public_conversation_id);
      delete globalState.activeUsersInPublicRoom[public_conversation_id];
    } catch (error) {
      console.error('[Public Room] ❌ Close failed:', error.message);
      socket.emit('public_room:error', {
        code: 'CLOSE_FAILED',
        message: 'Failed to close public conversation.'
      });
    }
  });

  /* =========================================================
   * 💡 ADMIN LIST
   * =======================================================*/
  socket.on(
    'public_room:admin_list_request',
    async ({ includeClosed = false, limit = 25 } = {}) => {
      // Only admins should ever hit this endpoint.
      if (socket.userData?.role !== 'admin') {
        console.warn('[Public Room] ⛔ Non-admin requested admin list');
        socket.emit('public_room:error', {
          code: 'NOT_ALLOWED',
          message: 'Only admins can load the public chat list.'
        });
        return;
      }

      // Clamp the requested batch size so a single admin can’t overload the query.
      const parsedLimit = Number.parseInt(limit, 10);
      const safeLimit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 100) : 25;

      try {
        // 🗂️ Fetch recent conversations (open by default, optionally include closed)
        const conversations = await prisma.publicLiveChatConversation.findMany({
          where: includeClosed ? {} : { is_closed: false },
          orderBy: { updatedAt: 'desc' },
          take: safeLimit,
          select: {
            public_conversation_id: true,
            subject: true,
            owner_id: true,
            owner_guest_id: true,
            is_closed: true,
            read: true,
            createdAt: true,
            updatedAt: true,
            owner: { select: { user_id: true, name: true, role: true } }
          }
        });

        // 🧾 Normalize DB rows into the admin snapshot structure
        const snapshot = conversations.map((conversation) => {
          const presence = collectRoomPresence(conversation.public_conversation_id);
          const nonAdminPresent = presence.some((user) => user.role !== 'admin');

          return {
            public_conversation_id: conversation.public_conversation_id,
            subject: conversation.subject || 'Public Live Chat',
            owner_id: conversation.owner_id,
            owner_guest_id: conversation.owner_guest_id,
            owner_name:
              conversation.owner?.name || (conversation.owner_guest_id ? 'Guest visitor' : 'Guest'),
            owner_role: conversation.owner?.role || 'guest',
            is_closed: conversation.is_closed,
            read: conversation.read,
            createdAt:
              conversation.createdAt instanceof Date
                ? conversation.createdAt.toISOString()
                : conversation.createdAt,
            updatedAt:
              conversation.updatedAt instanceof Date
                ? conversation.updatedAt.toISOString()
                : conversation.updatedAt,
            userHasLeft: conversation.is_closed ? true : !nonAdminPresent,
            presence,
            presence_count: presence.length
          };
        });

        // 🚀 Send the snapshot and note whether closed rooms were requested
        console.log(
          `[Public Room] 📋 Admin list snapshot (${snapshot.length} rooms, includeClosed=${includeClosed})`
        );

        socket.emit('public_room:admin_list_snapshot', {
          conversations: snapshot,
          includeClosed: Boolean(includeClosed),
          generatedAt: new Date().toISOString()
        });
      } catch (error) {
        // 💥 Surface query issues to the admin client for visibility
        console.error('[Public Room] ❌ Admin list failed:', error.message);
        socket.emit('public_room:error', {
          code: 'ADMIN_LIST_FAILED',
          message: 'Failed to load public conversations for admins.'
        });
      }
    }
  );
}
