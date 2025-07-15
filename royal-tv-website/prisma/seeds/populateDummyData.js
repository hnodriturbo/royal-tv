/**
 *   =================== prisma/seeds/populateDummyData.js ===================
 * 🎬 ROYAL TV DUMMY DATA SEEDER
 * ---------------------------------------------------------------------------
 * - Populates:
 *    • LiveChatConversation & LiveChatMessage (all non-admins)
 *    • FreeTrial (selected users only, half active, half pending)
 *    • Subscription & SubscriptionPayment (selected users only)
 * - 🚫 BubbleChat logic removed!
 * - Does NOT seed notifications! (Use a separate file for that)
 * ===========================================================================

 * ...imports and helpers remain unchanged...
 */

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// 🆔 ALL user IDs (admin last)
const userIds = [
  '308f62cd-ef64-4a4b-8215-0d78a14e2cd9',
  '36431b44-22c2-4ab7-87e5-c053dee08781',
  '83a42c6e-dc79-4615-89af-d50032f7a250',
  '8f9db3dd-7983-466e-9d38-b949c56e412d',
  'be1983f2-04e3-48f9-9145-028ecbdb647e',
  'd09e9558-3a60-4c99-a4a2-b53c8d4e5478',
  'd630e143-cf4c-499c-a3f0-d4b4ddc7768c', // Admin Support
  'd655cdab-559a-4be4-a7b8-858bec23b490',
  'e2c4f761-0500-42ff-934b-88d03b60c519',
  'e919ce2d-d6c3-455d-b4b8-f33bba40d841',
  'fcf99a2c-4607-40c3-9bac-0a5bb5e4ed33'
];

// 👑 Admin User ID
const adminUserId = 'd630e143-cf4c-499c-a3f0-d4b4ddc7768c';

/**
 * 🟦 Only these users get FreeTrial + Subscription
 */
const freeTrialAndSubUserIds = [
  '83a42c6e-dc79-4615-89af-d50032f7a250', // user_1
  '308f62cd-ef64-4a4b-8215-0d78a14e2cd9', // user_2
  '8f9db3dd-7983-466e-9d38-b949c56e412d', // user_3
  'be1983f2-04e3-48f9-9145-028ecbdb647e', // user_4
  'd655cdab-559a-4be4-a7b8-858bec23b490' // user_5
];

/* =============== Helper Functions remain unchanged =============== */

// 💬 Random subject for conversations
function randomSubject() {
  const subjects = [
    'Subscription issue',
    'Technical support',
    'Billing question',
    'General Inquiry'
  ];
  return subjects[Math.floor(Math.random() * subjects.length)];
}

// 💬 Random message content
function randomMessage(isAdmin = false) {
  const userMessages = [
    'Hi, I have an issue.',
    'Can you help me with my subscription?',
    'How does this work exactly?',
    'Thank you for your quick response!',
    'Please assist me ASAP.',
    'I have another question regarding payment.'
  ];
  const adminMessages = [
    'Hello, how can I help you?',
    'Your subscription details have been updated.',
    'Please check your email for further details.',
    'Glad I could help!',
    'Please clarify your issue.',
    'We will resolve your problem shortly.'
  ];
  return isAdmin
    ? adminMessages[Math.floor(Math.random() * adminMessages.length)]
    : userMessages[Math.floor(Math.random() * userMessages.length)];
}

// 📅 Recent random date generator (within N days)
function randomRecentDate(days = 10) {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * days);
  return new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
}

/* =============== Main Seeder Function =============== */

