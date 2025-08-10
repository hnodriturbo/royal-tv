/**
 * ========== seedErrorNotifications.js ==========
 * 🔔 Royal TV – Custom Error Notification Seeder
 * - Seeds explicit error notifications for:
 *   1. Admin-only
 *   2. User-only
 *   3. Both Admin & User
 * ===============================================
 */

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

import { userNotificationBuilder, adminNotificationBuilder } from './notificationSystem.js';

// 👑 Admin recipient
const adminUserId = 'd630e143-cf4c-499c-a3f0-d4b4ddc7768c';
// 👤 Target test user
const targetUserId = '0038bb49-5d65-423a-a55c-445c064dccc8';

// 🧪 Strict error object builder
function buildCustomError(errorTitle, errorMessage, errorDetails) {
  return {
    errorTitle: String(errorTitle),
    errorMessage: String(errorMessage),
    errorDetails: String(errorDetails ?? '')
  };
}

async function main() {
  const user = await prisma.user.findUnique({ where: { user_id: targetUserId } });
  if (!user) {
    console.error(`❌ No user found with ID: ${targetUserId}`);
    return;
  }

  // 🎯 Explicit test error payloads
  const adminOnlyError = buildCustomError(
    'Live Chat Delivery Failure',
    'livechat.delivery_failed',
    'conversation_id=conv_abc123 | message_id=msg_789 | retry=true'
  );

  const userOnlyError = buildCustomError(
    'Payment Gateway Timeout',
    'payment.timeout',
    'gateway=nowpayments | timeout_ms=15000 | payment_id=pay_test_001'
  );

  const bothError = buildCustomError(
    'MegaOTT Template Missing',
    'validation.template_not_found',
    'template_id=999 | order_id=ORDER-TEST-0001'
  );

  // =========================================================
  // 🦸 Admin-only error notification
  // =========================================================
  {
    const notifAdmin = adminNotificationBuilder.error(user, adminOnlyError);
    await prisma.notification.create({
      data: {
        user_id: adminUserId,
        title: notifAdmin.title,
        body: notifAdmin.body,
        link: notifAdmin.link || null,
        type: notifAdmin.type,
        is_read: false
      }
    });
    console.log(`✅ Admin-only error seeded`);
  }

  // =========================================================
  // 👤 User-only error notification
  // =========================================================
  {
    const notifUser = userNotificationBuilder.error(user, userOnlyError);
    await prisma.notification.create({
      data: {
        user_id: targetUserId,
        title: notifUser.title,
        body: notifUser.body,
        link: notifUser.link || null,
        type: notifUser.type,
        is_read: false
      }
    });
    console.log(`✅ User-only error seeded`);
  }

  // =========================================================
  // 🤝 Both Admin & User error notifications
  // =========================================================
  {
    // 👤 User version
    const notifUser = userNotificationBuilder.error(user, bothError);
    await prisma.notification.create({
      data: {
        user_id: targetUserId,
        title: notifUser.title,
        body: notifUser.body,
        link: notifUser.link || null,
        type: notifUser.type,
        is_read: false
      }
    });

    console.log('🔍 userNotificationBuilder.error (both/user) →', {
      title: notifUser?.title,
      body: notifUser?.body,
      type: notifUser?.type,
      link: notifUser?.link
    });

    // 👑 Admin version
    const notifAdmin = adminNotificationBuilder.error(user, bothError);
    await prisma.notification.create({
      data: {
        user_id: adminUserId,
        title: notifAdmin.title,
        body: notifAdmin.body,
        link: notifAdmin.link || null,
        type: notifAdmin.type,
        is_read: false
      }
    });

    console.log(`✅ Both-sides error seeded`);
  }

  console.log('🎯 All custom error notifications seeded successfully.');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
