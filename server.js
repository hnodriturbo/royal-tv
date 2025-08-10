/**
 *   =============== server.js ===============
 * 🚦
 * MAIN ENTRY POINT (Start Socket + Expiry Timer)
 * =============================================
 */

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
setInterval(() => {
  runSweepers().catch(console.error);
}, ONE_HOUR);

// 🚀 Run immediately on startup
runSweepers().catch(console.error);

console.log('🎯 [Main server] Socket.IO and expiry sweeper are both running.');
