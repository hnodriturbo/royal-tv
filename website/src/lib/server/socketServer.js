/**
 *   =============== socketServer.js ===============
 * 🚀 Standalone Socket.IO server + Express HTTP bridge
 * 🌍 Locale policy:
 *    - Use `socket.data.currentLocale` for emits/emails when socket exists.
 *    - When no live socket, derive locale from HTTP header `x-locale` or `accept-language`.
 *    - Never read/write DB for locale.
 * =================================================
 */

import dotenv from 'dotenv';
dotenv.config();

// 🌍 Preload translations once from MESSAGES_DIR
import { readFileSync, existsSync } from 'node:fs'; // 📖 read json safely
import path from 'node:path'; // 🛣️ build cross-OS paths

// 🧠 small helper: load both lang files from a base dir
const loadPair = (baseDir) => ({
  en: JSON.parse(readFileSync(path.join(baseDir, 'en.json'), 'utf8')), // 🇬🇧
  is: JSON.parse(readFileSync(path.join(baseDir, 'is.json'), 'utf8')) // 🇮🇸
});

// 🚀 resilient preloader (tries ENV, then <cwd>/src/messages, else leaves undefined)
(function preloadTranslations() {
  // 1) 🔍 ENV override (best for prod/PM2)
  const fromEnv = process.env.MESSAGES_DIR;
  if (fromEnv) {
    try {
      const enOk = existsSync(path.join(fromEnv, 'en.json')); // ✅ files exist?
      const isOk = existsSync(path.join(fromEnv, 'is.json'));
      if (enOk && isOk) {
        globalThis.__ROYAL_TRANSLATIONS__ = loadPair(fromEnv); // 🧰 set dictionaries
        console.log('[socket:i18n] ✅ Translations loaded from', fromEnv); // 📣 log success
        return; // 🏁 done
      }
      console.warn('[socket:i18n] ⚠️ MESSAGES_DIR set but en.json/is.json missing at', fromEnv); // 🤷
    } catch (e) {
      console.warn('[socket:i18n] ⚠️ Failed reading MESSAGES_DIR:', e.message); // 🧱
    }
  } else {
    console.warn('[socket:i18n] ⚠️ MESSAGES_DIR not set (will try CWD fallback)…'); // 🧭
  }

  // 2) 🧰 Default: <project CWD>/src/messages (works on Linux/Windows alike)
  try {
    const fallback = path.resolve(process.cwd(), 'src', 'messages'); // 🗺️
    const enOk = existsSync(path.join(fallback, 'en.json'));
    const isOk = existsSync(path.join(fallback, 'is.json'));
    if (enOk && isOk) {
      globalThis.__ROYAL_TRANSLATIONS__ = loadPair(fallback); // 🧰 set dictionaries
      console.log('[socket:i18n] ✅ Translations loaded from', fallback); // 🎉
      return; // 🏁 done
    }
    console.warn('[socket:i18n] ⚠️ No dictionaries at', fallback); // 👀
  } catch (e) {
    console.warn('[socket:i18n] ⚠️ Failed reading default messages:', e.message); // 🧱
  }

  // 3) 🙅 Final: leave global UNDEFINED so `notificationEvents.js` can seed it later
  console.warn(
    '[socket:i18n] ❌ Could not preload translations; deferring to notificationEvents.js'
  ); // 🕊️
})();

import express from 'express'; // 🌉 http bridge
import { createServer as createHttpServer } from 'http'; // 🔌 server
import { Server } from 'socket.io'; // 📡 sockets
import { instrument } from '@socket.io/admin-ui'; // 🛠️ admin ui

// 🔔 notifications (default export + named helper)
import registerNotificationEvents, {
  createAndDispatchNotification
} from '../../server/notificationEvents.js';

// 🌍 locale handshake + updates (no DB persistence)
import registerLocaleEvents from '../../server/localeEvents.js';

// 🧩 your other connection logic (rooms, guards, etc.)
import connectionHandler from '../../server/index.js';

// 🌍 Normalize incoming header locale (no DB)
function normalizeLocaleFromHeaderValue(value) {
  const v = String(value || '').toLowerCase();
  if (v.startsWith('is')) return 'is';
  return 'en';
}

// 🧠 helper when there is no live socket for the user
function resolveLocaleFromRequestHeaders(request) {
  const headerLocale =
    request.get?.('x-locale') ||
    request.headers?.['x-locale'] ||
    request.headers?.['accept-language'] ||
    'en';
  const normalized = normalizeLocaleFromHeaderValue(headerLocale);
  console.log(`[SOCKET SERVER] Locale from HTTP header → ${headerLocale} → ${normalized}`);
  return normalized;
}

// ========== Express HTTP bridge ==========
const app = express();
app.use(express.json()); // // 🧰 parse JSON

// 👀 dev-friendly access log
app.use((request, response, next) => {
  console.log(`[SOCKET SERVER] Incoming: ${request.method} ${request.url}`);
  next();
});

