// 🎫 src/server/events/freeTrialEvents.js
/**
 * registerFreeTrialEvents
 * -----------------------
 * Fetches & broadcasts FreeTrial[] for this user.
 */
export default function registerFreeTrialEvents(io, socket, prisma) {
  socket.on('fetch_free_trials', async () => {
    try {
      const trials = await prisma.freeTrial.findMany({
        where: { user_id: socket.userData.user_id },
        orderBy: { claimedAt: 'desc' },
      });
      socket.emit('freeTrials_update', trials);
    } catch (err) {
      console.error('❌ fetch_free_trials failed', err);
    }
  });
}
