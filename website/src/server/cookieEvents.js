/**
 * ========== src/server/cookieEvents.js ==========
 * 🍪 Cookie helpers for Socket server (simple + readable)
 * ------------------------------------------------------
 * Exposes:
 *   • getCookie(name) → read from handshake headers
 *   • getPublicIdentityId(queryPublicId) → prefer query, else cookie, else null
 *   • getLastPublicRoomId() → read last open room cookie
 *   • emitRememberLastRoom(public_conversation_id, maxAgeDays?) → ask client to set cookie
 *   • emitForgetLastRoom() → ask client to clear cookie
 *
 * Note:
 *   - Server can read HttpOnly cookies from the handshake header ✅
 *   - Server cannot write browser cookies over a socket ❌
 *   - So we emit tiny events for the client to set/clear non-HttpOnly cookies ✅
 */

// 🧷 Cookie names used across the app
export const COOKIE_PUBLIC_ID = 'public_identity_id'; // 🪪 HttpOnly (set by Next middleware)
export const COOKIE_LAST_ROOM = 'public_last_conversation_id'; // 🧷 non-HttpOnly (set by client)

// 📡 Event names for client cookie writes
export const EV_COOKIE_SET_LAST_ROOM = 'public_cookie:set_last_room';
export const EV_COOKIE_CLEAR_LAST_ROOM = 'public_cookie:clear_last_room';

// 🧁 Tiny cookie reader
function readCookie(cookieHeader, cookieName) {
  // 🚪 Handle empty inputs early
  if (!cookieHeader || !cookieName) {
    console.log(`[SOCKET COOKIE] readCookie → missing input`);
    return null;
  }

  // 🍪 Split the raw "cookie" header into key=value chunks
  const cookiePairs = cookieHeader.split(';');

  // 🔎 Walk each chunk and look for the exact cookie name
  for (const rawPair of cookiePairs) {
    // 🧼 Trim spaces around "key=value"
    const pair = rawPair.trim();

    // 🔧 Find the first "=" that separates key and value
    const equalsIndex = pair.indexOf('=');
    if (equalsIndex === -1) continue; // 🛑 Skip malformed pieces

    // 🏷️ Pull out key and value
    const key = pair.slice(0, equalsIndex);
    const rawValue = pair.slice(equalsIndex + 1);

    // ✅ Match by exact cookie name
    if (key === cookieName) {
      // 🧵 Try to decode percent-encoded values, fall back safely
      try {
        console.log(`[SOCKET COOKIE] decoded raw cookie value: ${decodeURIComponent(rawValue)}`);
        return decodeURIComponent(rawValue);
      } catch {
        return rawValue;
      }
    }
  }

  // ❌ Not foundS
  return null;
}

/**
 * 🧰 Factory: create simple cookie helpers bound to a socket
 * ---------------------------------------------------------
 * Provide the header & socket once, reuse helpers in any event file.
 */
export default function createCookieUtils({ cookieHeader, socket }) {
  // 🔐 Keep local references
  const rawHeader = cookieHeader || '';
  const currentSocket = socket;

  // 🔎 Read any cookie from the handshake header
  const getCookie = (name) => readCookie(rawHeader, name);

  // 🪪 Resolve public identity (prefer query value if provided)
  const getPublicIdentityId = (queryPublicId) =>
    queryPublicId || getCookie(COOKIE_PUBLIC_ID) || null;

  // 🧷 Read last open room id (non-HttpOnly cookie, set on client)
  const getLastPublicRoomId = () => getCookie(COOKIE_LAST_ROOM);

  // 📝 Ask client to remember last room (client will set document.cookie)
  const emitRememberLastRoom = (public_conversation_id, maxAgeDays = 14) => {
    if (!currentSocket) return;
    currentSocket.emit(EV_COOKIE_SET_LAST_ROOM, {
      cookieName: COOKIE_LAST_ROOM,
      public_conversation_id,
      maxAgeDays
    });
  };

  // 🧽 Ask client to clear the last room cookie
  const emitForgetLastRoom = () => {
    if (!currentSocket) return;
    currentSocket.emit(EV_COOKIE_CLEAR_LAST_ROOM, {
      cookieName: COOKIE_LAST_ROOM
    });
  };

  // 📦 Return a tiny toolkit (human-readable names)
  return {
    getCookie, // 🔎 read any cookie from header
    getPublicIdentityId, // 🪪 resolve stable identity
    getLastPublicRoomId, // 🧷 read last open room id
    emitRememberLastRoom, // 📝 request client to set cookie
    emitForgetLastRoom // 🧽 request client to clear cookie
  };
}
