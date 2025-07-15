/**
 *   =============== server.js ===============
 * 🚦
 * MAIN ENTRY POINT (Start Socket + Expiry Timer)
 * =============================================
 */

import './src/lib/socketServer.js'; // Your Socket.IO server
import { sweepExpiredTrialsAndSubs } from './src/lib/expireServer.js';

// 🕒 Interval (e.g. 1 hour)
const ONE_HOUR = 60 * 60 * 1000;

// Run every hour
setInterval(() => {
  sweepExpiredTrialsAndSubs().catch(console.error);
}, ONE_HOUR);

// Run once at server startup
sweepExpiredTrialsAndSubs().catch(console.error);

console.log('🎯 [Main server] Socket.IO and expiry sweeper are both running.');
