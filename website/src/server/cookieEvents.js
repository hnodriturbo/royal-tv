/**
 * 🍪 Cookie utilities for Socket.IO events
 * - Read cookies from socket handshake
 * - Ask client to set/clear cookies via events
 * - Used for public live chat identity, last room, locale
 */

// 🧷 Cookie names (constants for consistency)
export const COOKIE_PUBLIC_ID = 'public_identity_id';
export const COOKIE_LAST_ROOM = 'public_last_conversation_id';
export const COOKIE_LOCALE = 'NEXT_LOCALE';

// 📡 Events to ask client to manage cookies
export const EVENT_COOKIE_SET_LAST_ROOM = 'public_cookie:set_last_room';
export const EVENT_COOKIE_CLEAR_LAST_ROOM = 'public_cookie:clear_last_room';

/**
 * 🔎 Read a cookie from the raw "cookie" header string
 * @param {string} cookieHeader - Raw cookie header from socket.handshake.headers.cookie
 * @param {string} cookieName - Name of cookie to find
 * @returns {string|null} Cookie value or null
 */
function readCookie(cookieHeader, cookieName) {
  if (!cookieHeader || !cookieName) return null;

  const cookies = cookieHeader.split(';');

  for (const cookie of cookies) {
    const [key, rawValue] = cookie.trim().split('=');

    if (key === cookieName) {
      try {
        const decodedValue = decodeURIComponent(rawValue);
        console.log('Decoded cookie value:', decodedValue);
        return decodedValue;
      } catch {
        return rawValue;
      }
    }
  }

  return null;
}

/**
 * 🧰 Create cookie utilities bound to a specific socket
 * @param {Object} config - Configuration object
 * @param {string} config.cookieHeader - Raw cookie header
 * @param {Socket} config.socket - Socket.IO socket instance
 * @returns {Object} Cookie utility functions
 */
export function createCookieUtils({ cookieHeader, socket }) {
  const rawCookieHeader = cookieHeader || '';

  return {
    // 🔎 Read any cookie by name
    getCookie: (cookieName) => {
      return readCookie(rawCookieHeader, cookieName);
    },

    // 🪪 Get stable public identity (prefer query, fallback to cookie)
    getPublicIdentityId: (queryPublicId) => {
      const query = (queryPublicId || '').trim();
      const cookie = readCookie(rawCookieHeader, COOKIE_PUBLIC_ID);
      return query || cookie || null;
    },

    // 🧷 Get last room ID from cookie
    getLastPublicRoomId: () => {
      return readCookie(rawCookieHeader, COOKIE_LAST_ROOM);
    },

    // 🌍 Get locale or default to 'en'
    getLocaleOrDefault: (defaultLocale = 'en') => {
      return readCookie(rawCookieHeader, COOKIE_LOCALE) || defaultLocale;
    },

    // 📝 Ask client to remember last room (client sets cookie)
    rememberLastRoom: (public_conversation_id, maxAgeDays = 14) => {
      if (!socket) return;
      socket.emit(EVENT_COOKIE_SET_LAST_ROOM, {
        cookieName: COOKIE_LAST_ROOM,
        public_conversation_id,
        maxAgeDays
      });
    },

    // 🧽 Ask client to forget last room (client clears cookie)
    forgetLastRoom: () => {
      if (!socket) return;
      socket.emit(EVENT_COOKIE_CLEAR_LAST_ROOM, {
        cookieName: COOKIE_LAST_ROOM
      });
    }
  };
}

// ✅ Default export for backwards compatibility
export default createCookieUtils;
