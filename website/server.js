/**
 *   =============== server.js ===============
 * 🚦
 * MAIN ENTRY POINT (Start Socket + Expiry Timer)
 * =============================================
 */

/**
 * 🛡️ Console Logging Filter
 * -------------------------
 * Globally wraps console.log/warn/info/debug to control server logs
 * - Production: Logs disabled by default (NODE_ENV=production)
 * - Override: Set SERVER_LOGS=true to force enable in production
 * - Development: Always enabled
 */

/* const isDev = process.env.NODE_ENV !== 'production'; */
const enableServerSideLogs = process.env.SERVER_LOGS === 'true';
/* const isLoggingEnabled = isDev || enableServerSideLogs; */

if (!enableServerSideLogs) {
  console.log = () => {};
  console.warn = () => {};
  console.info = () => {};
  console.debug = () => {};
  // ✅ console.error stays active
}

// 🔐 Load environment variables FIRST (before any imports that use them)
/* import { config } from 'dotenv';
config(); // Loads .env file */

import './src/lib/server/socketServer.js'; // Your Socket.IO server
import {
  sweepAndExpireSubscriptions,
  sweepAndExpireFreeTrials
} from './src/lib/server/expireServer.js';

const ONE_HOUR = 60 * 60 * 1000;

// 🧹 Helper to run both sweepers with nice log
async function runSweepers() {
  await sweepAndExpireFreeTrials();
  await sweepAndExpireSubscriptions();
}

// 🕒 Run every hour
setInterval(async () => {
  try {
    await runSweepers();
  } catch (error) {
    console.error('❌ [Sweeper Error]:', error);
  }
}, ONE_HOUR);

// 🚀 Run immediately on startup
(async () => {
  try {
    await runSweepers();
  } catch (error) {
    console.error('❌ [Sweeper Error]:', error);
  }
})();

console.log('🎯 [Main server] Socket.IO and expiry sweeper are both running.');