async function seedData() {
  console.log('⏳ Starting Royal TV dummy data seeding...');

  // Filter out admin for chat/ft/sub loops
  const nonAdminUserIds = userIds.filter((id) => id !== adminUserId);

  // ──────────────────────────────────────────────────────────────
  // 1️⃣ LIVECHAT for ALL non-admin users
  // ──────────────────────────────────────────────────────────────
  for (const userId of nonAdminUserIds) {
    // 💬 6 LiveChatConversations per user (each with 10 messages)
    for (let i = 0; i < 6; i++) {
      const liveConvo = await prisma.liveChatConversation.create({
        data: {
          owner_id: userId,
          subject: randomSubject(),
          read: false
        }
      });

      // 💬 10 alternating user/admin messages per convo
      for (let j = 0; j < 10; j++) {
        const isAdminMsg = j % 2 !== 0;
        await prisma.liveChatMessage.create({
          data: {
            conversation_id: liveConvo.conversation_id,
            sender_id: isAdminMsg ? adminUserId : userId,
            sender_is_admin: isAdminMsg,
            message: randomMessage(isAdminMsg),
            status: 'sent'
          }
        });
      }
    }

    // 🚫 BubbleChat seeding removed!
  }

  // ──────────────────────────────────────────────────────────────
  // 2️⃣ FREETRIAL: Only selected users, alternating active/pending
  // ──────────────────────────────────────────────────────────────
  for (let i = 0; i < freeTrialAndSubUserIds.length; i++) {
    const userId = freeTrialAndSubUserIds[i];
    // 🎲 Alternate active/pending for realism
    const status = i % 2 === 0 ? 'active' : 'pending';
    await prisma.freeTrial.create({
      data: {
        user_id: userId,
        free_trial_username: `user${userId.slice(0, 4)}`,
        free_trial_password: `pass${userId.slice(-4)}`,
        free_trial_url: `https://trial.example.com/${userId.slice(0, 8)}`,
        free_trial_other: 'Seeder test access',
        additional_info: status === 'active' ? 'Seeder (active)' : 'Seeder (pending)',
        startDate: status === 'active' ? randomRecentDate(7) : null,
        status,
        claimedAt: randomRecentDate(10),
        createdAt: randomRecentDate(10),
        updatedAt: new Date()
      }
    });
  }

  // ──────────────────────────────────────────────────────────────
  // 3️⃣ SUBSCRIPTION (+Payment): Only for selected users, 1 active & 1 pending each
  // ──────────────────────────────────────────────────────────────
  for (const userId of freeTrialAndSubUserIds) {
    // 🔁 Each gets 1 active and 1 pending subscription
    for (let s = 0; s < 2; s++) {
      const isActive = s === 0;
      const status = isActive ? 'active' : 'pending';
      const now = new Date();
      const startDate = isActive ? randomRecentDate(14) : null;
      const endDate = isActive ? new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) : null;
      const subscription = await prisma.subscription.create({
        data: {
          user_id: userId,
          order_id: `order_${userId.slice(0, 4)}_${status}`,
          subscription_username: `subuser_${userId.slice(-4)}`,
          subscription_password: `subpass_${userId.slice(0, 4)}`,
          subscription_url: `https://iptv.example.com/${userId.slice(0, 6)}`,
          subscription_other: 'VIP customer',
          additional_info: isActive
            ? 'Auto-generated active subscription'
            : 'Auto-generated pending subscription',
          status,
          startDate,
          endDate,
          createdAt: randomRecentDate(15),
          updatedAt: new Date()
        }
      });

      // 💳 Payment aligned with subscription
      const isPaid = isActive;
      await prisma.subscriptionPayment.create({
        data: {
          user_id: userId,
          subscription_id: subscription.subscription_id,
          payment_id: `pay_${userId.slice(-4)}_${status}_${s}`,
          order_id: subscription.order_id,
          invoice_id: `inv_${userId.slice(-6)}_${status}_${s}`,
          status: isPaid ? 'finished' : 'waiting',
          currency: 'BTC',
          amount_paid: 0.00213,
          amount_received: isPaid ? 0.00213 : null,
          pay_currency: 'BTC',
          pay_address: `1A${userId.slice(0, 6)}btcaddress${s}`,
          network: 'BTC',
          received_at: isPaid ? new Date() : null,
          createdAt: randomRecentDate(10),
          updatedAt: new Date()
        }
      });
    }
  }

  console.log('✅ Dummy data (chat + freeTrial + subscriptions) seeded!');
}

// 🏁 RUN IT!
seedData()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
