// 💳 src/server/events/subscriptionEvents.js

/**
 * registerSubscriptionEvents
 * --------------------------
 * Handles real-time fetching and broadcasting of Subscription[] for the connected user.
 *
 * Events:
 *  • fetch_subscriptions     → client asks for current list of subscriptions
 *  • subscriptions_update    → server sends back an array of Subscription objects
 *
 * Usage:
 *   socket.emit('fetch_subscriptions');
 *   socket.on('subscriptions_update', (subs) => { … });
 */
export default function registerSubscriptionEvents(io, socket, prisma) {
  socket.on('fetch_subscriptions', async () => {
    try {
      // Only fetch subscriptions belonging to the authenticated user
      const subs = await prisma.subscription.findMany({
        where: { user_id: socket.userData.user_id },
        orderBy: { createdAt: 'desc' },
      });
      // Send the updated list back to this client
      socket.emit('subscriptions_update', subs);
    } catch (err) {
      console.error('❌ fetch_subscriptions failed', err);
    }
  });

  // (Optional) If you have admin views or want to broadcast changes:
  //
  // socket.on('update_subscription', async ({ subscription_id, data }) => {
  //   // e.g. only admins can update certain fields
  //   // await prisma.subscription.update({ where: { subscription_id }, data });
  //   // then emit updated list:
  //   // const subs = await prisma.subscription.findMany({ … });
  //   // socket.emit('subscriptions_update', subs);
  // });
}
