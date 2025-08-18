// 🌍 localeEvents.js
/**
 * Socket-level locale sync.
 * - Keep a per-socket currentLocale derived from the handshake.
 * - Allow client to update locale later with `set_locale`.
 * - Store English in DB elsewhere; locale is only for runtime messages/UI.
 */

const SUPPORTED_LOCALES = ['en', 'is']; // 🧭 single source of truth

// 🧼 Normalize any input into one of the supported locales (default: 'en')
function normalizeToSupportedLocale(candidate) {
  // 📝 turn anything into a lowercase string and compare
  const value = String(candidate || '').toLowerCase();
  return SUPPORTED_LOCALES.includes(value) ? value : 'en';
}

export default function registerLocaleEvents(io, socket) {
  // 🏁 derive initial locale from handshake (auth first, then header)
  const handshakeLocale =
    socket.handshake?.auth?.locale ||
    socket.handshake?.headers?.['x-locale'] ||
    socket.handshake?.headers?.['accept-language'];

  // 💾 set currentLocale on the socket
  socket.data.currentLocale = normalizeToSupportedLocale(handshakeLocale);

  // 📣 let the client know what the server stored
  socket.emit('locale_changed', { locale: socket.data.currentLocale });

  // 🔄 allow the client to update locale later
  socket.on('set_locale', (payload) => {
    const nextLocale = normalizeToSupportedLocale(payload?.locale);
    if (nextLocale === socket.data.currentLocale) return;

    socket.data.currentLocale = nextLocale;

    // 🔔 ack back to this socket (and optionally a room if you prefer)
    socket.emit('locale_changed', { locale: nextLocale });
  });
}
