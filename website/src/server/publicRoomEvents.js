/**
 * ================== publicRoomEvents.js ==================
 * 🏠 Public Live Chat — Room management (lobby + per-conversation)
 * --------------------------------------------------------------
 * Inbound events:
 *   • public_join_lobby
 *   • public_leave_lobby
 *   • public_create_chat_room  { subject?: string, owner_user_id?: string | null }
 *   • public_join_room         { public_conversation_id: string }
 *   • public_leave_room        { public_conversation_id: string }
 *
 * Outbound emits:
 *   • public_room_users_update { public_conversation_id, users }
 *   • public_live_chat_room_created { public_conversation_id, owner_id }
 *   • public_live_chat_room_ready   { public_conversation_id }
 *
 * Notes:
 *   • Presence is scoped separately under globalState.activeUsersInPublicRoom (object map).
 *   • Optional lobby presence under globalState.publicLobby (array).
 *   • Uses socket.userData (guest ids already handled in connection bootstrap).
 */

import prisma from '@/lib/core/prisma.js'; // 📦 Prisma

// 🧪 UUID verification
const isUuid = (value) => typeof value === 'string' && /^[0-9a-fA-F-]{36}$/.test(value);
