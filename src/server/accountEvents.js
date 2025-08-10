/**
 * ========== src/server/accountEvents.js ==========
 * 📦 SOCKET.IO – Subscription + Payment + Free Trial Events (Royal TV)
 *
 * Handles:
 *  - 📋 fetch_subscriptions                   → Get all subscriptions for current user
 *  - 📊 fetch_subscription_status             → Get latest status for active/pending sub
 *  - 💸 fetch_subscription_payment            → Get payment record by order_id
 *  - 💵 fetch_subscription_payment_status     → Get payment status by order_id only
 *  - 🆕 emit_subscription_created             → Backend emits: new subscription created
 *  - 🔄 emit_payment_status_updated           → Backend emits: payment status updated
 *  - 🧪 fetch_free_trial_status               → Get user's free trial status (simple)
 *  - 📦 fetch_full_free_trial                 → Get user's full free trial object
 *  - ✉️ free_trial_status_update              → Admin/backend notifies user of free trial status change
 *
 * Emits:
 *  - subscriptions_list
 *  - subscription_status
 *  - subscription_payment
 *  - subscription_payment_status
 *  - subscription_created
 *  - payment_status_updated
 *  - free_trial_status
 *  - full_free_trial
 * ======================================================
 */

import prisma from '../lib/core/prisma.js';
import logger from '../lib/core/logger.js'; // 🪵 Centralized logger for all logs

export default function registerAccountEvents(io, socket) {
  /* ------------- Subscription Socket Events ------------- */

  // 📋 Get all subscriptions for the current user
  socket.on('fetch_subscriptions', async () => {
    // Query the database for all subscriptions of the user
    const subscriptions = await prisma.subscription.findMany({
      where: { user_id: socket.userData?.user_id },
      orderBy: { createdAt: 'desc' }
    });
    // Log the fetch action
    logger.socket(
      `📋 [SOCKET] ${socket.userData?.name || socket.userData?.user_id} fetched all subscriptions.`
    );
    // Send the subscriptions list back to the client
    socket.emit('subscriptions_list', subscriptions);
  });

  // 📊 Get the status for a specific subscription by subscription_id (with user check)
  socket.on('fetch_subscription_status', async ({ subscription_id }) => {
    // Fetch the specific subscription for this user only
    const subscription = await prisma.subscription.findUnique({
      where: { subscription_id },
      select: { status: true, subscription_id: true, user_id: true }
    });

    // Security: Only allow if it belongs to the current user
    if (!subscription || subscription.user_id !== socket.userData?.user_id) {
      logger.socket(
        `⛔ [SOCKET] ${socket.userData?.name || socket.userData?.user_id} tried to fetch status for unauthorized or missing subscription: ${subscription_id}`
      );
      socket.emit('subscription_status', null);
      return;
    }

    logger.socket(
      `📊 [SOCKET] ${socket.userData?.name || socket.userData?.user_id} fetched subscription status for ${subscription_id}:`,
      subscription.status
    );

    // Emit the found subscription status (no user_id for privacy)
    socket.emit('subscription_status', {
      subscription_id: subscription.subscription_id,
      status: subscription.status
    });
  });

  // 💸 Get the full payment record for a given order_id
  socket.on('fetch_subscription_payment', async ({ order_id }) => {
    // Find the payment record for the provided order_id
    const payment = await prisma.subscriptionPayment.findUnique({ where: { id: order_id } });

    logger.socket(
      `💸 [SOCKET] ${socket.userData?.name || socket.userData?.user_id} fetched subscription payment for order ${order_id}:`,
      payment ? payment.status : null
    );

    // Emit the payment object to the client (you may want to check ownership here as well)
    socket.emit('subscription_payment', payment || null);
  });

  // 💵 Get only the payment status for a given order_id
  socket.on('fetch_subscription_payment_status', async ({ order_id }) => {
    // Get the payment status field for the provided order_id
    const payment = await prisma.subscriptionPayment.findUnique({
      where: { id: order_id },
      select: { status: true }
    });

    logger.socket(
      `💵 [SOCKET] ${socket.userData?.name || socket.userData?.user_id} fetched payment status for order ${order_id}:`,
      payment ? payment.status : null
    );

    // Emit just the status (and order_id) to the client
    socket.emit('subscription_payment_status', {
      order_id,
      status: payment?.status || null
    });
  });

  // 🆕 Notify the user when a new subscription is created (backend/admin only)
  socket.on('emit_subscription_created', ({ subscription }) => {
    // Safety check: require subscription object and user_id
    if (!subscription || !subscription.user_id) return;
    logger.socket(`🆕 [SOCKET] Emitting subscription_created for user ${subscription.user_id}`);
    // Send the subscription_created event to the specific user
    io.to(subscription.user_id).emit('subscription_created', subscription);
  });

  // 🔄 Notify the user when payment status is updated (usually by IPN/backend)
  socket.on('emit_payment_status_updated', ({ user_id: target_id, order_id, status }) => {
    // Require all necessary fields
    if (!target_id || !order_id || !status) return;
    logger.socket(
      `🔄 [SOCKET] Emitting payment_status_updated for user ${target_id}, order ${order_id}:`,
      status
    );
    // Emit the update to the affected user
    io.to(target_id).emit('payment_status_updated', { order_id, status });
  });

  /* ------------- Free Trial Socket Events ------------- */

  // 🧪 Free Trial: User requests status only
  socket.on('fetch_free_trial_status', async () => {
    const freeTrial = await prisma.freeTrial.findFirst({
      where: { user_id: socket.userData.user_id },
      select: { status: true }
    });
    // 🟢 Log: Status fetch and emit
    logger.socket(
      `🔎 [SOCKET] User ${socket.userData?.name} requested free_trial_status – emitted free_trial_status:`,
      freeTrial ? freeTrial.status : null
    );
    socket.emit('free_trial_status', freeTrial ? freeTrial.status : null);
  });

  // 📦 User requests the full free trial object
  socket.on('fetch_full_free_trial', async () => {
    const freeTrial = await prisma.freeTrial.findFirst({
      where: { user_id: socket.userData.user_id }
    });
    // 📦 Log: Full object fetch and emit
    logger.socket(
      `🗃️ [SOCKET] User ${socket.userData?.name || socket.userData?.user_id} requested full_free_trial – emitted full_free_trial:`,
      !!freeTrial
    );
    socket.emit('full_free_trial', freeTrial || null);
  });

  // ✉️ Admin triggers a free trial status update notification to a user
  socket.on('free_trial_status_update', async ({ user_id }) => {
    const freeTrial = await prisma.freeTrial.findFirst({
      where: { user_id },
      select: { status: true }
    });
    // ✉️ Log: Admin status update and emit
    logger.socket(
      `✉️ [SOCKET] Admin updated free_trial_status for user ${user_id} – emitted free_trial_status:`,
      freeTrial ? freeTrial.status : null
    );
    io.to(user_id).emit('free_trial_status', freeTrial ? freeTrial.status : null);
  });
}
