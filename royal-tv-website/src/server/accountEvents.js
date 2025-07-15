/**
 * ========== src/server/events/accountEvents.js ==========
// 🎫 SOCKET.IO Account Events – Free Trials & Subscriptions (Royal TV)
// - Handles:
//    1️⃣ fetch_free_trials        → User fetches their own free trial status
//    2️⃣ fetch_full_free_trials   → User fetches their full free trial object
//    3️⃣ freeTrials_updated       → Admin notifies user(s) of a trial status change
// - Emits real-time updates to user dashboards and admin panels.
 * ========================================================
 */

import prisma from '../lib/prisma.js';

export default function registerAccountEvents(io, socket) {
  // 1️⃣ FETCH FREE TRIAL STATUS (USER-SIDE)
  socket.on('fetch_free_trial_status', async () => {
    const freeTrial = await prisma.freeTrial.findFirst({
      where: { user_id: socket.userData.user_id },
      select: { status: true }
    });
    // 🟢 Log: Status fetch and emit
    console.log(
      `🔎 [SOCKET] User ${socket.userData?.user_id} requested free_trial_status – emitted free_trial_status:`,
      freeTrial ? freeTrial.status : null
    );
    socket.emit('free_trial_status', freeTrial ? freeTrial.status : null);
  });

  // 2️⃣ FETCH FULL FREE TRIAL OBJECT (USER-SIDE)
  socket.on('fetch_full_free_trial', async () => {
    const freeTrial = await prisma.freeTrial.findFirst({
      where: { user_id: socket.userData.user_id }
    });
    // 📦 Log: Full object fetch and emit
    console.log(
      `🗃️ [SOCKET] User ${socket.userData?.user_id} requested full_free_trial – emitted full_free_trial:`,
      !!freeTrial
    );
    socket.emit('full_free_trial', freeTrial || null);
  });

  // 3️⃣ ADMIN: NOTIFY USER(S) AFTER TRIAL STATUS CHANGE
  socket.on('free_trial_status_update', async ({ user_id }) => {
    const freeTrial = await prisma.freeTrial.findFirst({
      where: { user_id },
      select: { status: true }
    });
    // 📨 Log: Admin status update and emit
    console.log(
      `✉️ [SOCKET] Admin updated free_trial_status for user ${user_id} – emitted free_trial_status:`,
      freeTrial ? freeTrial.status : null
    );
    io.to(user_id).emit('free_trial_status', freeTrial ? freeTrial.status : null);
  });
}
