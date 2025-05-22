// 🎫 mergedAccountEvents.js – Free Trials & Subscriptions (Royal-TV)
// ---------------------------------------------------------------
// Handles fetches for free trials & subscriptions in a single unified file
// Both are used for badge numbers and notification logic for admin/user dashboards.

export default function registerAccountEvents(io, socket, prisma) {
  // 1️⃣ Fetch all FreeTrials for this user
  socket.on('fetch_free_trials', async () => {
    try {
      const trials = await prisma.freeTrial.findMany({
        where: { user_id: socket.userData.user_id },
        orderBy: { claimedAt: 'desc' }
      });
      socket.emit('freeTrials_update', trials);
    } catch (err) {
      console.error('❌ fetch_free_trials failed', err);
    }
  });

  // 2️⃣ Fetch all Subscriptions for this user
  socket.on('fetch_subscriptions', async () => {
    try {
      const subs = await prisma.subscription.findMany({
        where: { user_id: socket.userData.user_id },
        orderBy: { createdAt: 'desc' }
      });
      socket.emit('subscriptions_update', subs);
    } catch (err) {
      console.error('❌ fetch_subscriptions failed', err);
    }
  });

  // (Optional future admin actions can be added here)
}
