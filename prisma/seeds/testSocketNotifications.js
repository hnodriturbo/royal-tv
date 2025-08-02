/**
 * ========== testNotificationsOverSocket.js ==========
 * 🔔 Royal TV — End-to-End Notification Socket Tester
 * - For each pre-seeded test user, fetches their events
 * - Emits create_notification_for_both with real event/user data
 * - Prints every response for debugging!
 * ================================================
 */

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { io } from 'socket.io-client';

const prisma = new PrismaClient();

const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:3001';
const ADMIN_USER_ID = process.env.ADMIN_USER_ID || '62e54542-ffa9-424b-8898-1ec61dda95de';

const freeTrialAndSubUserIds = [
  'e5c6b345-ab55-4874-98d4-20e75cf8fe8c',
  '2485f5fa-1e4a-4735-a00b-8888a2dccf00',
  '540b7f6e-2df6-4ccf-a94c-e287ec68b299',
  'e2bf144c-2aab-41ab-8841-51d9647198d0',
  '5de2d9b6-c260-47ad-87b4-b257de9d7dc6'
];

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

async function main() {
  const socket = io(SOCKET_URL, {
    transports: ['websocket'],
    reconnectionAttempts: 3
  });

  socket.on('connect', async () => {
    console.log('✅ Connected to Socket.IO backend at', SOCKET_URL);

    socket.on('notification_created', (payload) => {
      console.log('🟢 notification_created:', JSON.stringify(payload, null, 2));
    });
    socket.on('notifications_error', (err) => {
      console.log('🔴 notifications_error:', JSON.stringify(err, null, 2));
    });
    socket.on('notification_received', (notif) => {
      console.log('🔔 notification_received:', JSON.stringify(notif, null, 2));
    });

    for (const user_id of freeTrialAndSubUserIds) {
      console.log(`\n🔹 Testing notifications for USER_ID: ${user_id}`);

      // 1️⃣ Fetch user
      const user = await prisma.user.findUnique({ where: { user_id } });
      if (!user) {
        console.warn(`⚠️  User not found: ${user_id}`);
        continue;
      }

      // 2️⃣ Fetch real FreeTrials, Subscriptions, Payments
      const freeTrials = await prisma.freeTrial.findMany({ where: { user_id } });
      const subscriptions = await prisma.subscription.findMany({ where: { user_id } });
      const payments = await prisma.subscriptionPayment.findMany({ where: { user_id } });

      // 3️⃣ Fetch latest LiveChatConversation and message
      const liveChatConversation = await prisma.liveChatConversation.findFirst({
        where: { owner_id: user_id },
        orderBy: { createdAt: 'desc' }
      });
      const liveChatMessage = liveChatConversation
        ? await prisma.liveChatMessage.findFirst({
            where: { conversation_id: liveChatConversation.conversation_id },
            orderBy: { createdAt: 'desc' }
          })
        : null;

      // 4️⃣ Fetch latest BubbleChatConversation and message
      const bubbleChatConversation = await prisma.bubbleChatConversation.findFirst({
        where: { owner_id: user_id },
        orderBy: { createdAt: 'desc' }
      });
      const bubbleChatMessage = bubbleChatConversation
        ? await prisma.bubbleChatMessage.findFirst({
            where: { conversation_id: bubbleChatConversation.conversation_id },
            orderBy: { createdAt: 'desc' }
          })
        : null;

      // ========== EMIT NOTIFICATIONS OVER SOCKET ==========

      // 👤 USER registration notification
      await emitAndLog(socket, 'newUserRegistration', {}, user);

      // 📝 FREE TRIALS (send for all, by status)
      for (const ft of freeTrials) {
        await emitAndLog(socket, 'freeTrial', { event: 'requested', data: ft }, user);
        if (ft.status === 'active') {
          await emitAndLog(socket, 'freeTrial', { event: 'activated', data: ft }, user);
        }
      }

      // 💳 SUBSCRIPTIONS (all, by status)
      for (const sub of subscriptions) {
        await emitAndLog(socket, 'subscription', { event: 'created', data: sub }, user);
        if (sub.status === 'active') {
          await emitAndLog(socket, 'subscription', { event: 'activated', data: sub }, user);
        }
      }

      // 💰 PAYMENTS (all)
      for (const pay of payments) {
        await emitAndLog(socket, 'payment', { data: pay }, user);
      }

      // 💬 LIVE CHAT (last only)
      if (liveChatConversation && liveChatMessage) {
        await emitAndLog(
          socket,
          'liveChatMessage',
          { data: { ...liveChatMessage, ...liveChatConversation } },
          user
        );
      }

      // 💬 BUBBLE CHAT (last only)
      if (bubbleChatConversation && bubbleChatMessage) {
        await emitAndLog(
          socket,
          'bubbleChatMessage',
          { data: { ...bubbleChatMessage, ...bubbleChatConversation } },
          user
        );
      }

      await wait(800); // For readable logs, avoid overlapping
    }

    setTimeout(() => {
      console.log('\n✅ All notification events tested. Closing connection...');
      socket.close();
      process.exit(0);
    }, 2500);
  });

  socket.on('connect_error', (err) => {
    console.error('❌ Could not connect:', err.message);
    process.exit(1);
  });
}

// Helper to emit and log:
async function emitAndLog(socket, type, { event, data }, user) {
  const payload = {
    type,
    event,
    user,
    data
  };
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
  console.log(
    `\n➡️  Emitting create_notification_for_both (${type}${event ? '_' + event : ''}) for ${user.user_id}`
  );
  console.log(JSON.stringify(payload, null, 2));
  socket.emit('create_notification_for_both', payload);
  await new Promise((res) => setTimeout(res, 300));
}

main();