// 💳 POST /emit/transactionFinished → emit localized notifications
app.post('/emit/transactionFinished', async (request, response) => {
  const { userId, user, payment, subscription } = request.body;

  // 🔎 find existing socket
  const socket =
    [...io.sockets.sockets.values()].find((s) => s.userData?.user_id === userId) || null;

  // 🌍 derive outbound locale (socket first, then header)
  const outboundLocale = socket?.data?.currentLocale
    ? socket.data.currentLocale
    : resolveLocaleFromRequestHeaders(request);

  // 🧪 pick either a real socket or a fake one with locale+user
  const targetSocket = socket || {
    data: { currentLocale: outboundLocale },
    userData: { user_id: userId }
  };

  try {
    // 🔔 localized notifications
    await createAndDispatchNotification(io, targetSocket, {
      type: 'payment',
      event: null,
      user,
      data: payment
    });

    await createAndDispatchNotification(io, targetSocket, {
      type: 'subscription',
      event: 'created',
      user,
      data: subscription
    });

    // 📦 optional custom event (only emit to room if real socket exists)
    if (socket) {
      io.to(userId).emit('transactionFinished', { user, payment, subscription });
    }

    return response.status(200).json({ ok: true });
  } catch (error) {
    console.error('❌ Failed to create notifications:', error);
    return response.status(500).json({ error: 'Notification creation failed' });
  }
});

/**
 * POST /emit/paymentStatusUpdated
 * -------------------------------
 * 📡 Receives payment status update and emits a localized room event.
 * Body JSON: { userId, orderId, newStatus }
 */
app.post('/emit/paymentStatusUpdated', (request, response) => {
  console.log('🛬 [SOCKET SERVER] POST /emit/paymentStatusUpdated', request.body);

  // 🧭 normalize incoming shapes
  const userId = request.body?.userId || request.body?.user_id || null; // 🆔 room target
  const orderId = request.body?.orderId || request.body?.order_id || null; // 🧾 order
  const newStatus = request.body?.newStatus || request.body?.status || null; // 🔁 status

  // 🛡️ validate after normalization
  if (!userId || !orderId || !newStatus) {
    console.warn('❌ Missing userId, orderId or newStatus (or aliases status/order_id)');
    return response.status(400).json({ error: 'Missing userId, orderId or newStatus' });
  }

  // 📡 emit with consistent payload keys used by the client
  io.to(userId).emit('payment_status_updated', {
    order_id: orderId, // 🧾 keep snake_case for client compatibility
    status: newStatus // 🔁 unify to "status" for listeners
  });
  console.log(`📡 Emitted payment_status_updated → user ${userId}: ${newStatus}`);
  return response.status(200).json({ ok: true });
});

/**
 * POST /emit/errorNotification
 * ----------------------------
 * Body JSON: { target: 'admin'|'user'|'both', user: {...}, error: {...} }
 */
app.post('/emit/errorNotification', async (request, response) => {
  console.log('🛬 [SOCKET SERVER] POST /emit/errorNotification');

  const { target, user, error } = request.body;
  if (!target || !user || !error) {
    return response.status(400).json({ error: 'Missing target, user, or error' });
  }

  const socket = [...io.sockets.sockets.values()].find((s) => s.userData?.user_id === user.user_id);

  if (target === 'admin' || target === 'both') {
    await createAndDispatchNotification(
      io,
      socket || { data: { currentLocale: 'en' }, userData: user },
      {
        type: 'error',
        event: null,
        user,
        data: error
      }
    );
  }
  if (target === 'user' || target === 'both') {
    await createAndDispatchNotification(
      io,
      socket || { data: { currentLocale: 'en' }, userData: user },
      {
        type: 'error',
        event: null,
        user,
        data: error
      }
    );
  }

  return response.status(200).json({ ok: true });
});

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true, service: 'royal-tv-backend' });
});

// ========== Server (HTTP only; TLS via reverse proxy) ==========
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const PORT = Number(process.env.SOCKET_PORT || 3001);

const server = createHttpServer(app);
const protocol = 'http';
console.log('⚙️ Running in HTTP mode (behind Nginx/TLS if in prod)');

// ========== CORS ==========
const defaultOrigin = isProduction ? 'https://royal-tv.tv' : 'http://localhost:3000';
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGINS || defaultOrigin)
  .split(',')
  .map((o) => o.trim());
console.log('🌐 Allowed origins:', CLIENT_ORIGINS);

// ========== Socket.IO init ==========
const io = new Server(server, {
  path: '/socket.io',
  cors: { origin: CLIENT_ORIGINS, credentials: true }
});

// ========== (Optional) Admin UI ==========
if (process.env.ENABLE_ADMIN_UI === 'true') {
  instrument(io, {
    auth: {
      type: 'basic',
      username: process.env.SOCKET_ADMIN_USER,
      password: process.env.SOCKET_ADMIN_PASS
    },
    mode: isProduction ? 'production' : 'development'
  });
  console.log('🔧 Admin UI enabled');
}

// ========== Global state ==========
const globalState = { onlineUsers: {}, activeUsersInLiveRoom: {} };

// ========== Connections ==========
io.on('connection', (socket) => {
  // 🌍 locale handshake + updates
  registerLocaleEvents(io, socket, globalState);

  // 🔔 notifications (will read socket.data.currentLocale)
  registerNotificationEvents(io, socket, globalState);

  // 🧩 any additional handlers
  connectionHandler(io, socket, globalState);
});

// ========== Listen ==========
const runningHost = isProduction ? 'royal-tv.tv' : 'localhost';
server.listen(PORT, () => {
  console.log(`🚀 Socket.IO on ${protocol}://${runningHost}:${PORT} [${NODE_ENV}]`);
});

// 🟢 export for reuse in other servers/modules if needed
export { io };
