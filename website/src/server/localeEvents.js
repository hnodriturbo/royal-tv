/**
 * ==================== localeEvents.js ====================
 * 🌍 Socket.IO locale handling
 *
 * ✅ Seed from handshake (query.auth.locale or query param)
 * ✅ Update at runtime via `set_locale`
 * 🚫 Never read/write DB for locale (runtime only)
 * ==========================================================
 */

// 🌍 Normalize locale into supported values
function normalizeToSupportedLocale(value) {
  const v = String(value || '').toLowerCase();
  if (v.startsWith('is')) return 'is'; // 🇮🇸
  return 'en'; // 🇬🇧 fallback
}

export default function registerLocaleEvents(io, socket) {
  // 🌱 Seed locale once from handshake
  const handshakeLocale = socket.handshake?.auth?.locale || socket.handshake?.query?.locale;
  socket.data.currentLocale = normalizeToSupportedLocale(handshakeLocale);

  // 🔁 Update when client sends new locale
  socket.on('set_locale', (payload) => {
    const target = normalizeToSupportedLocale(payload?.locale);
    if (target === socket.data.currentLocale) return; // ⏩ no change

    // 🌍 Update runtime values
    socket.data.currentLocale = target;
    socket.userData = socket.userData || {};
    socket.userData.locale = target;

    // ✅ Confirm back to client
    socket.emit('locale_changed', { locale: target });
    console.log(
      `Emitted Locale Change. New Locale: ${socket.userData.locale || socket.data.currentLocale}`
    );
  });
}
